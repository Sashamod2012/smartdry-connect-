from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import math
import random
import time
import bcrypt
import jwt
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="SmartDry Connect API")
api_router = APIRouter(prefix="/api")

SIMULATED_DISCLAIMER = "SIMULATED / DEMO DATA — NOT PILOT RESULTS"

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_HOURS = 12


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_HOURS), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"email": payload.get("email")}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def seed_admin():
    admin_email = os.environ["ADMIN_EMAIL"].lower().strip()
    admin_password = os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Folasade Amodu",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info("Seeded admin account %s", admin_email)
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})


class Batch(BaseModel):
    model_config = ConfigDict(extra="ignore")
    batch_id: str
    product: str
    starting_weight_kg: float
    tray_quantity: int
    operator: str
    drying_method: str
    start_datetime: str
    status: str = "RUNNING"  # IDLE / RUNNING / PAUSED / COMPLETE / ABORTED
    final_weight_kg: Optional[float] = None
    duration_hours: Optional[float] = None
    traceability_status: str = "QR Issued"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class BatchCreate(BaseModel):
    batch_id: Optional[str] = None
    product: str
    starting_weight_kg: float
    tray_quantity: int
    operator: str
    drying_method: str
    start_datetime: Optional[str] = None


class BatchUpdate(BaseModel):
    status: Optional[str] = None
    final_weight_kg: Optional[float] = None
    duration_hours: Optional[float] = None
    traceability_status: Optional[str] = None


SEED_BATCHES = [
    {"batch_id": "SDC-2026-083", "product": "Catfish", "starting_weight_kg": 120.0, "final_weight_kg": 38.4, "tray_quantity": 24, "operator": "A. Balogun", "drying_method": "Hybrid LPG Hot-Air (Solar-Assist Controls)", "duration_hours": 9.5, "status": "COMPLETE", "days_ago": 9},
    {"batch_id": "SDC-2026-084", "product": "Ginger", "starting_weight_kg": 90.0, "final_weight_kg": 21.6, "tray_quantity": 20, "operator": "C. Eze", "drying_method": "Hybrid LPG Hot-Air (Solar-Assist Controls)", "duration_hours": 8.0, "status": "COMPLETE", "days_ago": 7},
    {"batch_id": "SDC-2026-085", "product": "Pepper", "starting_weight_kg": 75.0, "final_weight_kg": 16.1, "tray_quantity": 18, "operator": "A. Balogun", "drying_method": "LPG Boost Mode", "duration_hours": 7.2, "status": "COMPLETE", "days_ago": 6},
    {"batch_id": "SDC-2026-086", "product": "Tomatoes", "starting_weight_kg": 110.0, "final_weight_kg": 14.3, "tray_quantity": 24, "operator": "F. Adeyemi", "drying_method": "Hybrid LPG Hot-Air (Solar-Assist Controls)", "duration_hours": 8.8, "status": "COMPLETE", "days_ago": 4},
    {"batch_id": "SDC-2026-087", "product": "Herbs", "starting_weight_kg": 40.0, "final_weight_kg": 9.2, "tray_quantity": 12, "operator": "C. Eze", "drying_method": "Solar-Assist Eco Mode", "duration_hours": 4.5, "status": "COMPLETE", "days_ago": 3},
    {"batch_id": "SDC-2026-088", "product": "Grains", "starting_weight_kg": 150.0, "final_weight_kg": 132.0, "tray_quantity": 24, "operator": "F. Adeyemi", "drying_method": "LPG Boost Mode", "duration_hours": 6.0, "status": "COMPLETE", "days_ago": 2},
    {"batch_id": "SDC-2026-089", "product": "Fruits", "starting_weight_kg": 95.0, "final_weight_kg": 22.8, "tray_quantity": 22, "operator": "A. Balogun", "drying_method": "Hybrid LPG Hot-Air (Solar-Assist Controls)", "duration_hours": 8.4, "status": "COMPLETE", "days_ago": 1},
    {"batch_id": "SDC-2026-090", "product": "Vegetables", "starting_weight_kg": 85.0, "final_weight_kg": None, "tray_quantity": 24, "operator": "C. Eze", "drying_method": "Hybrid LPG Hot-Air (Solar-Assist Controls)", "duration_hours": None, "status": "RUNNING", "days_ago": 0},
]


async def seed_batches():
    count = await db.batches.count_documents({})
    if count > 0:
        return
    now = datetime.now(timezone.utc)
    docs = []
    for b in SEED_BATCHES:
        start = now - timedelta(days=b["days_ago"], hours=random.randint(1, 6))
        docs.append({
            "batch_id": b["batch_id"],
            "product": b["product"],
            "starting_weight_kg": b["starting_weight_kg"],
            "final_weight_kg": b["final_weight_kg"],
            "tray_quantity": b["tray_quantity"],
            "operator": b["operator"],
            "drying_method": b["drying_method"],
            "start_datetime": start.isoformat(),
            "status": b["status"],
            "duration_hours": b["duration_hours"],
            "traceability_status": "QR Issued" if b["status"] == "COMPLETE" else "QR Pending",
            "created_at": start.isoformat(),
        })
    await db.batches.insert_many(docs)
    logger.info("Seeded %d demo batches", len(docs))


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await seed_admin()
    await seed_batches()


