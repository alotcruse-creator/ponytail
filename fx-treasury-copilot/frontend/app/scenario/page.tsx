"use client";
import { useState } from "react";
import { Card } from "@/components/Card";
import { useLive } from "@/lib/live";
import { post, type Scenario, type CustomShock } from "@/lib/api";

const EMPTY: Scenario = {
  as_of: "", sensitivities: [],
  var: { per_currency: [], portfolio_var_usd: 0, portfolio_label: "—" },
  presets: [], commentary: "",
};
const PAIRS = ["PHP", "JPY", "EUR", "GBP", "MYR", "CNY"];

function usd(n: number) {
  return `${n >= 0 ? "+" : "-"}$${Math.abs(n / 1e6).toFixed(2)}M`;
}

export default function ScenarioPage() {
  const { data: d, loading } = useLive<Scenario>("/scenario", EMPTY);
  const [shocks, setShocks] = useState<Record<string, number>>({});
  const [result, setResult] = useState<CustomShock | null>(null);
  const [running, setRunning] = useState(false);

  async function run() {
    const active = Object.fromEntries(Object.entries(shocks).filter(([, v]) => v));
    if (Object.keys(active).length === 0) { setResult(null); return; }
    setRunning(true);
    setResult(await post<CustomShock>("/scenario", { shocks: active }, {
      shocks: active, total_pnl_usd: 0, total_label: "—", by_currency: [],
    }));
    setRunning(false);
  }

  const maxSens = Math.max(1, ...d.sensitivities.map((s) => Math.abs(s.dpnl_per_1pct)));

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between mb-1">
        <h1 className="font-serif text-[26px] sm:text-3xl font-normal text-paper tracking-tight">Scenario &amp; Stress</h1>
        <span className="text-[10px] font-mono text-ash uppercase tracking-luxe">Read-only · quantifies risk</span>
      </div>

      {loading ? (
        <Card><p className="text-sm text-muted font-mono animate-pulse">Running scenarios…</p></Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card title="1-Day 95% VaR" accentLeft>
              <span className="text-4xl font-light font-mono text-paper tnum">{d.var.portfolio_label}</span>
              <p className="mt-2 text-[10px] text-ash">Portfolio, assumes independence across pairs.</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                {d.var.per_currency.slice(0, 5).map((v) => (
                  <span key={v.currency} className="text-xs font-mono text-muted tnum">
                    {v.currency} <span className="text-silver">${(v.var_usd / 1e6).toFixed(2)}M</span>
                  </span>
                ))}
              </div>
            </Card>

            <Card title="Sensitivity — P&L per +1% depreciation">
              <div className="space-y-2">
                {d.sensitivities.map((s) => (
                  <div key={s.currency} className="flex items-center gap-3">
                    <span className="font-mono text-xs text-silver w-9 shrink-0">{s.currency}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-border/50 overflow-hidden">
                      <div className={`h-full ${s.dpnl_per_1pct >= 0 ? "bg-bull" : "bg-bear"}`}
                        style={{ width: `${(Math.abs(s.dpnl_per_1pct) / maxSens) * 100}%` }} />
                    </div>
                    <span className={`font-mono text-[11px] tnum w-20 text-right shrink-0 ${s.dpnl_per_1pct >= 0 ? "text-bull" : "text-bear"}`}>
                      {usd(s.dpnl_per_1pct)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card title="Preset Scenarios">
            <div className="grid gap-3 sm:grid-cols-2">
              {d.presets.map((p) => (
                <div key={p.name} className="rounded-lg border border-border bg-bg/50 p-4">
                  <div className="flex items-baseline justify-between gap-3 mb-1">
                    <span className="text-sm font-semibold text-paper">{p.name}</span>
                    <span className={`font-mono text-sm tnum shrink-0 ${p.pnl_usd >= 0 ? "text-bull" : "text-bear"}`}>{p.pnl_label}</span>
                  </div>
                  <p className="text-xs text-ash leading-relaxed mb-2">{p.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(p.shocks).map(([c, v]) => (
                      <span key={c} className="text-[10px] font-mono text-muted border border-border rounded px-1.5 py-0.5 bg-panel tnum">
                        {c} {v > 0 ? "+" : ""}{v}%
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Custom Shock">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {PAIRS.map((c) => (
                <label key={c} className="flex items-center gap-2">
                  <span className="font-mono text-xs text-silver w-9">{c}</span>
                  <input type="number" step="0.5" placeholder="0"
                    value={shocks[c] ?? ""}
                    onChange={(e) => setShocks((s) => ({ ...s, [c]: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-bg border border-border rounded px-2 py-1.5 text-sm font-mono text-paper tnum focus:outline-none focus:border-accent/50" />
                  <span className="text-xs text-ash">%</span>
                </label>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <button onClick={run} disabled={running}
                className="rounded-lg bg-accent/90 text-bg font-medium text-sm px-4 py-2 hover:bg-accent transition-colors disabled:opacity-40">
                {running ? "Running…" : "Run shock"}
              </button>
              {result && (
                <span className={`font-mono text-lg tnum ${result.total_pnl_usd >= 0 ? "text-bull" : "text-bear"}`}>
                  {result.total_label}
                  <span className="text-ash text-xs ml-2">book P&amp;L</span>
                </span>
              )}
            </div>
            <p className="mt-3 text-[10px] text-ash">Positive % = the currency depreciates vs USD.</p>
          </Card>

          <Card title="AI — Scenario Commentary" accentLeft>
            <p className="text-sm leading-relaxed text-silver">{d.commentary || "No commentary available."}</p>
          </Card>
        </>
      )}
    </div>
  );
}
