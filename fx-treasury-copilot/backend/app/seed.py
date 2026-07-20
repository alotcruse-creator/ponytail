"""Deterministic sample data for Phase 1.

ponytail: real feeds (Reuters/Bloomberg/BSP/Fed/ECB/BOJ) are paid or unshaped
for us today. This module is the single fetch point — swap these literals for
live pulls behind the same shape and nothing downstream changes. Data is
PHP-first because PHP is the book's largest exposure.

News now prefers a live RSS pull (see news_feed.py); these literals are the
guaranteed fallback when the feed is unreachable. The calendar is seeded across
the current work week so the "week ahead" view always has content.
"""
from datetime import date, timedelta

from .db import News, CalendarEvent, Sentiment, Session, init_db

# (headline, summary, source, currency, sentiment, importance, confidence, time)
_NEWS = [
    ("Fed signals slower rate cuts",
     "Fed officials continue to flag that inflation remains above target, "
     "keeping the door open to fewer 2026 cuts than markets had priced.",
     "Federal Reserve", "USD", "Bullish", 5, 92, "2026-07-17T06:00:00"),
    ("BSP Governor: peso strength 'welcome', more guidance tomorrow",
     "Bangko Sentral ng Pilipinas signalled comfort with recent PHP levels "
     "and flagged a policy statement tomorrow, supporting the peso.",
     "Bangko Sentral ng Pilipinas", "PHP", "Bullish", 4, 78, "2026-07-17T05:30:00"),
    ("Oil rises 2% on supply concerns",
     "Brent climbed 2% overnight, a headwind for oil-importing Asian "
     "currencies including PHP over the session.",
     "Reuters", "PHP", "Bearish", 3, 70, "2026-07-17T04:15:00"),
    ("China exports beat estimates",
     "Stronger Chinese trade data lifted regional risk sentiment, mildly "
     "supportive for Asian FX.",
     "TradingEconomics", "CNH", "Bullish", 3, 65, "2026-07-17T03:00:00"),
    ("Philippines inflation surprises lower",
     "Softer PHP CPI eases pressure on BSP to tighten, a modest peso "
     "positive on the margin.",
     "TradingEconomics", "PHP", "Bullish", 4, 74, "2026-07-17T02:00:00"),
]

# Week-ahead calendar, seeded relative to today so it is always current.
# (day_offset_from_today, event, country, currency, time, forecast, previous, importance)
_CALENDAR_TEMPLATE = [
    (0, "CPI y/y", "USA", "USD", "20:30", "2.8%", "2.7%", 5),
    (0, "Fed Speaker", "USA", "USD", "22:00", "", "", 4),
    (0, "BSP Interest Rate Decision", "Philippines", "PHP", "16:00", "6.25%", "6.25%", 5),
    (1, "Manufacturing PMI", "China", "CNH", "09:30", "50.4", "50.1", 4),
    (1, "Retail Sales m/m", "USA", "USD", "20:30", "0.4%", "0.6%", 3),
    (2, "CPI y/y", "UK", "GBP", "14:00", "2.1%", "2.0%", 3),
    (2, "PHP GDP q/y", "Philippines", "PHP", "09:00", "5.8%", "5.9%", 4),
    (3, "ECB Rate Decision", "Eurozone", "EUR", "20:15", "3.15%", "3.15%", 5),
    (3, "BOJ Policy Statement", "Japan", "JPY", "03:00", "", "0.50%", 4),
    (4, "Nonfarm Payrolls", "USA", "USD", "20:30", "180K", "206K", 5),
    (4, "PHP Trade Balance", "Philippines", "PHP", "09:00", "-4.2B", "-4.4B", 3),
]

# (currency, label, score)
_SENTIMENT = [
    ("USD", "Bullish", 83),
    ("PHP", "Bullish", 72),
    ("MYR", "Bearish", 44),
    ("JPY", "Bullish", 76),
]


def _week_dates(offset: int) -> str:
    """Map a day offset to a weekday date string, skipping weekends."""
    d = date.today()
    added = 0
    while added < offset:
        d += timedelta(days=1)
        if d.weekday() < 5:  # Mon–Fri only
            added += 1
    return d.isoformat()


def seed(force: bool = False) -> None:
    init_db()
    with Session() as s:
        if s.query(CalendarEvent).first() and not force:
            return
        for t in (News, CalendarEvent, Sentiment):
            s.query(t).delete()
        for h, sm, src, cur, sent, imp, conf, t in _NEWS:
            s.add(News(headline=h, summary=sm, source=src, currency=cur,
                       sentiment=sent, importance=imp, confidence=conf,
                       published_time=t))
        for off, ev, co, cur, tm, fc, pv, imp in _CALENDAR_TEMPLATE:
            s.add(CalendarEvent(event=ev, country=co, currency=cur,
                                date=_week_dates(off), time=tm,
                                forecast=fc, previous=pv, importance=imp))
        for cur, lab, sc in _SENTIMENT:
            s.add(Sentiment(currency=cur, label=lab, score=sc))
        s.commit()


if __name__ == "__main__":
    seed(force=True)
    print("seeded")
