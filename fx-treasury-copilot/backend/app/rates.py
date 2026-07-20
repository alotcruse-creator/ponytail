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
_TTL = 600  # seconds; ECB updates at most once a weekday
_cache: dict[str, tuple[float, object]] = {}


def _get(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": "fx-copilot/0.1"})
    with urllib.request.urlopen(req, timeout=8) as r:
        return json.loads(r.read().decode())


def _cached(key: str, build):
    hit = _cache.get(key)
    now = time.monotonic()
    if hit and now - hit[0] < _TTL:
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


if __name__ == "__main__":  # manual smoke test
    print(json.dumps(snapshot(), indent=2))