@api_router.get("/")
async def root():
    return {"message": "SmartDry Connect API", "tagline": "Monitor. Trace. Grow."}


class LoginRequest(BaseModel):
    email: str
    password: str


@api_router.post("/auth/login")
async def login(payload: LoginRequest, request: Request, response: Response):
    email = payload.email.lower().strip()
    identifier = email
    attempts = await db.login_attempts.find_one({"identifier": identifier})
    if attempts and attempts.get("count", 0) >= 5:
        locked_until = attempts.get("locked_until")
        if locked_until and datetime.fromisoformat(locked_until) > datetime.now(timezone.utc):
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in a few minutes.")
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1}, "$set": {"locked_until": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()}},
            upsert=True,
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await db.login_attempts.delete_one({"identifier": identifier})
    token = create_access_token(str(user["_id"]), email)
    response.set_cookie(key="access_token", value=token, httponly=True, secure=True, samesite="none", max_age=ACCESS_TOKEN_HOURS * 3600, path="/")
    return {"email": email, "name": user.get("name"), "role": user.get("role")}


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"message": "Logged out"}


@api_router.get("/auth/me")
async def auth_me(user: dict = Depends(get_current_user)):
    return user


@api_router.get("/telemetry")
async def get_telemetry():
    t = time.time()
    temp = 58.5 + 5.5 * math.sin(t / 45) + random.uniform(-0.6, 0.6)
    humidity = 30.0 - 7.0 * math.sin(t / 70) + random.uniform(-0.8, 0.8)
    weight = 61.0 - (t % 7200) / 7200 * 18.0 + random.uniform(-0.15, 0.15)
    gas = 190 + 60 * math.sin(t / 30) + random.uniform(-12, 12)
    progress = ((t % 7200) / 7200) * 100
    active = await db.batches.find_one({"status": "RUNNING"}, {"_id": 0})
    if progress < 15:
        stage = "Pre-heating"
    elif progress < 45:
        stage = "Moisture Extraction"
    elif progress < 70:
        stage = "Constant Rate"
    elif progress < 90:
        stage = "Falling Rate"
    else:
        stage = "Cooling"
    return {
        "dryer_status": "RUNNING",
        "temperature_c": round(temp, 1),
        "humidity_pct": round(max(12, humidity), 1),
        "weight_kg": round(max(20, weight), 2),
        "gas_ppm": int(max(80, gas)),
        "gas_status": "SAFE",
        "drying_stage": stage,
        "progress_pct": round(progress, 1),
        "elapsed_min": int((t % 7200) / 60),
        "power": {
            "thermal_source": "LPG Hot-Air",
            "electrical_source": "Solar PV + Battery",
            "solar_w": int(240 + 90 * math.sin(t / 120)),
            "battery_pct": int(78 + 8 * math.sin(t / 200)),
            "control_bus": "12V DC (Solar/Battery)",
        },
        "connectivity": {
            "esp32": "CONNECTED",
            "latency_ms": random.randint(38, 95),
            "rssi_dbm": random.randint(-68, -52),
            "packet_hz": 1,
            "cloud": "SYNCED",
        },
        "active_batch": active,
        "simulated": True,
        "disclaimer": SIMULATED_DISCLAIMER,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@api_router.get("/batches", response_model=List[Batch])
async def list_batches():
    batches = await db.batches.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return batches


@api_router.post("/batches", response_model=Batch)
async def create_batch(payload: BatchCreate, user: dict = Depends(get_current_user)):
    batch_id = payload.batch_id
    if not batch_id:
        existing_ids = await db.batches.distinct("batch_id")
        suffixes = [int(i.rsplit("-", 1)[1]) for i in existing_ids if i.rsplit("-", 1)[-1].isdigit()]
        batch_id = f"SDC-2026-{(max(suffixes) if suffixes else 90) + 1:03d}"
    existing = await db.batches.find_one({"batch_id": batch_id})
    if existing:
        raise HTTPException(status_code=409, detail=f"Batch {batch_id} already exists")
    doc = Batch(
        batch_id=batch_id,
        product=payload.product,
        starting_weight_kg=payload.starting_weight_kg,
        tray_quantity=payload.tray_quantity,
        operator=payload.operator,
        drying_method=payload.drying_method,
        start_datetime=payload.start_datetime or datetime.now(timezone.utc).isoformat(),
        status="RUNNING",
        traceability_status="QR Issued",
    ).model_dump()
    await db.batches.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.get("/batches/{batch_id}", response_model=Batch)
async def get_batch(batch_id: str):
    doc = await db.batches.find_one({"batch_id": batch_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Batch not found")
    return doc


@api_router.patch("/batches/{batch_id}", response_model=Batch)
async def update_batch(batch_id: str, payload: BatchUpdate, user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.batches.update_one({"batch_id": batch_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Batch not found")
    return await db.batches.find_one({"batch_id": batch_id}, {"_id": 0})


@api_router.get("/energy/summary")
async def energy_summary():
    completed = await db.batches.find({"status": "COMPLETE"}, {"_id": 0}).to_list(500)
    total_hours = sum(b.get("duration_hours") or 0 for b in completed)
    start_w = sum(b["starting_weight_kg"] for b in completed)
    final_w = sum(b.get("final_weight_kg") or 0 for b in completed)
    lpg_kg = round(total_hours * 0.92, 1)
    battery_kwh = round(total_hours * 0.11, 2)
    solar_kwh = round(total_hours * 0.34, 2)
    lpg_kwh_equiv = round(lpg_kg * 12.8, 1)
    total_kwh = round(lpg_kwh_equiv + battery_kwh, 1)
    dried_kg = round(final_w, 1)
    lpg_cost = round(lpg_kg * 1.15, 2)
    elec_cost = round(battery_kwh * 0.18, 2)
    total_cost = round(lpg_cost + elec_cost, 2)
    return {
        "batches_completed": len(completed),
        "total_drying_hours": round(total_hours, 1),
        "starting_weight_kg": round(start_w, 1),
        "final_weight_kg": dried_kg,
        "product_yield_pct": round((final_w / start_w) * 100, 1) if start_w else 0,
        "lpg_consumed_kg": lpg_kg,
        "battery_energy_kwh": battery_kwh,
        "solar_contribution_kwh": solar_kwh,
        "total_energy_kwh_equiv": total_kwh,
        "energy_per_kg_kwh": round(total_kwh / dried_kg, 2) if dried_kg else 0,
        "cost_per_kg": round(total_cost / dried_kg, 3) if dried_kg else 0,
        "cost_per_batch": round(total_cost / len(completed), 2) if completed else 0,
        "currency": "USD",
        "energy_split": [
            {"name": "LPG Thermal", "value": lpg_kwh_equiv},
            {"name": "Solar PV", "value": solar_kwh},
            {"name": "Battery Buffer", "value": battery_kwh},
        ],
        "comparison": [
            {"metric": "Drying time (per batch)", "existing": "2–4 days (open-air sun drying)", "smartdry": f"~{round(total_hours / len(completed), 1)} h target cycle", "note": "Simulated target — awaiting pilot validation"},
            {"metric": "Energy consumption", "existing": "Unmetered / firewood & diesel typical", "smartdry": f"{total_kwh} kWh-eq (demo model)", "note": "Simulated — not measured"},
            {"metric": "Energy cost per batch", "existing": "Variable, unmonitored", "smartdry": f"${round(total_cost / len(completed), 2) if completed else 0} (demo model)", "note": "Simulated — not measured"},
            {"metric": "Processing visibility", "existing": "Manual checks, no records", "smartdry": "Real-time monitoring + batch records", "note": "Platform capability"},
            {"metric": "Product consistency", "existing": "Weather-dependent, variable moisture", "smartdry": "Controlled hot-air profile, target moisture", "note": "To be verified in controlled pilot"},
            {"metric": "Traceability", "existing": "None", "smartdry": "QR batch passport per cycle", "note": "Platform capability"},
        ],
        "simulated": True,
        "disclaimer": SIMULATED_DISCLAIMER + ". No measured energy savings or performance claims are made; controlled pilot validation will generate real performance data.",
    }


@api_router.get("/system/status")
async def system_status():
    return {
        "overall": "OPERATIONAL (DEMO)",
        "components": [
            {"name": "ESP32 Controller", "role": "Edge sensing & control", "status": "CONNECTED (SIMULATED)", "level": "ok"},
            {"name": "Temperature/Humidity Sensor", "role": "Chamber climate sensing", "status": "ONLINE (SIMULATED)", "level": "ok"},
            {"name": "Load Cell (Weight)", "role": "Product weight monitoring", "status": "ONLINE (SIMULATED)", "level": "ok"},
            {"name": "Gas Detector", "role": "LPG safety monitoring", "status": "ONLINE (SIMULATED)", "level": "ok"},
            {"name": "OLED Local Display", "role": "On-unit readout & alerts", "status": "READY", "level": "ok"},
            {"name": "Cloud Uplink", "role": "IoT communication channel", "status": "SYNCED (SIMULATED)", "level": "ok"},
            {"name": "LPG Thermal Source", "role": "Hot-air generation", "status": "STANDBY", "level": "ok"},
            {"name": "Solar/Battery Electrical", "role": "Controls, sensors & comms power", "status": "CHARGING", "level": "ok"},
        ],
        "simulated": True,
        "disclaimer": SIMULATED_DISCLAIMER,
    }


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
