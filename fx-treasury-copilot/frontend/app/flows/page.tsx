"use client";
import { Card } from "@/components/Card";
import { Sparkline } from "@/components/Sparkline";
import { useLive } from "@/lib/live";
import { type Flows } from "@/lib/api";

const EMPTY: Flows = { horizon_days: 14, as_of: "", corridors: [], commentary: "" };

export default function FlowsPage() {
  const { data: d, loading } = useLive<Flows>("/flows", EMPTY);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between mb-1">
        <h1 className="font-serif text-[26px] sm:text-3xl font-normal text-paper tracking-tight">Remittance Flows</h1>
        <span className="text-[10px] font-mono text-ash uppercase tracking-luxe">{d.horizon_days}-day forecast</span>
      </div>

      {loading ? (
        <Card><p className="text-sm text-muted font-mono animate-pulse">Forecasting corridors…</p></Card>
      ) : (
        <>
          <p className="text-xs text-ash">
            Expected inbound payout volume by corridor, with payday and seasonal (13th-month / holiday) factors applied — the input to funding need.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {d.corridors.map((c) => (
              <Card key={c.currency} accentLeft={c.currency === "PHP"}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-accent border border-border rounded px-1.5 py-0.5 bg-bg">{c.currency}</span>
                      <span className="text-sm text-paper">{c.country}</span>
                    </div>
                    <div className="mt-1 text-[10px] text-ash font-mono">today ×{c.today_factor.toFixed(2)} seasonal</div>
                  </div>
                  <Sparkline data={c.series.map((s) => ({ date: s.date, rate: s.expected_usd }))} width={130} height={34} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <div className="text-[10px] font-medium tracking-luxe text-muted uppercase mb-0.5">{d.horizon_days}d total</div>
                    <div className="font-mono text-sm text-paper tnum">{c.total_label}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-medium tracking-luxe text-muted uppercase mb-0.5">Avg/day</div>
                    <div className="font-mono text-sm text-silver tnum">{c.avg_label}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-medium tracking-luxe text-muted uppercase mb-0.5">Peak</div>
                    <div className="font-mono text-xs text-ash tnum">{c.peak.date.slice(5)}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card title="AI — Flow Commentary" accentLeft>
            <p className="text-sm leading-relaxed text-silver">{d.commentary || "No commentary available."}</p>
          </Card>
        </>
      )}
    </div>
  );
}
