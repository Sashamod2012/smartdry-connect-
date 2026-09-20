"""SmartDry Connect backend tests — light-theme + traceability workflow iteration."""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://agritech-monitor-2.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"


@pytest.fixture
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture
def auth_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{API}/auth/login",
               json={"email": "folasade.amodu@gmail.com", "password": "SmartDry@2026"},
               timeout=15)
    assert r.status_code == 200, r.text
    return s


# Telemetry
def test_telemetry(client):
    r = client.get(f"{API}/telemetry", timeout=15)
    assert r.status_code == 200
    d = r.json()
    assert d["simulated"] is True
    assert "SIMULATED" in d["disclaimer"]
    for k in ["temperature_c", "humidity_pct", "weight_kg", "gas_ppm", "progress_pct", "power", "connectivity"]:
        assert k in d


# Batches list (seeded / migrated statuses)
def test_list_batches_migrated_statuses(client):
    r = client.get(f"{API}/batches", timeout=15)
    assert r.status_code == 200
    data = r.json()
    valid = {"PLANNED", "PROCESSING", "PAUSED", "COMPLETED"}
    for b in data:
        assert b["status"] in valid, f"legacy status still present: {b['status']} on {b['batch_id']}"
    # migration must have converted RUNNING/COMPLETE
    assert not any(b["status"] in ("RUNNING", "COMPLETE") for b in data)


def test_get_batch_seed(client):
    r = client.get(f"{API}/batches/SDC-2026-083", timeout=15)
    assert r.status_code == 200
    b = r.json()
    assert b["batch_id"] == "SDC-2026-083"
    assert b["status"] == "COMPLETED"


def test_get_batch_404(client):
    r = client.get(f"{API}/batches/NOPE-XXX", timeout=15)
    assert r.status_code == 404


# Auth required on new endpoints
def test_status_endpoint_requires_auth(client):
    r = client.post(f"{API}/batches/SDC-2026-083/status", json={"status": "PROCESSING"}, timeout=15)
    assert r.status_code == 401


def test_events_endpoint_requires_auth(client):
    r = client.post(f"{API}/batches/SDC-2026-083/events",
                    json={"event_type": "Note", "description": "unauth"}, timeout=15)
    assert r.status_code == 401


def test_create_batch_requires_auth(client):
    r = client.post(f"{API}/batches", json={"product": "X", "starting_weight_kg": 1, "operator": "y"}, timeout=15)
    assert r.status_code == 401


# End-to-end traceability workflow
@pytest.fixture(scope="module")
def created_batch_id():
    return {}


def test_workflow_create_planned(auth_client, created_batch_id):
    payload = {
        "product": "Ginger",
        "starting_weight_kg": 40.0,
        "tray_quantity": 12,
        "operator": "TEST_Trace",
        "raw_material_source": "TEST_Farm",
        "thermal_source": "LPG",
        "electrical_source": "Solar + Battery",
        "notes": "TEST workflow",
    }
    r = auth_client.post(f"{API}/batches", json=payload, timeout=15)
    assert r.status_code == 200, r.text
    b = r.json()
    assert b["status"] == "PLANNED"
    assert b["traceability_status"] == "QR Pending"
    assert b["raw_material_source"] == "TEST_Farm"
    assert b["notes"] == "TEST workflow"
    assert b["thermal_source"] == "LPG"
    assert b["electrical_source"] == "Solar + Battery"
    assert len(b["events"]) >= 1
    assert b["events"][0]["event_type"] == "Batch created"
    created_batch_id["id"] = b["batch_id"]


def test_workflow_start_processing(auth_client, created_batch_id):
    bid = created_batch_id["id"]
    r = auth_client.post(f"{API}/batches/{bid}/status", json={"status": "PROCESSING"}, timeout=15)
    assert r.status_code == 200
    b = r.json()
    assert b["status"] == "PROCESSING"
    assert any(e["event_type"] == "Batch started" for e in b["events"])


def test_workflow_pause_resume(auth_client, created_batch_id):
    bid = created_batch_id["id"]
    r = auth_client.post(f"{API}/batches/{bid}/status", json={"status": "PAUSED"}, timeout=15)
    assert r.status_code == 200
    assert r.json()["status"] == "PAUSED"
    r = auth_client.post(f"{API}/batches/{bid}/status", json={"status": "PROCESSING"}, timeout=15)
    assert r.status_code == 200
    b = r.json()
    assert b["status"] == "PROCESSING"
    assert any(e["event_type"] == "Batch resumed" for e in b["events"])


def test_workflow_custom_event(auth_client, created_batch_id):
    bid = created_batch_id["id"]
    r = auth_client.post(f"{API}/batches/{bid}/events",
                         json={"event_type": "Inspection", "description": "TEST_ok"}, timeout=15)
    assert r.status_code == 200
    b = r.json()
    assert any(e["event_type"] == "Inspection" and e["description"] == "TEST_ok" for e in b["events"])


def test_workflow_complete_with_final_weight(auth_client, created_batch_id):
    bid = created_batch_id["id"]
    r = auth_client.post(f"{API}/batches/{bid}/status",
                         json={"status": "COMPLETED", "final_weight_kg": 12.3}, timeout=15)
    assert r.status_code == 200
    b = r.json()
    assert b["status"] == "COMPLETED"
    assert b["final_weight_kg"] == 12.3
    assert b["traceability_status"] == "QR Issued"
    assert b["duration_hours"] is not None and b["duration_hours"] >= 0.1
    assert b["lpg_consumption_kg"] is not None
    assert b["electrical_energy_kwh"] is not None
    assert len(b["temperature_history"]) == 24
    assert len(b["weight_history"]) == 24
    assert any(e["event_type"] == "Batch completed" for e in b["events"])


def test_workflow_persists_on_reopen(client, created_batch_id):
    bid = created_batch_id["id"]
    r = client.get(f"{API}/batches/{bid}", timeout=15)
    assert r.status_code == 200
    b = r.json()
    assert b["status"] == "COMPLETED"
    assert b["final_weight_kg"] == 12.3
    assert len(b["temperature_history"]) == 24
    assert any(e["event_type"] == "Inspection" for e in b["events"])


def test_invalid_status_returns_400(auth_client):
    r = auth_client.post(f"{API}/batches/SDC-2026-083/status", json={"status": "FROZEN"}, timeout=15)
    assert r.status_code == 400


def test_status_on_missing_batch_404(auth_client):
    r = auth_client.post(f"{API}/batches/NOPE-XXX/status", json={"status": "PROCESSING"}, timeout=15)
    assert r.status_code == 404


# Public passport still works
def test_trace_public(client):
    r = client.get(f"{API}/batches/SDC-2026-083", timeout=15)
    assert r.status_code == 200


# Energy summary — must not 500 after status rename
def test_energy_summary(client):
    r = client.get(f"{API}/energy/summary", timeout=15)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["simulated"] is True
    assert d["batches_completed"] >= 1
    assert len(d["energy_split"]) == 3


# System status
def test_system_status(client):
    r = client.get(f"{API}/system/status", timeout=15)
    assert r.status_code == 200
    assert len(r.json()["components"]) == 8
