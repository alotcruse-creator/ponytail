"""Deterministic market-intelligence logic + optional AI summaries.

Everything a trade could hang on is computed here deterministically. The AI
touches only prose: it rewrites the same facts into a brief. No AI output ever
feeds a number back into the app.
"""
import os
from typing import Iterable


def dedup(items: list[dict]) -> list[dict]:
    """Drop duplicate headlines, keeping the highest-importance copy.

    ponytail: casefold + strip is enough for a curated feed; add fuzzy matching
    only if a real source starts emitting near-duplicates.
    """
    best: dict[str, dict] = {}
    for n in items:
        k = n["headline"].strip().casefold()
        if k not in best or n["importance"] > best[k]["importance"]:
            best[k] = n
    return list(best.values())


def rank(items: Iterable[dict]) -> list[dict]:
    """Most market-moving first: importance, then confidence."""
    return sorted(items, key=lambda n: (n["importance"], n["confidence"]),
                  reverse=True)


def top_events(events: list[dict], n: int = 5) -> list[dict]:
    return sorted(events, key=lambda e: e["importance"], reverse=True)[:n]


def _facts(news: list[dict], events: list[dict], sentiment: list[dict],
           currency: str | None = None) -> dict:
    ranked = rank(dedup(news))
    if currency:
        ranked = [n for n in ranked if n["currency"] == currency]
    top_event = top_events(events, 1)
    high_impact = [e for e in events if e["importance"] >= 4]
    return {
        "top_news": [n["headline"] for n in ranked[:4]],
        "top_event": top_event[0] if top_event else None,
        "high_impact": high_impact,
        "sentiment": {s["currency"]: s for s in sentiment},
    }


def morning_brief(news, events, sentiment) -> str:
    f = _facts(news, events, sentiment)
    ev = f["top_event"]
    php = f["sentiment"].get("PHP", {"label": "Neutral", "score": 50})
    prompt = (
        "You are a senior FX macro strategist. In under 90 words write a "
        "trader morning brief. Facts: top risk event today is "
        f"{ev['event'] + ' (' + ev['currency'] + ') at ' + ev['time'] if ev else 'none'}. "
        f"PHP sentiment {php['label']} at {php['score']}%. "
        f"Headlines: {'; '.join(f['top_news'])}."
    )
    fallback = (
        f"Today's largest risk event is "
        f"{(ev['event'] + ' (' + ev['currency'] + ') at ' + ev['time']) if ev else 'light'}. "
        f"PHP is {php['label'].lower()} ({php['score']}%) on BSP guidance; "
        f"watch oil and the US session for afternoon volatility. "
        f"Recommended focus: USD, PHP, JPY. Risk level: "
        f"{'High' if any(e['importance'] == 5 for e in events) else 'Medium'}."
    )
    return _ai(prompt, fallback)


def end_of_day(news, events, sentiment) -> str:
    f = _facts(news, events, sentiment)
    usd = f["sentiment"].get("USD", {"label": "Neutral"})
    php = f["sentiment"].get("PHP", {"label": "Neutral"})
    prompt = (
        "You are a senior FX strategist. In under 80 words write an "
        "end-of-day FX recap. Facts: USD closed "
        f"{usd['label']}, PHP {php['label']}. Drivers: {'; '.join(f['top_news'])}. "
        "Note what to watch tomorrow."
    )
    fallback = (
        f"USD closed {usd['label'].lower()}, PHP {php['label'].lower()}. "
        f"Drivers: {', '.join(f['top_news'][:3])}. "
        f"Tomorrow: watch the BSP statement and remaining high-impact prints. "
        f"Overall risk: Medium."
    )
    return _ai(prompt, fallback)


def _ai(prompt: str, fallback: str) -> str:
    """Narrate the facts via the first AI provider that works.

    Tries each provider in order; one with no key returns None and is skipped,
    one that errors is skipped too. If none produce text, the deterministic
    fallback ships — the AI is a narrator, never a hard requirement.
    """
    for provider in (_anthropic, _openai):
        try:
            text = provider(prompt)
        except Exception:
            continue  # ponytail: provider down -> try the next, then fallback
        if text:
            return text.strip()
    return fallback


def _anthropic(prompt: str) -> str | None:
    key = os.getenv("ANTHROPIC_API_KEY")
    if not key:
        return None
    from anthropic import Anthropic
    r = Anthropic(api_key=key).messages.create(
        model=os.getenv("ANTHROPIC_MODEL", "claude-haiku-4-5-20251001"),
        max_tokens=180, messages=[{"role": "user", "content": prompt}])
    return r.content[0].text


def _openai(prompt: str) -> str | None:
    key = os.getenv("OPENAI_API_KEY")
    if not key:
        return None
    from openai import OpenAI
    r = OpenAI(api_key=key).chat.completions.create(
        model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        messages=[{"role": "user", "content": prompt}],
        max_tokens=180, temperature=0.3)
    return r.choices[0].message.content


def _selfcheck() -> None:
    news = [
        {"headline": "Fed hikes", "currency": "USD", "sentiment": "Bullish",
         "importance": 5, "confidence": 90},
        {"headline": "fed hikes", "currency": "USD", "sentiment": "Bullish",
         "importance": 3, "confidence": 50},  # dup, lower importance
        {"headline": "Oil up", "currency": "PHP", "sentiment": "Bearish",
         "importance": 2, "confidence": 60},
    ]
    d = dedup(news)
    assert len(d) == 2, d                       # duplicate collapsed
    assert max(n["importance"] for n in d if n["headline"].casefold()
               == "fed hikes") == 5             # kept the higher-importance copy
    assert rank(d)[0]["headline"] == "Fed hikes"
    events = [{"event": "CPI", "currency": "USD", "time": "20:30",
               "importance": 5}]
    assert top_events(events, 5)[0]["event"] == "CPI"
    # AI degrades to fallback when no provider key is set
    os.environ.pop("OPENAI_API_KEY", None)
    os.environ.pop("ANTHROPIC_API_KEY", None)
    assert "risk level" in morning_brief(news, events, []).lower()
    print("intel self-check ok")


if __name__ == "__main__":
    _selfcheck()
