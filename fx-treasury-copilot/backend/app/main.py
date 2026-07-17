"""FastAPI backend for the FX Treasury Copilot (Phase 1).

Read-only market intelligence. The system never executes or recommends trades.
Endpoints: /news /calendar /php /market-summary /morning-brief /end-of-day
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import intel
from .db import News, CalendarEvent, Sentiment, Session
from .seed import seed

app = FastAPI(title="FX Treasury Copilot", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"],
                   allow_headers=["*"])  # ponytail: open CORS for local dev; lock down on deploy


@app.on_event("startup")
def _startup() -> None:
    seed()


def _rows(model) -> list[dict]:
    with Session() as s:
        return [{c.name: getattr(r, c.name) for c in model.__table__.columns}
                for r in s.query(model).all()]


@app.get("/health")
def health() -> dict:
    return {"ok": True}


@app.get("/news")
def news() -> list[dict]:
    return intel.rank(intel.dedup(_rows(News)))


@app.get("/calendar")
def calendar() -> dict:
    events = sorted(_rows(CalendarEvent), key=lambda e: e["time"])
    return {"events": events, "top5": intel.top_events(events, 5)}


@app.get("/market-summary")
def market_summary() -> dict:
    return {
        "sentiment": _rows(Sentiment),
        "high_impact": [e for e in _rows(CalendarEvent) if e["importance"] >= 4],
        "top_news": intel.rank(intel.dedup(_rows(News)))[:4],
    }


@app.get("/php")
def php() -> dict:
    n, c, s = _rows(News), _rows(CalendarEvent), _rows(Sentiment)
    php_news = [x for x in intel.rank(intel.dedup(n)) if x["currency"] == "PHP"]
    php_sent = next((x for x in s if x["currency"] == "PHP"),
                    {"label": "Neutral", "score": 50})
    return {
        "sentiment": php_sent,
        "drivers": ["BSP guidance", "USD strength", "Oil imports", "Inflation"],
        "news": php_news,
        "news_count": len(php_news),
        "tomorrow_events": 1,  # BSP statement, from the news feed
        "commentary": intel.morning_brief(n, c, s),
        # ponytail: exposure figures are illustrative placeholders. Phase 2
        # (Exposure Monitor) computes these from the position feed.
        "exposure_sample": {
            "net_exposure": "+PHP 278M", "position": "LONG",
            "volume": "PHP 1.42B", "avg_rate": "0.07856",
            "largest_settlement": "PHP 38M", "next_settlement": "14:30",
            "limit_pct": 82, "liquidity_buffer": "PHP 120M",
        },
    }


@app.get("/morning-brief")
def morning_brief() -> dict:
    return {"brief": intel.morning_brief(_rows(News), _rows(CalendarEvent),
                                         _rows(Sentiment))}


@app.get("/end-of-day")
def end_of_day() -> dict:
    return {"report": intel.end_of_day(_rows(News), _rows(CalendarEvent),
                                       _rows(Sentiment))}
