"use client";
import { useEffect, useState } from "react";
import { Card, Dir } from "@/components/Card";
import { api, type News, type Sentiment, type Rate } from "@/lib/api";

type Php = {
  sentiment: Sentiment; rate: Rate | null; drivers: string[]; news: News[];
  news_count: number; tomorrow_events: number; commentary: string;
  exposure_sample: Record<string, string | number>;
};

const EMPTY_PHP: Php = {
  sentiment: { currency: "PHP", label: "Neutral", score: 50 },
  rate: null, drivers: [], news: [], news_count: 0, tomorrow_events: 0,
  commentary: "", exposure_sample: {},
};

const LABELS: Record<string, string> = {
  net_exposure: "Net Exposure", position: "Position", volume: "Today's Volume",
  avg_rate: "Average Rate", largest_settlement: "Largest Settlement",
  next_settlement: "Next Settlement", limit_pct: "Exposure Limit",
  liquidity_buffer: "Liquidity Buffer",
};

export default function PhpPage() {
  const [p, setP] = useState<Php>(EMPTY_PHP);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Php>("/php", EMPTY_PHP).then((data) => { setP(data); setLoading(false); });
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-serif text-[26px] sm:text-3xl font-normal text-paper tracking-tight">PHP Monitor</h1>
        <span className="font-mono text-xs font-semibold text-muted border border-border rounded px-2 py-0.5 bg-bg">USD/PHP</span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Sentiment" accentLeft>
          <div className="flex items-center justify-between mt-1">
            <Dir label={p.sentiment.label} />
            <div>
              <span className="text-3xl font-bold font-mono text-accent">
                {loading ? "—" : p.sentiment.score}
              </span>
              <span className="text-sm text-muted ml-0.5">%</span>
            </div>
          </div>
        </Card>
        <Card title="USD / PHP">
          {loading ? (
            <span className="text-3xl font-bold font-mono text-paper">—</span>
          ) : p.rate ? (
            <>
              <span className="text-3xl font-bold font-mono text-paper">{p.rate.rate.toFixed(4)}</span>
              <div className="text-xs text-muted mt-1">ECB ref {p.rate.date ?? ""}</div>
            </>
          ) : (
            <span className="text-sm text-muted">Rate feed unavailable</span>
          )}
        </Card>
        <Card title="Tomorrow's Events">
          <span className="text-3xl font-bold font-mono text-paper">
            {loading ? "—" : p.tomorrow_events}
          </span>
          <span className="ml-2 text-sm text-muted">events</span>
        </Card>
      </div>

      {!loading && Object.keys(p.exposure_sample).length > 0 && (
        <Card title="Exposure Snapshot (Illustrative — Phase 2 live feed)">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(p.exposure_sample).map(([k, v]) => (
              <div key={k} className="space-y-0.5">
                <div className="text-[10px] font-semibold tracking-widest text-muted uppercase">
                  {LABELS[k] ?? k}
                </div>
                <div className="font-mono font-semibold text-paper">
                  {k === "limit_pct" ? `${v}%` : v}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title="Current Drivers">
        <div className="flex flex-wrap gap-1.5">
          {loading
            ? <span className="text-sm text-muted font-mono animate-pulse">Loading…</span>
            : p.drivers.length === 0
              ? <span className="text-sm text-muted">No drivers available.</span>
              : p.drivers.map((d) => (
                <span key={d} className="text-xs bg-bg border border-border rounded-md px-2.5 py-1 text-muted hover:text-silver transition-colors">
                  {d}
                </span>
              ))}
        </div>
      </Card>

      <Card title="AI Commentary" accentLeft>
        <p className="text-sm leading-relaxed text-silver">
          {loading
            ? <span className="font-mono text-muted animate-pulse">Loading…</span>
            : p.commentary || "No commentary available."}
        </p>
      </Card>

      <Card title="Recent PHP Headlines">
        <ul className="divide-y divide-border">
          {loading
            ? <li className="py-3 text-sm text-muted font-mono animate-pulse">Loading…</li>
            : p.news.length === 0
              ? <li className="py-3 text-sm text-muted">No PHP headlines yet.</li>
              : p.news.map((n) => (
                <li key={n.id} className="py-2.5 flex items-start justify-between gap-3">
                  <span className="text-sm text-paper leading-snug">{n.headline}</span>
                  <Dir label={n.sentiment} />
                </li>
              ))}
        </ul>
      </Card>
    </div>
  );
}
