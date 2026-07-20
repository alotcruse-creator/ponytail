"use client";
import { useMemo, useState } from "react";
import { Card } from "@/components/Card";
import { Ticker } from "@/components/Ticker";
import { Sparkline } from "@/components/Sparkline";
import { useLive } from "@/lib/live";
import { type MarketsAll } from "@/lib/api";

const EMPTY: MarketsAll = { as_of: null, rates: [] };

function fmt(n: number): string {
  return n >= 100 ? n.toFixed(2) : n >= 10 ? n.toFixed(3) : n.toFixed(4);
}

export default function MarketsPage() {
  const { data: d, loading } = useLive<MarketsAll>("/rates/all", EMPTY);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toUpperCase();
    if (!s) return d.rates;
    return d.rates.filter((r) => r.currency.includes(s) || r.name.toUpperCase().includes(s));
  }, [d.rates, q]);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between mb-1">
        <h1 className="font-serif text-[26px] sm:text-3xl font-normal text-paper tracking-tight">Markets</h1>
        <span className="text-[10px] font-mono text-ash uppercase tracking-luxe">
          {d.rates.length} pairs{d.as_of ? ` · ${d.as_of}` : ""}
        </span>
      </div>

      {loading ? (
        <Card><p className="text-sm text-muted font-mono animate-pulse">Loading the board…</p></Card>
      ) : d.rates.length === 0 ? (
        <Card><p className="text-sm text-muted">Rate feed unavailable right now — try refreshing.</p></Card>
      ) : (
        <>
          <Ticker rates={d.rates} />

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search currency (e.g. EUR, peso, rupee)…"
            className="w-full bg-bg border border-border rounded-lg px-3.5 py-2.5 text-sm text-paper placeholder:text-ash focus:outline-none focus:border-accent/50"
          />

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-border">
                    {["Pair", "Currency", "Rate", "1D", "30D"].map((h) => (
                      <th key={h} className="pb-2 text-[10px] font-semibold tracking-widest text-muted uppercase pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((r) => {
                    const up = r.change_pct >= 0;
                    return (
                      <tr key={r.currency} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 pr-4">
                          <span className="font-mono text-xs font-semibold text-accent border border-border rounded px-1.5 py-0.5 bg-bg whitespace-nowrap">{r.pair}</span>
                        </td>
                        <td className="py-2.5 pr-4 text-silver whitespace-nowrap">{r.name}</td>
                        <td className="py-2.5 pr-4 font-mono text-paper tnum whitespace-nowrap">{fmt(r.rate)}</td>
                        <td className={`py-2.5 pr-4 font-mono text-xs tnum whitespace-nowrap ${up ? "text-bull" : "text-bear"}`}>
                          {up ? "▲" : "▼"} {Math.abs(r.change_pct).toFixed(2)}%
                        </td>
                        <td className="py-2.5">
                          <Sparkline data={r.series} width={90} height={26} />
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} className="py-4 text-sm text-muted text-center">No match for “{q}”.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <p className="text-[10px] text-ash">
            USD/XXX = units of that currency per 1 USD, so a rise means the currency weakened against the dollar. ECB daily reference rates, not intraday.
          </p>
        </>
      )}
    </div>
  );
}
