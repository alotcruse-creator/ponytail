"""Phase 5 — Scenario & stress testing. Deterministic what-if over the book.

Answers the trader's core question: "if this pair moves, what happens to my
book?" Computes per-pair sensitivity, a 1-day VaR, and P&L under preset or
custom shock scenarios. Read-only analysis — it never proposes a hedge or a
trade, it only quantifies risk. All maths deterministic; AI (if present) only
narrates.

Shock convention: a positive shock on USD/CCY means the currency DEPRECIATES
vs USD (the rate rises). A long position in a depreciating currency loses USD
value — the signs fall out of that.

ponytail: REF_VOL is illustrative daily volatility. Swap it for a real vol
feed later; nothing downstream changes.
"""
from . import exposure, intel

Z_95 = 1.65  # one-tailed 95% normal quantile

# Illustrative 1-day volatility (fraction) per currency.
REF_VOL = {"PHP": 0.0040, "JPY": 0.0060, "EUR": 0.0050,
           "GBP": 0.0060, "MYR": 0.0045, "CNY": 0.0030, "USD": 0.0}

# (name, description, {ccy: shock_pct})  shock_pct = % change in USD/CCY.
PRESETS = [
    {"name": "BSP dovish surprise",
     "description": "Peso weakens on a soft BSP tone; mild China spillover.",
     "shocks": {"PHP": 1.5, "CNY": 0.3}},
    {"name": "Risk-off / USD bid",
     "description": "Broad USD strength; JPY bid as haven, Asia FX sold.",
     "shocks": {"PHP": 2.0, "MYR": 2.0, "CNY": 1.0, "EUR": 0.5, "GBP": 0.8, "JPY": -1.0}},
    {"name": "Asia risk-on rally",
     "description": "Regional FX rallies; peso and ringgit firm.",
     "shocks": {"PHP": -1.5, "MYR": -1.5, "CNY": -1.0, "JPY": 0.5}},
    {"name": "Oil spike",
     "description": "Brent jumps; oil-importing Asian FX under pressure.",
     "shocks": {"PHP": 1.0, "JPY": 0.5, "MYR": 0.8}},
]


def _positions() -> list[dict]:
    return exposure.summary()["positions"]


def _shock_pnl(positions: list[dict], shocks: dict) -> tuple[float, list[dict]]:
    """USD P&L of the book under a shock map. Returns (total, per-currency)."""
    total, rows = 0.0, []
    for p in positions:
        pct = shocks.get(p["currency"], 0.0) / 100.0
        rate = p["current_rate"]
        new_rate = rate * (1 + pct)
        usd_now = p["amount"] / rate if rate else 0.0
        usd_new = p["amount"] / new_rate if new_rate else 0.0
        pnl = usd_new - usd_now
        total += pnl
        if pct:
            rows.append({"currency": p["currency"], "shock_pct": shocks[p["currency"]],
                         "pnl_usd": round(pnl, 0)})
    return round(total, 0), rows


def sensitivities(positions: list[dict]) -> list[dict]:
    """P&L for a +1% depreciation in each pair (the book's delta per pair)."""
    out = []
    for p in positions:
        pnl, _ = _shock_pnl([p], {p["currency"]: 1.0})
        out.append({"currency": p["currency"], "usd_exposure": p["usd_exposure"],
                    "dpnl_per_1pct": round(pnl, 0)})
    return sorted(out, key=lambda x: abs(x["dpnl_per_1pct"]), reverse=True)


def value_at_risk(positions: list[dict]) -> dict:
    """1-day 95% VaR per currency and portfolio (assumes independence)."""
    per, ssq = [], 0.0
    for p in positions:
        v = Z_95 * REF_VOL.get(p["currency"], 0.0) * abs(p["usd_exposure"])
        ssq += v * v
        per.append({"currency": p["currency"], "var_usd": round(v, 0)})
    port = ssq ** 0.5
    return {"per_currency": sorted(per, key=lambda x: x["var_usd"], reverse=True),
            "portfolio_var_usd": round(port, 0),
            "portfolio_label": f"${port / 1e6:.2f}M"}


def _musd(x: float) -> str:
    return f"{'+' if x >= 0 else '-'}${abs(x) / 1e6:.2f}M"


def run_presets(positions: list[dict]) -> list[dict]:
    out = []
    for s in PRESETS:
        total, rows = _shock_pnl(positions, s["shocks"])
        out.append({**s, "pnl_usd": total, "pnl_label": _musd(total), "by_currency": rows})
    return out


def summary() -> dict:
    pos = _positions()
    var = value_at_risk(pos)
    presets = run_presets(pos)
    worst = min(presets, key=lambda x: x["pnl_usd"]) if presets else None
    prompt = (
        "You are an FX risk analyst. In under 60 words, summarise the book's "
        "scenario risk for a trader. Read-only — quantify risk, do not suggest "
        f"hedges. Facts: 1-day 95% VaR {var['portfolio_label']}. Worst preset: "
        f"{(worst['name'] + ' ' + worst['pnl_label']) if worst else 'none'}."
    )
    fallback = (
        f"1-day 95% VaR is {var['portfolio_label']} (assumes independence). "
        + (f"Worst modelled scenario: {worst['name']} at {worst['pnl_label']}. " if worst else "")
        + "Largest single-pair sensitivity: "
        + (f"{sensitivities(pos)[0]['currency']}." if pos else "n/a.")
    )
    return {
        "as_of": exposure.summary()["as_of"],
        "sensitivities": sensitivities(pos),
        "var": var,
        "presets": presets,
        "commentary": intel.narrate(prompt, fallback),
    }


def custom(shocks: dict) -> dict:
    pos = _positions()
    total, rows = _shock_pnl(pos, shocks)
    return {"shocks": shocks, "total_pnl_usd": total, "total_label": _musd(total),
            "by_currency": rows}


def _selfcheck() -> None:
    import os
    os.environ.pop("ANTHROPIC_API_KEY", None)
    os.environ.pop("OPENAI_API_KEY", None)
    from .book import seed_book
    seed_book(force=True)
    s = summary()
    assert s["var"]["portfolio_var_usd"] > 0, s["var"]
    assert len(s["presets"]) == len(PRESETS)
    # long PHP loses when PHP depreciates (+ shock)
    c = custom({"PHP": 2.0})
    assert c["total_pnl_usd"] < 0, c
    print("scenario self-check ok")


if __name__ == "__main__":
    _selfcheck()
