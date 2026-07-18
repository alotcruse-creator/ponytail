"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { StatusPill, LimitBar, AlertBanner } from "@/components/Risk";
import { api, type Exposure } from "@/lib/api";

const EMPTY: Exposure = {
  base: "USD", as_of: "", positions: [],
  totals: { gross_usd: 0, gross_label: "—", net_usd: 0, net_label: "—" },
  alerts: [], settlements: { days: [], next: null, largest: null }, commentary: "",
};

export default function ExposurePage() {
  const [d, setD] = useState<Exposure>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Exposure>("/exposure", EMPTY).then((x) => { setD(x); setLoading(false); });
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between mb-1">
        <h1 className="font-serif text-[26px] sm:text-3xl font-normal text-paper tracking-tight">Exposure Monitor</h1>
        <span className="text-[10px] font-mono text-ash uppercase tracking-luxe">Read-only · never trades</span>
      </div>

      {loading ? (
        <Card><p className="text-sm text-muted font-mono animate-pulse">Loading book…</p></Card>
      ) : (
        <>
          <AlertBanner alerts={d.alerts} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Card title="Net USD Exposure" accentLeft>
              <span className="text-4xl font-light font-mono text-paper tnum">{d.totals.net_label}</span>
            </Card>
            <Card title="Gross USD Exposure">
              <span className="text-4xl font-light font-mono text-silver tnum">{d.totals.gross_label}</span>
            </Card>
          </div>

          <Card title="Positions by Currency">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-border">
                    {["Ccy", "Position", "Avg", "Spot", "USD Exp.", "Limit", "P&L", ""].map((h) => (
                      <th key={h} className="pb-2 text-[10px] font-semibold tracking-widest text-muted uppercase pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {d.positions.map((p) => (
                    <tr key={p.currency} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 pr-4">
                        <span className="font-mono text-xs font-semibold text-accent border border-border rounded px-1.5 py-0.5 bg-bg">{p.currency}</span>
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs text-paper tnum whitespace-nowrap">
                        {p.amount_label}
                        <span className={`ml-1.5 ${p.direction === "LONG" ? "text-bull" : "text-bear"}`}>{p.direction}</span>
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs text-ash tnum">{p.avg_rate}</td>
                      <td className="py-3 pr-4 font-mono text-xs text-silver tnum">{p.current_rate}</td>
                      <td className="py-3 pr-4 font-mono text-xs text-paper tnum">{p.usd_label}</td>
                      <td className="py-3 pr-4 min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <LimitBar pct={p.limit_pct} status={p.status} />
                          <span className="font-mono text-[11px] text-muted tnum shrink-0">{p.limit_pct}%</span>
                        </div>
                      </td>
                      <td className={`py-3 pr-4 font-mono text-xs tnum ${p.pnl_usd >= 0 ? "text-bull" : "text-bear"}`}>{p.pnl_label}</td>
                      <td className="py-3"><StatusPill status={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Settlement Ladder">
            <div className="space-y-4">
              {d.settlements.days.map((day) => (
                <div key={day.date}>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-sm font-semibold text-paper">
                      {day.label}
                      {day.label !== day.date && <span className="ml-2 text-xs font-normal text-muted font-mono">{day.date}</span>}
                    </span>
                    <span className={`font-mono text-xs tnum ${day.net_usd >= 0 ? "text-bull" : "text-bear"}`}>
                      net {day.net_usd >= 0 ? "+" : "-"}${Math.abs(day.net_usd / 1e6).toFixed(2)}M
                    </span>
                  </div>
                  <ul className="divide-y divide-border/70">
                    {day.items.map((it) => (
                      <li key={it.id} className="flex items-center justify-between py-1.5 text-sm">
                        <span className="flex items-center gap-2.5 min-w-0">
                          <span className={`text-[9px] font-mono ${it.direction === "IN" ? "text-bull" : "text-bear"}`}>{it.direction === "IN" ? "▼ IN" : "▲ OUT"}</span>
                          <span className="font-mono text-xs text-silver tnum">{it.currency} {Math.abs(it.amount / 1e6).toFixed(1)}M</span>
                          <span className="text-xs text-ash truncate">{it.counterparty}</span>
                        </span>
                        <span className="font-mono text-[11px] text-muted tnum shrink-0">{it.usd >= 0 ? "+" : "-"}${Math.abs(it.usd / 1e6).toFixed(2)}M</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>

          <Card title="AI — Risk Commentary" accentLeft>
            <p className="text-sm leading-relaxed text-silver">{d.commentary || "No commentary available."}</p>
          </Card>
        </>
      )}
    </div>
  );
}
