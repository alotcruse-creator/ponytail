"""Phase 2 — Exposure Monitor. Deterministic FX risk over the book.

Every figure here is computed, not narrated. The AI (via intel.narrate) only
turns the computed facts into a sentence. Read-only throughout: this measures
exposure and flags limit breaches; it never proposes or places a trade.

Rates are "currency units per 1 USD" (USD/CCY). Live rates from rates.py are
used when available; REF_RATES is the fallback so the desk still gets numbers
if the live feed is down.
"""
from datetime import date

from . import intel, rates
from .db import Position, Settlement, Limit, Balance, Session

# Fallback market rates (USD/CCY) if the live feed is unreachable.
REF_RATES = {"USD": 1.0, "PHP": 57.5, "JPY": 150.0, "EUR": 0.92,
             "GBP": 0.79, "CNY": 7.10, "MYR": 4.40}

WARN_PCT = 80.0
BREACH_PCT = 100.0


def _rows(model) -> list[dict]:
    with Session() as s:
        return [{c.name: getattr(r, c.name) for c in model.__table__.columns}
                for r in s.query(model).all()]


def _rate_map() -> dict[str, float]:
    live = {r["currency"]: r["rate"] for r in rates.latest()}
    return {**REF_RATES, **live}


def _usd(amount: float, rate: float) -> float:
    return amount / rate if rate else 0.0


def _status(pct: float) -> str:
    return "BREACH" if pct >= BREACH_PCT else "WARN" if pct >= WARN_PCT else "OK"


def _mccy(amount: float, ccy: str) -> str:
    sign = "+" if amount >= 0 else "-"
    return f"{sign}{ccy} {abs(amount) / 1e6:.1f}M"


def _musd(amount: float) -> str:
    sign = "+" if amount >= 0 else "-"
    return f"{sign}${abs(amount) / 1e6:.2f}M"


def positions() -> dict:
    """Per-currency exposure, limit utilisation, unrealised P&L, alerts."""
    rmap = _rate_map()
    limits = {l["currency"]: l for l in _rows(Limit)}
    rows, alerts = [], []
    gross = net = 0.0

    for p in sorted(_rows(Position), key=lambda x: x["currency"]):
        ccy = p["currency"]
        rate = rmap.get(ccy, 1.0)
        usd = _usd(p["amount"], rate)
        pnl = p["amount"] * (1 / rate - 1 / p["avg_rate"]) if p["avg_rate"] else 0.0
        lim = limits.get(ccy, {}).get("max_exposure_usd", 0.0)
        pct = abs(usd) / lim * 100 if lim else 0.0
        status = _status(pct)
        gross += abs(usd)
        net += usd
        rows.append({
            "currency": ccy,
            "amount": p["amount"],
            "amount_label": _mccy(p["amount"], ccy),
            "direction": "LONG" if p["amount"] >= 0 else "SHORT",
            "avg_rate": round(p["avg_rate"], 4),
            "current_rate": round(rate, 4),
            "usd_exposure": round(usd, 0),
            "usd_label": _musd(usd),
            "limit_usd": lim,
            "limit_pct": round(pct, 1),
            "status": status,
            "pnl_usd": round(pnl, 0),
            "pnl_label": _musd(pnl),
        })
        if status != "OK":
            alerts.append({
                "currency": ccy, "level": status,
                "message": f"{ccy} exposure {_musd(usd)} is {pct:.0f}% of the "
                           f"{_musd(lim)} limit" + (" — over limit" if status == "BREACH" else ""),
            })

    return {
        "rows": rows,
        "totals": {"gross_usd": round(gross, 0), "gross_label": _musd(gross),
                   "net_usd": round(net, 0), "net_label": _musd(net)},
        "alerts": alerts,
    }


def settlement_ladder() -> dict:
    """Pending cash movements grouped by value date, in USD-equivalent terms."""
    rmap = _rate_map()
    today = date.today().isoformat()
    items = []
    for s in _rows(Settlement):
        rate = rmap.get(s["currency"], 1.0)
        items.append({**s, "usd": round(_usd(s["amount"], rate), 0)})

    by_date: dict[str, list[dict]] = {}
    for it in items:
        by_date.setdefault(it["value_date"], []).append(it)

    days = []
    for d in sorted(by_date):
        grp = by_date[d]
        inflow = sum(x["usd"] for x in grp if x["usd"] > 0)
        outflow = sum(x["usd"] for x in grp if x["usd"] < 0)
        days.append({
            "date": d,
            "label": "Today" if d == today else d,
            "inflow_usd": round(inflow, 0),
            "outflow_usd": round(outflow, 0),
            "net_usd": round(inflow + outflow, 0),
            "items": sorted(grp, key=lambda x: x["usd"]),
        })

    upcoming = sorted((x for x in items if x["value_date"] >= today),
                      key=lambda x: x["value_date"])
    largest = max(items, key=lambda x: abs(x["usd"]), default=None)
    return {"days": days, "next": upcoming[0] if upcoming else None, "largest": largest}


