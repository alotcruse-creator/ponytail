"""FastAPI backend for the FX Treasury Copilot (Phase 1).

Read-only market intelligence. The system never executes or recommends trades.
Endpoints: /news /calendar /php /market-summary /rates /morning-brief
           /end-of-day /status
"""
import time
from datetime import date, datetime, timedelta

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse
from pydantic import BaseModel

from . import (intel, rates, news_feed, exposure, liquidity, chat,
               scenario, watch, flows, coverage, auth)
from .db import News, CalendarEvent, Sentiment, Session
from .seed import seed
from .book import seed_book

app = FastAPI(title="FX Treasury Copilot", version="0.3.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"],
                   allow_headers=["*"])  # ponytail: open CORS for local dev; lock down on deploy

# Endpoints reachable without a token (login itself + liveness + preflight).
_PUBLIC_PATHS = {"/login", "/health", "/docs", "/openapi.json", "/"}


@app.middleware("http")
async def _auth_gate(request, call_next):
    if (auth.auth_enabled() and request.method != "OPTIONS"
            and request.url.path not in _PUBLIC_PATHS):
        header = request.headers.get("authorization", "")
        token = header[7:] if header.lower().startswith("bearer ") else ""
        if not auth.verify_token(token):
            # ACAO so the browser can read the 401 instead of a masked CORS error
            return JSONResponse({"detail": "Unauthorized"}, status_code=401,
                                headers={"Access-Control-Allow-Origin": "*"})
    return await call_next(request)

_NEWS_TTL = 90  # short so the UI surfaces new headlines within ~1–2 min
_news_cache: dict[str, object] = {"at": 0.0, "items": [], "live": False}


@app.on_event("startup")
def _startup() -> None:
    seed()
    seed_book()
    watch.seed_triggers()


def _rows(model) -> list[dict]:
    with Session() as s:
        return [{c.name: getattr(r, c.name) for c in model.__table__.columns}
                for r in s.query(model).all()]


def _news() -> list[dict]:
    """Live RSS if reachable, else the seeded fallback. Cached with a TTL."""
    now = time.monotonic()
    if now - _news_cache["at"] < _NEWS_TTL and _news_cache["items"]:
        return _news_cache["items"]  # type: ignore[return-value]
    live = news_feed.fetch_news()
    if live:
        _news_cache.update(at=now, items=live, live=True)
        return live
    seeded = _rows(News)
    _news_cache.update(at=now, items=seeded, live=False)
    return seeded


def _next_weekday(d: date) -> date:
    d += timedelta(days=1)
    while d.weekday() >= 5:  # skip Sat/Sun
        d += timedelta(days=1)
    return d


def _group_by_day(events: list[dict]) -> list[dict]:
    groups: dict[str, list[dict]] = {}
    for e in events:
        groups.setdefault(e.get("date") or "", []).append(e)
    today = date.today().isoformat()
    tomorrow = _next_weekday(date.today()).isoformat()
    out = []
    for d in sorted(groups):
        try:
            wd = datetime.fromisoformat(d).strftime("%A")
        except ValueError:
            wd = ""
        label = "Today" if d == today else "Tomorrow" if d == tomorrow else wd
        out.append({"date": d, "weekday": wd, "label": label,
                    "events": sorted(groups[d], key=lambda x: x["time"])})
    return out


@app.get("/health")
def health() -> dict:
    return {"ok": True}


class LoginIn(BaseModel):
    email: str
    password: str


@app.post("/login")
def login(body: LoginIn) -> dict:
    if not auth.auth_enabled():
        # Gate not configured on this backend yet — issue an open token so the
        # UI works, but access is effectively public until AUTH_* env is set.
        return {"token": auth.make_token("open@local"), "auth": "disabled"}
    if auth.check_credentials(body.email, body.password):
        return {"token": auth.make_token(body.email.strip().lower()), "auth": "enabled"}
    raise HTTPException(status_code=401, detail="Invalid email or password")


