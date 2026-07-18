"""Phase 3 — Liquidity. Deterministic cash-flow projection per currency.

Projects each currency's balance forward by applying pending settlements on
their value dates, then flags any day the projected balance falls below the
treasury liquidity floor (a funding gap). Read-only and deterministic; the AI
only narrates the result.
"""
from datetime import date, timedelta

from . import intel
from .db import Settlement, Limit, Balance, Session

HORIZON_DAYS = 7


def _rows(model) -> list[dict]:
    with Session() as s:
        return [{c.name: getattr(r, c.name) for c in model.__table__.columns}
                for r in s.query(model).all()]


def _m(amount: float, ccy: str) -> str:
    sign = "-" if amount < 0 else ""
    return f"{sign}{ccy} {abs(amount) / 1e6:.1f}M"


def project() -> dict:
    balances = {b["currency"]: b["balance"] for b in _rows(Balance)}
    floors = {l["currency"]: l["liquidity_floor"] for l in _rows(Limit)}
    setts = _rows(Settlement)

    today = date.today()
    days = [(today + timedelta(days=i)).isoformat() for i in range(HORIZON_DAYS)]

    out, alerts = [], []
    for ccy in sorted(balances):
        opening = balances[ccy]
        floor = floors.get(ccy, 0.0)
        running = opening
        series, min_proj = [], opening
        for d in days:
            flow = sum(s["amount"] for s in setts
                       if s["currency"] == ccy and s["value_date"] == d)
            running += flow
            series.append({"date": d, "projected": round(running, 0), "flow": round(flow, 0)})
            min_proj = min(min_proj, running)

        gap = max(0.0, floor - min_proj)
        status = "GAP" if gap > 0 else "TIGHT" if min_proj < floor * 1.1 else "OK"
        out.append({
            "currency": ccy,
            "opening": round(opening, 0), "opening_label": _m(opening, ccy),
            "floor": round(floor, 0), "floor_label": _m(floor, ccy),
            "min_projected": round(min_proj, 0), "min_label": _m(min_proj, ccy),
            "gap": round(gap, 0), "gap_label": _m(gap, ccy),
            "status": status,
            "series": series,
        })
        if status == "GAP":
            alerts.append({"currency": ccy, "level": "GAP",
                           "message": f"{ccy} projected to fall {_m(gap, ccy)} below its "
                                      f"{_m(floor, ccy)} floor within {HORIZON_DAYS} days"})
        elif status == "TIGHT":
            alerts.append({"currency": ccy, "level": "TIGHT",
                           "message": f"{ccy} runs close to its liquidity floor"})

    return {"currencies": out, "alerts": alerts}


def commentary(proj: dict) -> str:
    gaps = [a for a in proj["alerts"] if a["level"] == "GAP"]
    tights = [a for a in proj["alerts"] if a["level"] == "TIGHT"]
    prompt = (
        "You are a treasury liquidity manager. In under 60 words, summarise the "
        f"{HORIZON_DAYS}-day funding outlook for a morning check. Read-only — flag "
        "gaps, do not propose funding trades. Facts: funding gaps in "
        f"{', '.join(a['currency'] for a in gaps) or 'none'}; tight in "
        f"{', '.join(a['currency'] for a in tights) or 'none'}."
    )
    fallback = (
        (f"Funding gap projected in {', '.join(a['currency'] for a in gaps)} — pre-fund before value date. "
         if gaps else "All currencies stay above their liquidity floors this week. ")
        + (f"Running tight: {', '.join(a['currency'] for a in tights)}. " if tights else "")
        + f"Outlook: {'ACTION' if gaps else 'CAUTION' if tights else 'NORMAL'}."
    )
    return intel.narrate(prompt, fallback)


def summary() -> dict:
    proj = project()
    return {
        "base_horizon_days": HORIZON_DAYS,
        "as_of": date.today().isoformat(),
        "currencies": proj["currencies"],
        "alerts": proj["alerts"],
        "commentary": commentary(proj),
    }


def _selfcheck() -> None:
    import os
    os.environ.pop("ANTHROPIC_API_KEY", None)
    os.environ.pop("OPENAI_API_KEY", None)
    from .book import seed_book
    seed_book(force=True)
    s = summary()
    php = next(c for c in s["currencies"] if c["currency"] == "PHP")
    assert php["status"] == "GAP", php              # PHP seeded to dip below floor
    assert any(a["level"] == "GAP" for a in s["alerts"])
    assert len(php["series"]) == HORIZON_DAYS
    print("liquidity self-check ok")


if __name__ == "__main__":
    _selfcheck()
