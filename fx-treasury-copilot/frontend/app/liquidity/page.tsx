"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { StatusPill, AlertBanner } from "@/components/Risk";
import { Sparkline } from "@/components/Sparkline";
import { api, type Liquidity } from "@/lib/api";

const EMPTY: Liquidity = {
  base_horizon_days: 7, as_of: "", currencies: [], alerts: [], commentary: "",
};

export default function LiquidityPage() {
  const [d, setD] = useState<Liquidity>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Liquidity>("/liquidity", EMPTY).then((x) => { setD(x); setLoading(false); });
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between mb-1">
        <h1 className="font-serif text-[26px] sm:text-3xl font-normal text-paper tracking-tight">Liquidity</h1>
        <span className="text-[10px] font-mono text-ash uppercase tracking-luxe">{d.base_horizon_days}-day outlook</span>
      </div>

      {loading ? (
        <Card><p className="text-sm text-muted font-mono animate-pulse">Projecting cash flows…</p></Card>
      ) : (
        <>
          <AlertBanner alerts={d.alerts} />

          <div className="grid gap-4 sm:grid-cols-2">
            {d.currencies.map((c) => (
              <Card key={c.currency} accentLeft={c.status !== "OK"}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-sm font-semibold text-accent border border-border rounded px-1.5 py-0.5 bg-bg">{c.currency}</span>
                    <StatusPill status={c.status} />
                  </div>
                  <Sparkline data={c.series.map((s) => ({ date: s.date, rate: s.projected }))} width={130} height={34} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <div className="text-[10px] font-medium tracking-luxe text-muted uppercase mb-0.5">Opening</div>
                    <div className="font-mono text-xs text-silver tnum">{c.opening_label}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-medium tracking-luxe text-muted uppercase mb-0.5">Min proj.</div>
                    <div className={`font-mono text-xs tnum ${c.status === "GAP" ? "text-bear" : "text-paper"}`}>{c.min_label}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-medium tracking-luxe text-muted uppercase mb-0.5">Floor</div>
                    <div className="font-mono text-xs text-ash tnum">{c.floor_label}</div>
                  </div>
                </div>
                {c.gap > 0 && (
                  <div className="mt-3 text-xs text-bear">
                    Pre-fund <span className="font-mono tnum">{c.gap_label}</span> before value date.
                  </div>
                )}
              </Card>
            ))}
          </div>

          <Card title="AI — Liquidity Commentary" accentLeft>
            <p className="text-sm leading-relaxed text-silver">{d.commentary || "No commentary available."}</p>
          </Card>
        </>
      )}
    </div>
  );
}
