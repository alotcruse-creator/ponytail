"""Lightweight token auth. Credentials live in env vars, never in the repo.

The gate is enabled only when AUTH_EMAIL and AUTH_PASSWORD are set (on Render).
When they're unset the API stays open — so a fresh deploy is never locked out
before it's configured. Set all three vars below to turn the gate on:

    AUTH_EMAIL     the one allowed login email
    AUTH_PASSWORD  the password (store ONLY here, never in code)
    AUTH_SECRET    a long random string used to sign session tokens

Tokens are stateless HMAC-signed blobs with a 30-day expiry (no DB, no re-login
within that window). ponytail: no JWT dependency — stdlib hmac does the job.
"""
import base64
import hashlib
import hmac
import json
import os
import time

TOKEN_DAYS = 30


def _secret() -> str:
    # Stable fallback so tokens survive restarts in open (unconfigured) mode.
    return os.getenv("AUTH_SECRET", "fx-copilot-open-mode-secret")


def auth_enabled() -> bool:
    return bool(os.getenv("AUTH_EMAIL") and os.getenv("AUTH_PASSWORD"))


def _b64(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).decode().rstrip("=")


def _unb64(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def _sign(payload: bytes) -> str:
    return _b64(hmac.new(_secret().encode(), payload, hashlib.sha256).digest())


def make_token(email: str, days: int = TOKEN_DAYS) -> str:
    payload = json.dumps({"sub": email, "exp": int(time.time()) + days * 86400}).encode()
    return f"{_b64(payload)}.{_sign(payload)}"


def verify_token(token: str) -> bool:
    try:
        p_b64, sig = token.split(".", 1)
        payload = _unb64(p_b64)
        if not hmac.compare_digest(sig, _sign(payload)):
            return False
        return json.loads(payload).get("exp", 0) > time.time()
    except Exception:
        return False


def check_credentials(email: str, password: str) -> bool:
    want_e = os.getenv("AUTH_EMAIL", "").strip().lower()
    want_p = os.getenv("AUTH_PASSWORD", "")
    if not want_e or not want_p:
        return False
    # constant-time compares to avoid leaking length/prefix via timing
    ok_e = hmac.compare_digest((email or "").strip().lower(), want_e)
    ok_p = hmac.compare_digest(password or "", want_p)
    return ok_e and ok_p
