"""The book: sample positions, settlements, limits, balances (Phase 2+).

ponytail: this is the SINGLE SWAP POINT for the real position feed. When
treasury gives you access to the back-office system (API, nightly SFTP drop,
DB view, whatever), replace the literals below with that pull behind the same
shape and nothing downstream changes — exposure.py and liquidity.py keep
working untouched.

Sample numbers are PHP-first and deliberately span OK / WARN / BREACH so the
UI can be seen doing its job before a real feed exists. Everything here is
read-only: the app measures the book, it never trades it.

amount sign convention: + = long the currency / inflow to us, - = short / outflow.
avg_rate and all rates are quoted "currency units per 1 USD" (USD/CCY), matching
rates.py, e.g. USD/PHP ≈ 57.5.
"""
from datetime import date, timedelta

from .db import Position, Settlement, Limit, Balance, Session, init_db

_TODAY = date.today()


def _d(offset: int) -> str:
    return (_TODAY + timedelta(days=offset)).isoformat()


# (currency, amount_ccy, avg_rate)
_POSITIONS = [
    ("PHP", 278_000_000, 57.20),   # ~+4.86M USD
    ("JPY", 620_000_000, 149.00),  # ~+4.16M USD
    ("EUR", -3_200_000, 0.930),    # ~-3.44M USD (short)
    ("GBP", 1_400_000, 0.790),     # ~+1.77M USD
    ("MYR", -12_000_000, 4.420),   # ~-2.71M USD (short) -> breaches its limit
    ("CNY", 18_000_000, 7.050),    # ~+2.55M USD
]

# (currency, amount_signed, direction, day_offset, counterparty)
_SETTLEMENTS = [
    ("PHP", -38_000_000, "OUT", 0, "BSP RTGS"),
    ("USD", 5_000_000, "IN", 0, "Correspondent Bank A"),
    ("MYR", -8_000_000, "OUT", 1, "Maybank"),
    ("JPY", -210_000_000, "OUT", 1, "Nomura"),
    ("EUR", 1_500_000, "IN", 2, "Deutsche Bank"),
    ("PHP", 64_000_000, "IN", 2, "Remittance batch"),
    ("GBP", -900_000, "OUT", 3, "Barclays"),
    ("PHP", -52_000_000, "OUT", 4, "Payout partners"),
]

# (currency, max_exposure_usd, liquidity_floor_ccy)
_LIMITS = [
    ("PHP", 6_000_000, 100_000_000),
    ("JPY", 5_000_000, 300_000_000),
    ("EUR", 4_000_000, 1_500_000),
    ("GBP", 3_000_000, 800_000),
    ("MYR", 2_500_000, 2_000_000),
    ("CNY", 4_000_000, 10_000_000),
    ("USD", 10_000_000, 3_000_000),
]

# (currency, balance_ccy)
_BALANCES = [
    ("PHP", 120_000_000),
    ("USD", 8_000_000),
    ("JPY", 450_000_000),
    ("EUR", 2_000_000),
    ("GBP", 1_200_000),
    ("MYR", 5_000_000),
    ("CNY", 20_000_000),
]


def seed_book(force: bool = False) -> None:
    init_db()
    with Session() as s:
        if s.query(Position).first() and not force:
            return
        for t in (Position, Settlement, Limit, Balance):
            s.query(t).delete()
        for cur, amt, rate in _POSITIONS:
            s.add(Position(currency=cur, amount=amt, avg_rate=rate, updated=_d(0)))
        for cur, amt, direction, off, cp in _SETTLEMENTS:
            s.add(Settlement(currency=cur, amount=amt, direction=direction,
                             value_date=_d(off), counterparty=cp))
        for cur, mx, floor in _LIMITS:
            s.add(Limit(currency=cur, max_exposure_usd=mx, liquidity_floor=floor))
        for cur, bal in _BALANCES:
            s.add(Balance(currency=cur, balance=bal, updated=_d(0)))
        s.commit()


if __name__ == "__main__":
    seed_book(force=True)
    print("book seeded")
