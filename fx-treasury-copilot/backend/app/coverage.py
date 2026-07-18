"""Phase 5 — Hedge-coverage tracking. Forecast flow vs. what's covered.

For each corridor: how much of the expected payout funding is already hedged
(proxied by the open position) versus left open, the coverage ratio against a
target band, and the carry (interest-rate differential) of holding the cover.
This is the remittance FX trader's daily question — covering forecast flow at
good rates. Read-only: it measures coverage, it never places the hedge.

ponytail: REF_RATE_PA (annual policy rates) is illustrative — swap for a real
curve later. Positions stand in for hedges until a dedicated hedge feed exists.
"""
from . import exposure, flows, intel

COVER_DAYS = 7
TARGET_LOW = 60.0    # under this = under-hedged
TARGET_HIGH = 90.0   # over this = well / over-hedged

# Illustrative annual policy rates (%). Carry vs USD = rate_ccy - rate_usd.
REF_RATE_PA = {"USD": 4.50, "PHP": 6.25, "MXN": 10.50, "INR": 6.50,
               "CNY": 2.00, "VND": 4.50, "JPY": 0.50, "EUR": 3.00,
               "GBP": 4.75, "MYR": 3.00}


def _m(usd: float) -> str:
    return f"{'-' if usd < 0 else ''}${abs(usd) / 1e6:.2f}M"


def _status(pct: float) -> str:
    return "UNDER" if pct < TARGET_LOW else "OVER" if pct > 105 else "OK"


def rows() -> list[dict]:
    positions = {p["currency"]: p for p in exposure.summary()["positions"]}
    out = []
    for c in flows.project(COVER_DAYS):
        ccy = c["currency"]
        forecast = c["total_usd"]
        hedged = abs(positions.get(ccy, {}).get("usd_exposure", 0.0))
        pct = hedged / forecast * 100 if forecast else 0.0
        open_usd = max(0.0, forecast - hedged)
        carry = REF_RATE_PA.get(ccy, 0.0) - REF_RATE_PA["USD"]
        out.append({
            "currency": ccy, "country": c["country"],
            "forecast_usd": round(forecast, 0), "forecast_label": _m(forecast),
            "hedged_usd": round(hedged, 0), "hedged_label": _m(hedged),
            "open_usd": round(open_usd, 0), "open_label": _m(open_usd),
            "coverage_pct": round(pct, 1),
            "status": _status(pct),
            "carry_pa": round(carry, 2),
            "carry_label": f"{'+' if carry >= 0 else ''}{carry:.2f}% p.a.",
            "carry_sign": "positive" if carry >= 0 else "negative",
        })
    return sorted(out, key=lambda x: x["open_usd"], reverse=True)


def summary() -> dict:
    r = rows()
    under = [x for x in r if x["status"] == "UNDER"]
    total_open = sum(x["open_usd"] for x in r)
    prompt = (
        "You are a remittance FX trader's assistant. In under 55 words, summarise "
        f"hedge coverage over the next {COVER_DAYS} days for a morning check. "
        "Read-only — report coverage, never place a hedge. Facts: total open "
        f"(unhedged) {_m(total_open)}. Under-hedged corridors: "
        f"{', '.join(x['currency'] for x in under) or 'none'} "
        f"(target {TARGET_LOW:.0f}–{TARGET_HIGH:.0f}%)."
    )
    fallback = (
        f"Total open (unhedged) forecast flow is {_m(total_open)} over {COVER_DAYS} days. "
        + (f"Under-hedged vs the {TARGET_LOW:.0f}% floor: {', '.join(x['currency'] for x in under)}. "
           if under else "All corridors sit within the target coverage band. ")
        + "Watch carry when extending cover."
    )
    return {
        "cover_days": COVER_DAYS,
        "target_low": TARGET_LOW, "target_high": TARGET_HIGH,
        "as_of": exposure.summary()["as_of"],
        "rows": r,
        "total_open_usd": round(total_open, 0), "total_open_label": _m(total_open),
        "commentary": intel.narrate(prompt, fallback),
    }


def _selfcheck() -> None:
    import os
    os.environ.pop("ANTHROPIC_API_KEY", None)
    os.environ.pop("OPENAI_API_KEY", None)
    from .book import seed_book
    seed_book(force=True)
    s = summary()
    assert s["rows"], s
    # MXN/INR have flow but no seeded position -> under-hedged
    mxn = next(x for x in s["rows"] if x["currency"] == "MXN")
    assert mxn["status"] == "UNDER" and mxn["hedged_usd"] == 0, mxn
    assert s["total_open_usd"] > 0
    print("coverage self-check ok")


if __name__ == "__main__":
    _selfcheck()
