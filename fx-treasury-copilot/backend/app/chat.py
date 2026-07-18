"""Phase 4 — Chat. Natural-language Q&A over the deterministic data.

The engine assembles a compact "facts" snapshot from every other engine
(market, exposure, liquidity) and lets the AI phrase an answer grounded ONLY
in those facts. This is trustworthy precisely because Phases 1–3 computed the
numbers deterministically underneath it.

Read-only: the assistant reports and explains. It never proposes, sizes, or
places a trade — the prompt forbids it and the deterministic fallback can't.
With no AI key set, questions are routed by keyword to the same deterministic
summaries the rest of the app already produces.
"""
from . import intel, exposure, liquidity
from .db import News, Sentiment, CalendarEvent, Session


def _rows(model) -> list[dict]:
    with Session() as s:
        return [{c.name: getattr(r, c.name) for c in model.__table__.columns}
                for r in s.query(model).all()]


def facts() -> dict:
    """One snapshot of everything the assistant is allowed to talk about."""
    news = intel.rank(intel.dedup(_rows(News)))
    sent = _rows(Sentiment)
    events = _rows(CalendarEvent)
    exp = exposure.summary()
    liq = liquidity.summary()
    return {
        "sentiment": {s["currency"]: s["label"] for s in sent},
        "top_news": [n["headline"] for n in news[:5]],
        "high_impact_events": [f"{e['event']} ({e['currency']})"
                               for e in events if e["importance"] >= 4][:5],
        "exposure": {
            "net_usd": exp["totals"]["net_label"],
            "gross_usd": exp["totals"]["gross_label"],
            "by_currency": {r["currency"]: {"exposure": r["usd_label"],
                                            "limit_pct": r["limit_pct"],
                                            "status": r["status"]}
                            for r in exp["positions"]},
            "alerts": [a["message"] for a in exp["alerts"]],
        },
        "liquidity": {
            "gaps": [a["message"] for a in liq["alerts"]],
            "by_currency": {c["currency"]: {"min_projected": c["min_label"],
                                            "floor": c["floor_label"],
                                            "status": c["status"]}
                            for c in liq["currencies"]},
        },
    }


def _dot(s: str) -> str:
    s = s.strip()
    return s if s.endswith((".", "!", "?")) else s + "."


def _fallback(question: str, f: dict) -> str:
    q = question.casefold()
    exp, liq = f["exposure"], f["liquidity"]

    if any(w in q for w in ("exposure", "risk", "limit", "position", "breach")):
        parts = [f"Net book exposure is {exp['net_usd']} (gross {exp['gross_usd']})."]
        parts += exp["alerts"] or ["All currencies are within their exposure limits."]
        return " ".join(_dot(p) for p in parts)
    if any(w in q for w in ("liquidity", "cash", "fund", "gap", "settle", "buffer")):
        gaps = liq["gaps"] or ["All currencies stay above their liquidity floors this week."]
        return " ".join(_dot(g) for g in gaps)
    if any(w in q for w in ("news", "headline", "story")):
        return "Top headlines: " + "; ".join(f["top_news"][:3]) + "."
    if any(w in q for w in ("php", "peso")):
        php_e = exp["by_currency"].get("PHP", {})
        php_l = liq["by_currency"].get("PHP", {})
        return (f"PHP exposure {php_e.get('exposure', 'n/a')} "
                f"({php_e.get('limit_pct', 0)}% of limit, {php_e.get('status', '')}); "
                f"liquidity {php_l.get('status', '')}, min projected {php_l.get('min_projected', 'n/a')}.")
    if any(w in q for w in ("brief", "morning", "market", "today", "sentiment")):
        return intel.morning_brief(_rows(News), _rows(CalendarEvent), _rows(Sentiment))
    # general
    return (f"Net exposure {exp['net_usd']}. "
            + (" ".join(exp["alerts"][:1]) if exp["alerts"] else "No exposure alerts.")
            + (" " + " ".join(liq["gaps"][:1]) if liq["gaps"] else ""))


def answer(question: str) -> str:
    question = (question or "").strip()
    if not question:
        return "Ask me about the market, your FX exposure, or your liquidity."
    f = facts()
    import json
    prompt = (
        "You are an FX treasury assistant for a money-transfer company. Answer the "
        "user's question in under 90 words using ONLY the facts below. You are "
        "READ-ONLY: report, explain, and flag risk, but never propose, size, or "
        "place a trade, and never invent numbers not in the facts. If the facts "
        f"don't cover it, say so.\n\nFACTS:\n{json.dumps(f)}\n\nQUESTION: {question}"
    )
    return intel.narrate(prompt, _fallback(question, f))


def _selfcheck() -> None:
    import os
    os.environ.pop("ANTHROPIC_API_KEY", None)
    os.environ.pop("OPENAI_API_KEY", None)
    from .book import seed_book
    from .seed import seed
    seed(force=True)
    seed_book(force=True)
    assert "exposure" in answer("what's my exposure?").casefold()
    assert answer("any liquidity gaps?")
    assert answer("")  # empty prompt handled
    print("chat self-check ok")


if __name__ == "__main__":
    _selfcheck()
