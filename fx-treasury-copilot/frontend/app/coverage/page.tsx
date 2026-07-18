"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { StatusPill, LimitBar } from "@/components/Risk";
import { api, type Coverage } from "@/lib/api";

const EMPTY: Coverage = {
  cover_days: 7, target_low: 60, target_high: 90, as_of: "",
  rows: [], total_open_usd: 0, total_open_label: "—", commentary: "",
};

export default function CoveragePage() {
  const [d, setD] = useState<Coverage>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Coverage>("/coverage", EMPTY).then((x) => { setD(x); setLoading(false); });
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between mb-1">
        <h1 className="font-serif text-[26px] sm:text-3xl font-normal text-paper tracking-tight">Hedge Coverage</h1>
        <span className="text-[10px] font-mono text-ash uppercase tracking-luxe">Read-only · {d.cover_days}-day forecast</span>
      </div>

      {loading ? (
        <Card><p className="text-sm text-muted font-mono animate-pulse">Reconciling cover…</p></Card>
      ) : (
        <>
          <Card title="Total Open (Unhedged) Forecast Flow" accentLeft>
            <span className="text-4xl font-light font-mono text-paper tnum">{d.total_open_label}</span>
            <p className="mt-2 text-[10px] text-ash">Target coverage band {d.target_low}–{d.target_high}%. Positions stand in for hedges until a hedge feed is wired.</p>
          </Card>

          <Card title="Coverage by Corridor">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-border">
                    {["Corridor", "Forecast", "Hedged", "Open", "Coverage", "Carry", ""].map((h) => (
                      <th key={h} className="pb-2 text-[10px] font-semibold tracking-widest text-muted uppercase pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {d.rows.map((r) => (
                    <tr key={r.currency} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 pr-4 whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold text-accent border border-border rounded px-1.5 py-0.5 bg-bg">{r.currency}</span>
                        <span className="ml-2 text-xs text-ash">{r.country}</span>
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs text-paper tnum">{r.forecast_label}</td>
                      <td className="py-3 pr-4 font-mono text-xs text-silver tnum">{r.hedged_label}</td>
                      <td className="py-3 pr-4 font-mono text-xs text-bear tnum">{r.open_label}</td>
                      <td className="py-3 pr-4 min-w-[130px]">
                        <div className="flex items-center gap-2">
                          <LimitBar pct={r.coverage_pct} status={r.status === "OK" ? "OK" : "UNDER"} />
                          <span className="font-mono text-[11px] text-muted tnum shrink-0 w-10 text-right">{r.coverage_pct}%</span>
                        </div>
                      </td>
                      <td className={`py-3 pr-4 font-mono text-xs tnum ${r.carry_pa >= 0 ? "text-bull" : "text-bear"}`}>{r.carry_label}</td>
                      <td className="py-3"><StatusPill status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[10px] text-ash">Carry = destination policy rate minus USD. Positive carry earns while holding cover; negative is a cost.</p>
          </Card>

          <Card title="AI — Coverage Commentary" accentLeft>
            <p className="text-sm leading-relaxed text-silver">{d.commentary || "No commentary available."}</p>
          </Card>
        </>
      )}
    </div>
  );
}
