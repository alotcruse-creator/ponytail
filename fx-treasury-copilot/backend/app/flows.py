"""Phase 5 — Remittance-flow forecasting. Deterministic seasonality per corridor.

A remittance FX desk funds payouts in destination currencies, so expected
inbound volume drives funding need. This projects expected daily payout volume
per corridor from a base rate and deterministic seasonality: paydays (mid /
month-end), weekends, and the Q4 / 13th-month surge that dominates Philippine
(OFW) flow. Read-only planning input — it forecasts, it never funds.

ponytail: base volumes and seasonal factors are illustrative. Swap them for the
firm's actual corridor history behind the same shape; nothing downstream changes.
"""
from datetime import date, datetime, timedelta

from . import intel

HORIZON_DAYS = 14

# (currency, country, base_daily_usd, q4_sensitivity)
CORRIDORS = [
    ("PHP", "Philippines", 4_200_000, 1.6),   # largest book; strong 13th-month surge
    ("MXN", "Mexico", 3_100_000, 1.15),
    ("INR", "India", 2_600_000, 1.1),
    ("CNY", "China", 1_100_000, 1.05),
    ("VND", "Vietnam", 900_000, 1.2),
]


def _weekday_factor(d: date) -> float:
    return [1.0, 1.0, 1.0, 1.0, 1.05, 0.7, 0.5][d.weekday()]  # Mon..Sun


def _payday_factor(d: date) -> float:
    # Senders are paid mid-month and month-end; remittances spike just after.
    if d.day in (15, 16, 30, 31, 1):
        return 1.35
    if d.day in (14, 29, 2):
        return 1.15
    return 1.0


def _month_factor(d: date, q4_sens: float) -> float:
    if d.month == 12:
        return q4_sens                 # 13th-month pay + holidays
    if d.month == 11:
        return 1.0 + (q4_sens - 1.0) * 0.4
    if d.month in (4, 5):
        return 1.05                    # summer / school-fee season
    return 1.0


def _factor(d: date, q4_sens: float) -> float:
    return _weekday_factor(d) * _payday_factor(d) * _month_factor(d, q4_sens)


def _m(usd: float) -> str:
    return f"${usd / 1e6:.2f}M"


def project(days: int = HORIZON_DAYS) -> list[dict]:
    today = date.today()
    horizon = [today + timedelta(days=i) for i in range(days)]
    out = []
    for ccy, country, base, q4 in CORRIDORS:
        series, total, peak = [], 0.0, None
        for d in horizon:
            exp = base * _factor(d, q4)
            total += exp
            pt = {"date": d.isoformat(), "expected_usd": round(exp, 0),
                  "factor": round(_factor(d, q4), 2)}
            series.append(pt)
            if peak is None or exp > peak["expected_usd"]:
                peak = pt
        out.append({
            "currency": ccy, "country": country,
            "base_daily_usd": base, "base_label": _m(base),
            "today_factor": round(_factor(today, q4), 2),
            "total_usd": round(total, 0), "total_label": _m(total),
            "avg_daily_usd": round(total / days, 0), "avg_label": _m(total / days),
            "peak": peak,
            "series": series,
        })
    return sorted(out, key=lambda x: x["total_usd"], reverse=True)


def funding_need(ccy: str, days: int = 7) -> float:
    """Expected payout funding (USD) for a corridor over the next `days`."""
    row = next((c for c in project(days) if c["currency"] == ccy), None)
    return row["total_usd"] if row else 0.0


def commentary(rows: list[dict]) -> str:
    top = rows[0] if rows else None
    month = datetime.now().strftime("%B")
    prompt = (
        "You are a remittance treasury analyst. In under 55 words, summarise the "
        f"{HORIZON_DAYS}-day payout-flow outlook for funding planning. Read-only. "
        f"Facts: month {month}. Largest corridor {top['currency'] if top else 'n/a'} "
        f"~{top['total_label'] if top else 'n/a'} expected; peak around "
        f"{top['peak']['date'] if top else 'n/a'}."
    )
    fallback = (
        (f"Largest corridor is {top['currency']} (~{top['total_label']} over {HORIZON_DAYS} days), "
         f"peaking near {top['peak']['date']}. " if top else "")
        + f"Seasonality applied for {month}; pre-position funding ahead of payday peaks."
    )
    return intel.narrate(prompt, fallback)


def summary() -> dict:
    rows = project()
    return {
        "horizon_days": HORIZON_DAYS,
        "as_of": date.today().isoformat(),
        "corridors": rows,
        "commentary": commentary(rows),
    }


def _selfcheck() -> None:
    import os
    os.environ.pop("ANTHROPIC_API_KEY", None)
    os.environ.pop("OPENAI_API_KEY", None)
    s = summary()
    assert s["corridors"][0]["currency"] == "PHP", s["corridors"][0]  # biggest
    assert all(len(c["series"]) == HORIZON_DAYS for c in s["corridors"])
    assert funding_need("PHP", 7) > 0
    print("flows self-check ok")


if __name__ == "__main__":
    _selfcheck()