@app.get("/status")
def status() -> dict:
    """Freshness for the UI: when data was assembled and whether it is live."""
    _news()  # warm the cache so `live` is accurate
    return {
        "generated_at": datetime.utcnow().isoformat(timespec="seconds") + "Z",
        "news_live": bool(_news_cache["live"]),
        "rates_as_of": (rates.latest() or [{}])[0].get("date"),
    }


@app.get("/news")
def news() -> list[dict]:
    return intel.rank(intel.dedup(_news()))


@app.get("/rates")
def rates_endpoint() -> dict:
    return rates.snapshot()


@app.get("/rates/all")
def rates_all() -> dict:
    return rates.world_snapshot()


@app.get("/calendar")
def calendar() -> dict:
    events = sorted(_rows(CalendarEvent), key=lambda e: (e.get("date") or "", e["time"]))
    return {"events": events, "days": _group_by_day(events),
            "top5": intel.top_events(events, 5)}


@app.get("/market-summary")
def market_summary() -> dict:
    today = date.today().isoformat()
    events = _rows(CalendarEvent)
    return {
        "sentiment": _rows(Sentiment),
        "high_impact": [e for e in events
                        if e["importance"] >= 4 and (e.get("date") or today) == today],
        "top_news": intel.rank(intel.dedup(_news()))[:4],
        "rates": rates.latest()[:4],
    }


@app.get("/php")
def php() -> dict:
    n, c, s = _news(), _rows(CalendarEvent), _rows(Sentiment)
    php_news = [x for x in intel.rank(intel.dedup(n)) if x["currency"] == "PHP"]
    php_sent = next((x for x in s if x["currency"] == "PHP"),
                    {"label": "Neutral", "score": 50})
    tomorrow = _next_weekday(date.today()).isoformat()
    php_rate = next((r for r in rates.latest() if r["currency"] == "PHP"), None)
    return {
        "sentiment": php_sent,
        "rate": php_rate,
        "drivers": ["BSP guidance", "USD strength", "Oil imports", "Inflation"],
        "news": php_news,
        "news_count": len(php_news),
        "tomorrow_events": sum(1 for e in c if e.get("date") == tomorrow),
        "commentary": intel.morning_brief(n, c, s),
        # Phase 2: live PHP exposure computed from the book (was placeholder).
        "exposure_sample": exposure.php_snapshot(),
    }


@app.get("/morning-brief")
def morning_brief() -> dict:
    return {"brief": intel.morning_brief(_news(), _rows(CalendarEvent),
                                         _rows(Sentiment))}


@app.get("/end-of-day")
def end_of_day() -> dict:
    return {"report": intel.end_of_day(_news(), _rows(CalendarEvent),
                                       _rows(Sentiment))}


# ── Phase 2–4: the book, liquidity, and the assistant (all read-only) ──

@app.get("/exposure")
def exposure_endpoint() -> dict:
    return exposure.summary()


@app.get("/liquidity")
def liquidity_endpoint() -> dict:
    return liquidity.summary()


class ChatIn(BaseModel):
    question: str


@app.post("/chat")
def chat_endpoint(body: ChatIn) -> dict:
    return {"answer": chat.answer(body.question)}


# ── Phase 5: scenario, alerts, flow forecasting, coverage (all read-only) ──

@app.get("/scenario")
def scenario_endpoint() -> dict:
    return scenario.summary()


class ShockIn(BaseModel):
    shocks: dict[str, float]


@app.post("/scenario")
def scenario_custom(body: ShockIn) -> dict:
    return scenario.custom(body.shocks)


@app.get("/alerts")
def alerts_endpoint() -> dict:
    return watch.evaluate()


class TriggerIn(BaseModel):
    kind: str
    currency: str
    op: str
    level: float
    note: str = ""


@app.post("/alerts")
def alerts_add(body: TriggerIn) -> dict:
    return watch.add(body.kind, body.currency, body.op, body.level, body.note)


@app.delete("/alerts/{trigger_id}")
def alerts_remove(trigger_id: int) -> dict:
    return watch.remove(trigger_id)


@app.get("/flows")
def flows_endpoint() -> dict:
    return flows.summary()


@app.get("/coverage")
def coverage_endpoint() -> dict:
    return coverage.summary()
