"""SmartDry Connect backend tests."""
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


# Telemetry
def test_telemetry(client):
    r = client.get(f"{API}/telemetry", timeout=15)
    assert r.status_code == 200
    d = r.json()
    assert d["simulated"] is True
    assert "SIMULATED" in d["disclaimer"]
    for k in ["temperature_c", "humidity_pct", "weight_kg", "gas_ppm", "progress_pct", "power", "connectivity"]:
        assert k in d
    assert d["connectivity"]["esp32"] == "CONNECTED"


# Batches list (seeded)
def test_list_batches_seeded(client):
    r = client.get(f"{API}/batches", timeout=15)
    assert r.status_code == 200
    data = r.json()
    ids = {b["batch_id"] for b in data}
    for expected in [f"SDC-2026-{i:03d}" for i in range(83, 91)]:
        assert expected in ids, f"missing seed {expected}"
    running = [b for b in data if b["status"] == "RUNNING"]
    assert any(b["batch_id"] == "SDC-2026-090" for b in running)


def test_get_batch(client):
    r = client.get(f"{API}/batches/SDC-2026-083", timeout=15)
    assert r.status_code == 200
    assert r.json()["batch_id"] == "SDC-2026-083"


def test_get_batch_404(client):
    r = client.get(f"{API}/batches/NOPE-XXX", timeout=15)
    assert r.status_code == 404


# Create batch + persistence
def test_create_batch_and_persistence(client):
    payload = {
        "product": "Ginger",
        "starting_weight_kg": 55.5,
        "tray_quantity": 16,
        "operator": "TEST_Operator",
        "drying_method": "LPG Boost Mode",
    }
    r = client.post(f"{API}/batches", json=payload, timeout=15)
    assert r.status_code == 200, r.text
    created = r.json()
    assert created["product"] == "Ginger"
    assert created["operator"] == "TEST_Operator"
    assert created["batch_id"].startswith("SDC-2026-")
    assert created["status"] == "RUNNING"
    assert created["traceability_status"] == "QR Issued"

    # GET verify persisted
    g = client.get(f"{API}/batches/{created['batch_id']}", timeout=15)
    assert g.status_code == 200
    assert g.json()["operator"] == "TEST_Operator"


def test_patch_batch(client):
    # create then patch
    payload = {"product": "Herbs", "starting_weight_kg": 30, "tray_quantity": 10,
               "operator": "TEST_Patch", "drying_method": "Solar-Assist Eco Mode"}
    c = client.post(f"{API}/batches", json=payload, timeout=15).json()
    bid = c["batch_id"]
    r = client.patch(f"{API}/batches/{bid}", json={"status": "COMPLETE", "final_weight_kg": 7.1}, timeout=15)
    assert r.status_code == 200
    assert r.json()["status"] == "COMPLETE"
    assert r.json()["final_weight_kg"] == 7.1


# Energy summary
def test_energy_summary(client):
    r = client.get(f"{API}/energy/summary", timeout=15)
    assert r.status_code == 200
    d = r.json()
    assert d["simulated"] is True
    assert d["batches_completed"] >= 7
    assert isinstance(d["energy_split"], list) and len(d["energy_split"]) == 3
    assert isinstance(d["comparison"], list) and len(d["comparison"]) >= 4
    # No invented savings percentages
    dump = str(d["comparison"]).lower()
    assert "% savings" not in dump and "reduction" not in dump


# System status
def test_system_status(client):
    r = client.get(f"{API}/system/status", timeout=15)
    assert r.status_code == 200
    d = r.json()
    assert d["simulated"] is True
    assert len(d["components"]) == 8