def commentary(pos: dict, ladder: dict) -> str:
    breaches = [a for a in pos["alerts"] if a["level"] == "BREACH"]
    warns = [a for a in pos["alerts"] if a["level"] == "WARN"]
    nxt = ladder.get("next")
    prompt = (
        "You are a senior FX treasury risk officer. In under 70 words, summarise "
        "the book for a morning risk check. Read-only — never suggest trades, only "
        f"flag risk. Facts: net USD exposure {pos['totals']['net_label']}, gross "
        f"{pos['totals']['gross_label']}. "
        f"Breaches: {', '.join(a['currency'] for a in breaches) or 'none'}. "
        f"Near limit: {', '.join(a['currency'] for a in warns) or 'none'}. "
        f"Next settlement: {(nxt['currency'] + ' ' + nxt['direction'] + ' on ' + nxt['value_date']) if nxt else 'none'}."
    )
    fallback = (
        f"Net book exposure {pos['totals']['net_label']} (gross {pos['totals']['gross_label']}). "
        + (f"Limit breach: {', '.join(a['currency'] for a in breaches)}. " if breaches else "")
        + (f"Approaching limit: {', '.join(a['currency'] for a in warns)}. " if warns else "")
        + (f"Next settlement {nxt['currency']} {nxt['direction']} on {nxt['value_date']}. " if nxt else "")
        + f"Monitor status: {'ACTION' if breaches else 'CAUTION' if warns else 'NORMAL'}."
    )
    return intel.narrate(prompt, fallback)


def summary() -> dict:
    pos = positions()
    ladder = settlement_ladder()
    return {
        "base": "USD",
        "as_of": date.today().isoformat(),
        "positions": pos["rows"],
        "totals": pos["totals"],
        "alerts": pos["alerts"],
        "settlements": ladder,
        "commentary": commentary(pos, ladder),
    }


def php_snapshot() -> dict:
    """Live PHP exposure figures for the /php page (was placeholder in Phase 1)."""
    rmap = _rate_map()
    pos = next((p for p in _rows(Position) if p["currency"] == "PHP"), None)
    lim = next((l for l in _rows(Limit) if l["currency"] == "PHP"), None)
    bal = next((b for b in _rows(Balance) if b["currency"] == "PHP"), None)
    php_setts = [s for s in _rows(Settlement) if s["currency"] == "PHP"]
    today = date.today().isoformat()
    today_setts = [s for s in php_setts if s["value_date"] == today]
    upcoming = sorted((s for s in php_setts if s["value_date"] >= today),
                      key=lambda x: x["value_date"])
    if not pos:
        return {}
    usd = _usd(pos["amount"], rmap.get("PHP", 57.5))
    pct = abs(usd) / lim["max_exposure_usd"] * 100 if lim else 0.0
    largest = max(today_setts, key=lambda x: abs(x["amount"]), default=None)
    buffer = (bal["balance"] - lim["liquidity_floor"]) if bal and lim else 0.0
    return {
        "net_exposure": _mccy(pos["amount"], "PHP"),
        "position": "LONG" if pos["amount"] >= 0 else "SHORT",
        "volume": _mccy(sum(abs(s["amount"]) for s in today_setts), "PHP").lstrip("+"),
        "avg_rate": f"{pos['avg_rate']:.4f}",
        "largest_settlement": _mccy(largest["amount"], "PHP") if largest else "—",
        "next_settlement": upcoming[0]["value_date"] if upcoming else "—",
        "limit_pct": round(pct),
        "liquidity_buffer": _mccy(buffer, "PHP"),
    }


def _selfcheck() -> None:
    import os
    os.environ.pop("ANTHROPIC_API_KEY", None)
    os.environ.pop("OPENAI_API_KEY", None)
    from .book import seed_book
    seed_book(force=True)
    s = summary()
    assert s["positions"], "no positions"
    myr = next(p for p in s["positions"] if p["currency"] == "MYR")
    assert myr["status"] == "BREACH", myr           # MYR seeded over limit
    assert any(a["level"] == "BREACH" for a in s["alerts"])
    assert s["settlements"]["largest"] is not None
    snap = php_snapshot()
    assert snap["position"] == "LONG" and snap["limit_pct"] > 0, snap
    print("exposure self-check ok")


if __name__ == "__main__":
    _selfcheck()
