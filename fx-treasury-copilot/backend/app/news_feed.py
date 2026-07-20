"""Live FX news via public RSS, with deterministic tagging.

ponytail: real headlines are free over RSS; the paid part is the analyst
tagging, which we do deterministically instead. `tag()` is a pure function —
no AI, no network — so it is unit-testable and never invents a number the way
an LLM might. The fetch is a thin wrapper; if every feed is unreachable the
caller falls back to seed.py, so the app is never headline-less.

Sentiment here means "implied direction for the tagged currency" and is a
keyword heuristic, not a model. It is labelled honestly in the UI as such.
"""
import time
import urllib.request
from xml.etree import ElementTree as ET

FEEDS = [
    ("FXStreet", "https://www.fxstreet.com/rss/news"),
    ("DailyFX", "https://www.dailyfx.com/feeds/market-news"),
]

# keyword -> currency code. First match wins, so order by specificity.
_CCY = [
    (("peso", "philippine", "bsp", "manila", "php"), "PHP"),
    (("ringgit", "malaysia", "myr"), "MYR"),
    (("yen", "boj", "japan", "jpy"), "JPY"),
    (("euro", "ecb", "eurozone", "eur"), "EUR"),
    (("pound", "sterling", "boe", "gbp", "british"), "GBP"),
    (("yuan", "renminbi", "pboc", "china", "cny", "cnh"), "CNH"),
    (("dollar", "fed", "fomc", "treasury", "usd", "greenback"), "USD"),
]
_BULL = ("rise", "rises", "gain", "gains", "jump", "surge", "surges", "strong",
         "strengthen", "beat", "beats", "rally", "rallies", "climb", "boost",
         "higher", "hawkish", "support", "supports", "upbeat", "recover")
_BEAR = ("fall", "falls", "drop", "drops", "slump", "weak", "weakens", "miss",
         "misses", "decline", "declines", "tumble", "lower", "dovish",
         "pressure", "slide", "slides", "cut", "cuts", "sell-off", "selloff")
_HIGH_IMPACT = ("rate decision", "interest rate", "cpi", "inflation", "fomc",
                "fed ", "ecb", "boj", "payroll", "nonfarm", "gdp", "bsp",
                "central bank", "recession")


def tag(title: str, summary: str, source: str) -> dict:
    """Deterministically derive currency, sentiment, importance, confidence."""
    text = f"{title} {summary}".casefold()

    currency = "USD"
    ccy_hit = False
    for words, code in _CCY:
        if any(w in text for w in words):
            currency, ccy_hit = code, True
            break

    bull = sum(text.count(w) for w in _BULL)
    bear = sum(text.count(w) for w in _BEAR)
    sentiment = "Bullish" if bull > bear else "Bearish" if bear > bull else "Neutral"

    importance = 3
    if any(k in text for k in _HIGH_IMPACT):
        importance += 1
    if source in ("FXStreet", "DailyFX", "Reuters"):
        importance += 0  # trusted but not automatically top-tier
    importance = max(2, min(5, importance))

    signal = (bull + bear) + (1 if ccy_hit else 0)
    confidence = max(55, min(90, 55 + 7 * signal))
    return {"currency": currency, "sentiment": sentiment,
            "importance": importance, "confidence": confidence}


def _parse_pubdate(raw: str) -> str:
    for fmt in ("%a, %d %b %Y %H:%M:%S %z", "%a, %d %b %Y %H:%M:%S %Z"):
        try:
            return time.strftime("%Y-%m-%dT%H:%M:%S", time.strptime(raw, fmt))
        except (ValueError, TypeError):
            continue
    return time.strftime("%Y-%m-%dT%H:%M:%S")


def _fetch_feed(source: str, url: str, limit: int) -> list[dict]:
    req = urllib.request.Request(url, headers={"User-Agent": "fx-copilot/0.1"})
    with urllib.request.urlopen(req, timeout=8) as r:
        root = ET.fromstring(r.read())
    out = []
    for item in root.iter("item"):
        title = (item.findtext("title") or "").strip()
        if not title:
            continue
        summary = (item.findtext("description") or "").strip()
        # RSS descriptions often carry HTML; keep it short and tag-free enough.
        summary = summary.replace("<![CDATA[", "").replace("]]>", "")[:280]
        link = (item.findtext("link") or "").strip()
        pub = _parse_pubdate(item.findtext("pubDate") or "")
        t = tag(title, summary, source)
        out.append({"headline": title, "summary": summary, "source": source,
                    "url": link, "published_time": pub, **t})
        if len(out) >= limit:
            break
    return out


def fetch_news(limit_per_feed: int = 8) -> list[dict]:
    """Pull all feeds, tag deterministically. Returns [] if all fail."""
    items: list[dict] = []
    for source, url in FEEDS:
        try:
            items.extend(_fetch_feed(source, url, limit_per_feed))
        except Exception:
            continue  # ponytail: one dead feed shouldn't sink the rest
    for i, it in enumerate(items):
        it["id"] = i + 1
    return items


def _selfcheck() -> None:
    bsp = tag("Philippine peso rallies as BSP holds rate", "", "FXStreet")
    assert bsp["currency"] == "PHP", bsp
    assert bsp["sentiment"] == "Bullish", bsp
    fed = tag("Dollar falls after dovish Fed, inflation misses", "", "DailyFX")
    assert fed["currency"] == "USD", fed
    assert fed["sentiment"] == "Bearish", fed
    assert fed["importance"] >= 4, fed  # CPI/Fed -> high impact
    flat = tag("Weekly FX market wrap", "", "FXStreet")
    assert flat["sentiment"] == "Neutral", flat
    print("news_feed self-check ok")


if __name__ == "__main__":
    _selfcheck()
