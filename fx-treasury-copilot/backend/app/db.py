"""Database layer. SQLite by default; set DATABASE_URL to a Postgres DSN to swap.

ponytail: SQLite so the app runs with zero setup. Postgres is a URL change,
not a rewrite — SQLAlchemy handles both.
"""
import os

from sqlalchemy import String, Integer, Float, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///fx_copilot.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False}
                       if DATABASE_URL.startswith("sqlite") else {})
Session = sessionmaker(bind=engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class News(Base):
    __tablename__ = "news"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    headline: Mapped[str] = mapped_column(String)
    summary: Mapped[str] = mapped_column(String)
    source: Mapped[str] = mapped_column(String)
    url: Mapped[str] = mapped_column(String, default="")
    currency: Mapped[str] = mapped_column(String)       # e.g. "USD"
    sentiment: Mapped[str] = mapped_column(String)      # Bullish | Bearish | Neutral
    importance: Mapped[int] = mapped_column(Integer)    # 1..5 (stars)
    confidence: Mapped[int] = mapped_column(Integer)    # 0..100
    published_time: Mapped[str] = mapped_column(String)  # ISO string


class CalendarEvent(Base):
    __tablename__ = "calendar"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    event: Mapped[str] = mapped_column(String)
    country: Mapped[str] = mapped_column(String)
    currency: Mapped[str] = mapped_column(String)
    date: Mapped[str] = mapped_column(String, default="")  # ISO "2026-07-18"
    time: Mapped[str] = mapped_column(String)           # "20:30" local
    forecast: Mapped[str] = mapped_column(String, default="")
    previous: Mapped[str] = mapped_column(String, default="")
    actual: Mapped[str] = mapped_column(String, default="")
    importance: Mapped[int] = mapped_column(Integer)    # 1..5


class Sentiment(Base):
    __tablename__ = "sentiment"
    currency: Mapped[str] = mapped_column(String, primary_key=True)
    label: Mapped[str] = mapped_column(String)          # Bullish | Bearish | Neutral
    score: Mapped[int] = mapped_column(Integer)         # 0..100


def init_db() -> None:
    Base.metadata.create_all(engine)
