import type { RatesSnapshot } from "@/lib/api";
import { Sparkline } from "./Sparkline";

function fmt(n: number): string {
  return n >= 100 ? n.toFixed(2) : n >= 10 ? n.toFixed(3) : n.toFixed(4);
}

export function Rates({ snap, loading }: { snap: RatesSnapshot; loading: boolean }) {
  const php = snap.rates.find((r) => r.currency === "PHP");
  const others = snap.rates.filter((r) => r.currency !== "PHP");
  const hist = snap.php_history;
  const trend = hist.length >= 2 ? hist[hist.length - 1].rate - hist[0].rate : 0;

  if (loading) {
    return (
      <div className="bg-panel border border-border rounded-lg p-4">
        <div className="h-16 bg-border/40 rounded animate-pulse" />
      </div>
    );
  }
  if (snap.rates.length === 0) {
    return (
      <div className="bg-panel border border-border rounded-lg p-4 text-sm text-muted">
        Live rates unavailable right now — the rate feed didn't respond. Sentiment and news below are unaffected.
      </div>
    );
  }

  return (
    <div className="bg-panel border border-border rounded-lg p-4 border-l-[3px] border-l-accent">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[10px] font-semibold tracking-[0.18em] text-muted uppercase">Live FX Rates</h2>
        <span className="text-[10px] font-mono text-muted">
          {snap.as_of ? `ECB ref · ${snap.as_of}` : ""}
        </span>
      </div>

      <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
        {php && (
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <div className="text-[10px] font-mono text-muted mb-0.5">USD / PHP</div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-100">{fmt(php.rate)}</span>
                {trend !== 0 && (
                  <span className={`text-xs font-mono ${trend >= 0 ? "text-bear" : "text-bull"}`}>
                    {trend >= 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(3)} / 30d
                  </span>
                )}
              </div>
            </div>
            {hist.length >= 2 && (
              <div className="pb-1">
                <Sparkline data={hist} />
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {others.map((r) => (
            <div key={r.currency} className="min-w-[74px]">
              <div className="text-[10px] font-mono text-muted mb-0.5">{r.pair}</div>
              <div className="text-lg font-semibold font-mono text-slate-200">{fmt(r.rate)}</div>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 text-[10px] text-muted">
        Higher USD/PHP = weaker peso. ECB daily reference rates; not intraday.
      </p>
    </div>
  );
}
