import type { MarketRate } from "@/lib/api";

function fmt(n: number): string {
  return n >= 100 ? n.toFixed(2) : n >= 10 ? n.toFixed(3) : n.toFixed(4);
}

// Auto-scrolling tape of every pair. The list is duplicated so the loop is seamless.
export function Ticker({ rates }: { rates: MarketRate[] }) {
  // Only pairs with a computed daily change make a meaningful tape.
  const moving = rates.filter((r) => r.change_pct !== null);
  if (moving.length === 0) return null;
  const row = [...moving, ...moving];
  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-panel/70 py-2">
      <div className="flex w-max animate-marquee whitespace-nowrap">
        {row.map((r, i) => {
          const up = (r.change_pct ?? 0) >= 0;
          return (
            <span key={i} className="inline-flex items-center gap-2 px-4 text-xs font-mono tnum border-r border-border/50">
              <span className="text-silver">{r.pair}</span>
              <span className="text-paper">{fmt(r.rate)}</span>
              <span className={up ? "text-bull" : "text-bear"}>
                {up ? "▲" : "▼"}{Math.abs(r.change_pct ?? 0).toFixed(2)}%
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
