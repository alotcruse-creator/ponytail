"""Live FX rates from Frankfurter (ECB reference rates, free, no API key).

ponytail: an FX tool must show real rates. Frankfurter is the single fetch
point — swap the URL for a paid intraday feed later and nothing downstream
changes. Every call is wrapped so a network failure degrades to a cached or
empty result, never a 500.

ECB publishes once per weekday (~16:00 CET), so this is honest morning data,
not tick-by-tick. Results are cached in-process for a few minutes.
"""
import time
import urllib.request
import json

BASE_URL = "https://api.frankfurter.dev/v1"
# USD is the book's quote base; PHP first because it is the largest exposure.
PAIRS = ["PHP", "JPY", "EUR", "GBP", "CNY", "MYR"]
_TTL = 120  # seconds; ECB posts daily, but refresh promptly when it does
_cache: dict[str, tuple[float, object]] = {}


def _get(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": "fx-copilot/0.1"})
    with urllib.request.urlopen(req, timeout=8) as r:
        return json.loads(r.read().decode())


def _cached(key: str, build, ttl: int | None = None):
    hit = _cache.get(key)
    now = time.monotonic()
    if hit and now - hit[0] < (ttl if ttl is not None else _TTL):
        return hit[1]
    try:
        val = build()
    except Exception:
        return hit[1] if hit else None  # stale-but-present beats nothing
    _cache[key] = (now, val)
    return val


def latest() -> list[dict]:
    """Current USD-based rates for the tracked pairs, most-relevant first."""
    def build() -> list[dict]:
        d = _get(f"{BASE_URL}/latest?base=USD&symbols={','.join(PAIRS)}")
        rates = d.get("rates", {})
        return [
            {"pair": f"USD/{c}", "currency": c, "rate": rates[c], "date": d.get("date")}
            for c in PAIRS if c in rates
        ]
    return _cached("latest", build) or []


def history(currency: str = "PHP", days: int = 30) -> list[dict]:
    """Daily USD/<currency> closes for a sparkline. Oldest first."""
    def build() -> list[dict]:
        end = time.strftime("%Y-%m-%d")
        start = time.strftime("%Y-%m-%d", time.gmtime(time.time() - days * 86400))
        d = _get(f"{BASE_URL}/{start}..{end}?base=USD&symbols={currency}")
        series = d.get("rates", {})
        return [{"date": day, "rate": series[day][currency]}
                for day in sorted(series) if currency in series[day]]
    return _cached(f"hist:{currency}:{days}", build) or []


def snapshot() -> dict:
    """Everything the rates strip needs in one call."""
    rows = latest()
    php = history("PHP", 30)
    as_of = rows[0]["date"] if rows else None
    return {"rates": rows, "php_history": php, "as_of": as_of}


# ── Full board: every currency the ECB reference feed publishes ──

CCY_NAMES = {
    "EUR": "Euro", "JPY": "Japanese Yen", "GBP": "British Pound",
    "CHF": "Swiss Franc", "AUD": "Australian Dollar", "CAD": "Canadian Dollar",
    "NZD": "New Zealand Dollar", "CNY": "Chinese Yuan", "HKD": "Hong Kong Dollar",
    "SGD": "Singapore Dollar", "PHP": "Philippine Peso", "INR": "Indian Rupee",
    "IDR": "Indonesian Rupiah", "KRW": "South Korean Won", "MYR": "Malaysian Ringgit",
    "THB": "Thai Baht", "MXN": "Mexican Peso", "BRL": "Brazilian Real",
    "ZAR": "South African Rand", "TRY": "Turkish Lira", "ILS": "Israeli Shekel",
    "SEK": "Swedish Krona", "NOK": "Norwegian Krone", "DKK": "Danish Krone",
    "PLN": "Polish Zloty", "CZK": "Czech Koruna", "HUF": "Hungarian Forint",
    "RON": "Romanian Leu", "BGN": "Bulgarian Lev", "ISK": "Icelandic Krona",
}
# PHP first (the book's focus), then the majors, then everything else.
_PRIORITY = ["PHP", "EUR", "JPY", "GBP", "CHF", "AUD", "CAD", "NZD", "CNY",
             "HKD", "SGD"]
ALL_CCYS = sorted(CCY_NAMES)


def all_snapshot(days: int = 30) -> dict:
    """Latest USD rate, 1-day change, and a 30-day trend for every currency."""
    def build() -> dict:
        end = time.strftime("%Y-%m-%d")
        start = time.strftime("%Y-%m-%d", time.gmtime(time.time() - (days + 12) * 86400))
        d = _get(f"{BASE_URL}/{start}..{end}?base=USD&symbols={','.join(ALL_CCYS)}")
        by_date = d.get("rates", {})
        dates = sorted(by_date)
        rows = []
        for c in ALL_CCYS:
            pts = [{"date": dt, "rate": by_date[dt][c]} for dt in dates if c in by_date[dt]]
            if not pts:
                continue
            rate = pts[-1]["rate"]
            prev = pts[-2]["rate"] if len(pts) >= 2 else rate
            chg = (rate - prev) / prev * 100 if prev else 0.0
            rows.append({
                "pair": f"USD/{c}", "currency": c, "name": CCY_NAMES.get(c, c),
                "rate": rate, "prev": prev, "change_pct": round(chg, 3),
                "series": pts[-days:],
            })
        order = {c: i for i, c in enumerate(_PRIORITY)}
        rows.sort(key=lambda r: (order.get(r["currency"], 999), r["currency"]))
        return {"as_of": dates[-1] if dates else None, "rates": rows}
    return _cached(f"all:{days}", build) or {"as_of": None, "rates": []}


# ── World board: every fiat currency (~160) from a no-key feed ──

# open.er-api = free ExchangeRate-API tier, ~161 fiat currencies, USD base,
# daily, no key. Names come from a separate free list. Both are wrapped so a
# failure falls back to the ECB majors board — the page never breaks.
WORLD_URL = "https://open.er-api.com/v6/latest/USD"
NAMES_URL = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies.min.json"


def _names() -> dict:
    def build() -> dict:
        d = _get(NAMES_URL)
        return {k.upper(): v for k, v in d.items() if isinstance(v, str)}
    return _cached("names", build, ttl=86400) or {}


def world_snapshot() -> dict:
    """Every fiat currency vs USD. Majors also carry 1-day change + 30d trend."""
    def build() -> dict:
        d = _get(WORLD_URL)
        rates = d.get("rates", {})
        if not rates:
            raise ValueError("empty world feed")
        names = _names()
        majors = {r["currency"]: r for r in all_snapshot()["rates"]}
        ts = d.get("time_last_update_unix")
        as_of = time.strftime("%Y-%m-%d", time.gmtime(ts)) if ts else None
        rows = []
        for code, rate in rates.items():
            if code == "USD":
                continue
            m = majors.get(code)
            rows.append({
                "pair": f"USD/{code}", "currency": code,
                "name": names.get(code, code),
                "rate": rate,
                "change_pct": m["change_pct"] if m else None,
                "series": m["series"] if m else [],
            })
        order = {c: i for i, c in enumerate(_PRIORITY)}
        rows.sort(key=lambda r: (order.get(r["currency"], 999), r["currency"]))
        return {"as_of": as_of, "rates": rows}
    # Fall back to the ECB majors board if the world feed is unreachable.
    return _cached("world", build, ttl=900) or all_snapshot()


if __name__ == "__main__":  # manual smoke test
    print(json.dumps(snapshot(), indent=2))
