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

  const shell =
    "relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-panel/90 to-raised/60 backdrop-blur-sm p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_28px_60px_-32px_rgba(0,0,0,0.9)]";

  if (loading) {
    return (
      <div className={shell}>
        <div className="h-20 bg-border/30 rounded-lg animate-pulse" />
      </div>
    );
  }
  if (snap.rates.length === 0) {
    return (
      <div className={`${shell} text-sm text-muted`}>
        Live rates unavailable right now — the rate feed didn&apos;t respond. Sentiment and news below are unaffected.
      </div>
    );
  }

  return (
    <div className={shell}>
      {/* faint gold glow, top-left */}
      <span className="pointer-events-none absolute -top-16 -left-10 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />

      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[10px] font-medium tracking-luxe text-accent/85 uppercase">Live FX Rates</h2>
          <div className="mt-2 h-px w-9 rule-gold" />
        </div>
        <span className="text-[10px] font-mono text-ash">
          {snap.as_of ? `ECB ref · ${snap.as_of}` : ""}
        </span>
      </div>

      <div className="flex flex-wrap items-end gap-x-10 gap-y-6">
        {php && (
          <div className="flex flex-wrap items-end gap-5">
            <div>
              <div className="text-[10px] font-medium tracking-luxe text-muted uppercase mb-1">USD / PHP</div>
              <div className="flex items-baseline gap-2.5">
                <span className="text-4xl sm:text-5xl font-light font-mono text-paper tnum leading-none">{fmt(php.rate)}</span>
                {trend !== 0 && (
                  <span className={`text-xs font-mono tnum ${trend >= 0 ? "text-bear" : "text-bull"}`}>
                    {trend >= 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(3)}
                    <span className="text-ash"> / 30d</span>
                  </span>
                )}
              </div>
            </div>
            {hist.length >= 2 && (
              <div className="pb-1.5">
                <Sparkline data={hist} width={160} height={40} />
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-x-8 gap-y-3 sm:pl-8 sm:border-l border-border/70">
          {others.map((r) => (
            <div key={r.currency} className="min-w-[76px]">
              <div className="text-[10px] font-medium tracking-luxe text-muted uppercase mb-1">{r.pair}</div>
              <div className="text-xl font-light font-mono text-silver tnum">{fmt(r.rate)}</div>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-5 text-[10px] text-ash tracking-wide">
        Higher USD/PHP = weaker peso · ECB daily reference rates, not intraday.
      </p>
    </div>
  );
}
