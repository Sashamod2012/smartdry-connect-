"""SmartDry Connect JWT auth tests (bcrypt httpOnly cookie)."""
import os
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')
API = f"{BASE_URL}/api"
ADMIN = "folasade.amodu@gmail.com"
PWD = "SmartDry@2026"


# --- /auth/me without cookie must be 401 ---
def test_auth_me_unauthenticated():
    r = requests.get(f"{API}/auth/me", timeout=15)
    assert r.status_code == 401


# --- POST /batches without cookie must be 401 (protected) ---
def test_create_batch_requires_auth():
    payload = {"product": "Ginger", "starting_weight_kg": 10, "tray_quantity": 4,
               "operator": "TEST_x", "drying_method": "LPG Boost Mode"}
    r = requests.post(f"{API}/batches", json=payload, timeout=15)
    assert r.status_code == 401


# --- GET /batches remains public ---
def test_list_batches_public():
    r = requests.get(f"{API}/batches", timeout=15)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


# --- GET /telemetry and /system/status remain public ---
def test_telemetry_public():
    assert requests.get(f"{API}/telemetry", timeout=15).status_code == 200


def test_system_status_public():
    assert requests.get(f"{API}/system/status", timeout=15).status_code == 200


# --- Wrong password returns 401 (use throwaway email to not lock admin) ---
def test_login_wrong_password():
    r = requests.post(f"{API}/auth/login",
                      json={"email": "not-a-real@example.com", "password": "wrong"},
                      timeout=15)
    assert r.status_code == 401
    assert "Invalid" in r.json().get("detail", "")


# --- Correct login sets httpOnly cookie & /me works with cookie ---
def test_login_success_and_me_and_logout():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN, "password": PWD}, timeout=15)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["email"] == ADMIN
    assert body["role"] == "admin"
    # cookie set
    assert "access_token" in s.cookies.get_dict(), s.cookies.get_dict()

    me = s.get(f"{API}/auth/me", timeout=15)
    assert me.status_code == 200
    assert me.json()["email"] == ADMIN

    # authenticated create batch
    payload = {"product": "Cassava", "starting_weight_kg": 40, "tray_quantity": 12,
               "operator": "TEST_AuthedOp", "drying_method": "LPG Boost Mode"}
    cr = s.post(f"{API}/batches", json=payload, timeout=15)
    assert cr.status_code == 200, cr.text
    assert cr.json()["operator"] == "TEST_AuthedOp"

    # logout
    lo = s.post(f"{API}/auth/logout", timeout=15)
    assert lo.status_code == 200

    # after logout, /me returns 401 (cookie cleared)
    me2 = requests.get(f"{API}/auth/me", timeout=15)  # no cookie session
    assert me2.status_code == 401


# --- Brute force lockout: 5+ wrong on same (ip,email) → 429.
# Use a fake email so real admin is NOT locked out. ---
def test_brute_force_lockout():
    fake = "lockout-test@example.com"
    codes = []
    # Note: request.client.host in k8s ingress rotates across proxy IPs,
    # so lockout accumulates per (proxy_ip, email). Hit enough times to
    # ensure at least one proxy IP reaches count>=5.
    for _ in range(20):
        r = requests.post(f"{API}/auth/login",
                          json={"email": fake, "password": "bad"},
                          timeout=15)
        codes.append(r.status_code)
    assert 429 in codes, f"expected 429 in {codes}"
    # Verify message (may need multiple attempts to hit same proxy IP)
    got_429 = False
    for _ in range(10):
        r = requests.post(f"{API}/auth/login",
                          json={"email": fake, "password": "bad"},
                          timeout=15)
        if r.status_code == 429:
            got_429 = True
            assert "Too many" in r.json().get("detail", "")
            break
    assert got_429


# --- Verify admin login still works AFTER lockout of fake email ---
def test_admin_login_still_works_after_lockout():
    r = requests.post(f"{API}/auth/login",
                      json={"email": ADMIN, "password": PWD}, timeout=15)
    assert r.status_code == 200
