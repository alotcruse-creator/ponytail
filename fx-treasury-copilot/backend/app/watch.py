"""Phase 5 — Rate & limit alerts. A personal watchlist.

Fires when a live rate crosses a level, or a currency's exposure crosses a
limit-utilisation threshold. This is a personal productivity feature — it
watches the same read-only figures the rest of the app computes and tells you
when to look. It does not act. (Push / Telegram delivery is a later wire; the
evaluation is here and correct now.)

Triggers persist in the DB so they survive restarts; sample triggers are
seeded so the page is populated on first run.
"""
from . import exposure, rates
from .db import Trigger, Session

# (kind, currency, op, level, note)
_SEED = [
    ("rate", "PHP", ">=", 58.00, "Peso weakness — review PHP cover"),
    ("rate", "PHP", "<=", 56.50, "Peso strength — cheaper to pre-fund PHP"),
    ("rate", "JPY", ">=", 152.00, "Yen weak — watch import corridor"),
    ("limit", "PHP", ">=", 85.0, "PHP exposure near limit"),
    ("limit", "MYR", ">=", 100.0, "MYR over limit"),
]


def seed_triggers(force: bool = False) -> None:
    with Session() as s:
        if s.query(Trigger).first() and not force:
            return
        s.query(Trigger).delete()
        for kind, cur, op, level, note in _SEED:
            s.add(Trigger(kind=kind, currency=cur, op=op, level=level, note=note))
        s.commit()


def _rows() -> list[dict]:
    with Session() as s:
        return [{c.name: getattr(r, c.name) for c in Trigger.__table__.columns}
                for r in s.query(Trigger).all()]


def _current(kind: str, currency: str, rate_map: dict, exp_map: dict) -> float | None:
    if kind == "rate":
        return rate_map.get(currency)
    if kind == "limit":
        return exp_map.get(currency)
    return None


def _fired(op: str, current: float, level: float) -> bool:
    return current >= level if op == ">=" else current <= level


def evaluate() -> dict:
    rate_map = {r["currency"]: r["rate"] for r in rates.latest()}
    rate_map = {**exposure.REF_RATES, **rate_map}
    exp_map = {p["currency"]: p["limit_pct"] for p in exposure.summary()["positions"]}

    out, fired_n = [], 0
    for t in _rows():
        cur = _current(t["kind"], t["currency"], rate_map, exp_map)
        status = "ARMED"
        if cur is not None and _fired(t["op"], cur, t["level"]):
            status = "FIRED"
            fired_n += 1
        unit = "%" if t["kind"] == "limit" else ""
        out.append({
            **t,
            "current": round(cur, 2) if cur is not None else None,
            "current_label": (f"{cur:.2f}{unit}" if cur is not None else "—"),
            "level_label": f"{t['level']:.2f}{unit}",
            "status": status,
        })
    out.sort(key=lambda x: (x["status"] != "FIRED", x["kind"], x["currency"]))
    return {"triggers": out, "fired": fired_n, "total": len(out)}


def add(kind: str, currency: str, op: str, level: float, note: str = "") -> dict:
    if kind not in ("rate", "limit") or op not in (">=", "<="):
        return {"ok": False, "error": "invalid trigger"}
    with Session() as s:
        s.add(Trigger(kind=kind, currency=currency.upper(), op=op,
                      level=float(level), note=note))
        s.commit()
    return {"ok": True}


def remove(trigger_id: int) -> dict:
    with Session() as s:
        row = s.get(Trigger, trigger_id)
        if row:
            s.delete(row)
            s.commit()
    return {"ok": True}


def _selfcheck() -> None:
    from .book import seed_book
    seed_book(force=True)
    seed_triggers(force=True)
    e = evaluate()
    assert e["total"] >= 5, e
    myr = next(t for t in e["triggers"] if t["currency"] == "MYR" and t["kind"] == "limit")
    assert myr["status"] == "FIRED", myr   # MYR seeded over 100% limit
    print("watch self-check ok")


if __name__ == "__main__":
    _selfcheck()
