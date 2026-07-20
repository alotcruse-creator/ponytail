"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { StatusPill } from "@/components/Risk";
import { api, post, BASE, type Alerts, type Trigger } from "@/lib/api";
import { REFRESH_MS } from "@/lib/live";

const EMPTY: Alerts = { triggers: [], fired: 0, total: 0 };

export default function AlertsPage() {
  const [d, setD] = useState<Alerts>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ kind: "rate", currency: "PHP", op: ">=", level: "", note: "" });

  const load = () => api<Alerts>("/alerts", EMPTY).then((x) => { if (x !== EMPTY) setD(x); setLoading(false); });
  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function add() {
    if (!form.level) return;
    await post("/alerts", { ...form, currency: form.currency.toUpperCase(), level: parseFloat(form.level) }, {});
    setForm({ ...form, level: "", note: "" });
    load();
  }
  async function remove(id: number) {
    try { await fetch(`${BASE}/alerts/${id}`, { method: "DELETE" }); } catch {}
    load();
  }

  const cond = (t: Trigger) =>
    t.kind === "rate" ? `USD/${t.currency} ${t.op} ${t.level_label}` : `${t.currency} limit ${t.op} ${t.level_label}`;

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between mb-1">
        <h1 className="font-serif text-[26px] sm:text-3xl font-normal text-paper tracking-tight">Alerts</h1>
        <span className="text-[10px] font-mono text-ash uppercase tracking-luxe">Read-only · watches, never acts</span>
      </div>

      {!loading && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${
          d.fired > 0 ? "border-bear/30 bg-bear/[0.07] text-bear" : "border-bull/25 bg-bull/[0.06] text-bull/90"
        }`}>
          {d.fired > 0
            ? `${d.fired} trigger${d.fired > 1 ? "s" : ""} firing now — review below.`
            : "Nothing firing — all triggers armed and watching."}
        </div>
      )}

      <Card title="Watchlist">
        {loading ? (
          <p className="text-sm text-muted font-mono animate-pulse">Loading…</p>
        ) : d.triggers.length === 0 ? (
          <p className="text-sm text-muted">No triggers yet — add one below.</p>
        ) : (
          <ul className="divide-y divide-border">
            {d.triggers.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <StatusPill status={t.status} />
                  <span className="text-[10px] font-mono uppercase text-ash border border-border rounded px-1.5 py-0.5">{t.kind}</span>
                  <span className="text-sm text-paper font-mono tnum truncate">{cond(t)}</span>
                  {t.note && <span className="text-xs text-ash truncate hidden sm:inline">· {t.note}</span>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-xs text-muted tnum">now {t.current_label}</span>
                  <button onClick={() => remove(t.id)} className="text-ash hover:text-bear transition-colors text-sm" aria-label="Delete">×</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Add Trigger">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-luxe text-muted">Kind</span>
            <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}
              className="bg-bg border border-border rounded px-2 py-1.5 text-sm text-paper focus:outline-none focus:border-accent/50">
              <option value="rate">Rate</option>
              <option value="limit">Limit %</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-luxe text-muted">Ccy</span>
            <input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="w-16 bg-bg border border-border rounded px-2 py-1.5 text-sm font-mono text-paper uppercase focus:outline-none focus:border-accent/50" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-luxe text-muted">Op</span>
            <select value={form.op} onChange={(e) => setForm({ ...form, op: e.target.value })}
              className="bg-bg border border-border rounded px-2 py-1.5 text-sm text-paper focus:outline-none focus:border-accent/50">
              <option value=">=">≥</option>
              <option value="<=">≤</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-luxe text-muted">Level</span>
            <input type="number" step="any" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}
              className="w-24 bg-bg border border-border rounded px-2 py-1.5 text-sm font-mono text-paper tnum focus:outline-none focus:border-accent/50" />
          </label>
          <label className="flex flex-col gap-1 flex-1 min-w-[140px]">
            <span className="text-[10px] uppercase tracking-luxe text-muted">Note</span>
            <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="bg-bg border border-border rounded px-2 py-1.5 text-sm text-paper focus:outline-none focus:border-accent/50" />
          </label>
          <button onClick={add} className="rounded-lg bg-accent/90 text-bg font-medium text-sm px-4 py-2 hover:bg-accent transition-colors">Add</button>
        </div>
      </Card>
    </div>
  );
}
