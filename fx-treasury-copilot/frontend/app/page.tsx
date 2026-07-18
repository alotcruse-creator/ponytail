"use client";
import { useEffect, useState } from "react";
import { Card, Dir, Stars } from "@/components/Card";
import { SentimentChart } from "@/components/SentimentChart";
import { Rates } from "@/components/Rates";
import { api, type Event, type News, type Sentiment, type RatesSnapshot } from "@/lib/api";

type Market = { sentiment: Sentiment[]; high_impact: Event[]; top_news: News[] };
type Php = { sentiment: Sentiment; drivers: string[]; commentary: string };

const EMPTY_MARKET: Market = { sentiment: [], high_impact: [], top_news: [] };
const EMPTY_PHP: Php = { sentiment: { currency: "PHP", label: "Neutral", score: 50 }, drivers: [], commentary: "" };
const EMPTY_RATES: RatesSnapshot = { rates: [], php_history: [], as_of: null };

function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="h-3.5 bg-border/60 rounded-full animate-pulse" style={{ width: `${85 - i * 12}%` }} />
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [market, setMarket] = useState<Market>(EMPTY_MARKET);
  const [php, setPhp] = useState<Php>(EMPTY_PHP);
  const [rates, setRates] = useState<RatesSnapshot>(EMPTY_RATES);
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api<Market>("/market-summary", EMPTY_MARKET),
      api<Php>("/php", EMPTY_PHP),
      api<RatesSnapshot>("/rates", EMPTY_RATES),
      api<{ brief: string }>("/morning-brief", { brief: "" }),
    ]).then(([m, p, r, b]) => {
      setMarket(m); setPhp(p); setRates(r); setBrief(b.brief); setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-base font-semibold text-slate-100 tracking-tight">Dashboard</h1>
        <span className="text-xs text-muted font-mono">
          {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </span>
      </div>

      <Rates snap={rates} loading={loading} />

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Currency Sentiment">
          {loading ? <Skeleton /> : <>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-4">
              {market.sentiment.map((s) => (
                <div key={s.currency} className="flex items-center justify-between border-b border-border py-1.5">
                  <span className="font-mono font-semibold text-xs text-slate-300">{s.currency}</span>
                  <Dir label={s.label} />
                </div>
              ))}
            </div>
            {market.sentiment.length > 0 && <SentimentChart data={market.sentiment} />}
          </>}
        </Card>

        <Card title="High Impact Events Today">
          <ul className="divide-y divide-border">
            {loading
              ? <li className="py-3"><Skeleton lines={2} /></li>
              : market.high_impact.length === 0
                ? <li className="py-3 text-sm text-muted">No high impact events today.</li>
                : market.high_impact.map((e) => (
                  <li key={e.id} className="flex items-center justify-between py-2.5 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-xs text-muted tabular-nums shrink-0">{e.time}</span>
                      <span className="text-sm text-slate-200 truncate">{e.event}</span>
                      <span className="text-xs text-muted shrink-0">({e.currency})</span>
                    </div>
                    <Stars n={e.importance} />
                  </li>
                ))}
          </ul>
        </Card>

        <Card title="PHP Focus" accentLeft>
          {loading ? <Skeleton /> : <>
            <div className="flex items-center justify-between mb-3">
              <Dir label={php.sentiment.label} />
              <div className="text-right">
                <span className="text-3xl font-bold font-mono text-accent">{php.sentiment.score}</span>
                <span className="text-sm text-muted ml-0.5">%</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {php.drivers.length === 0
                ? <span className="text-xs text-muted">No drivers.</span>
                : php.drivers.map((d) => (
                  <span key={d} className="text-xs bg-bg border border-border rounded-md px-2 py-0.5 text-muted">{d}</span>
                ))}
            </div>
          </>}
        </Card>

        <Card title="Top Headlines">
          <ul className="divide-y divide-border">
            {loading
              ? <li className="py-3"><Skeleton lines={2} /></li>
              : market.top_news.length === 0
                ? <li className="py-3 text-sm text-muted">No headlines yet.</li>
                : market.top_news.map((n) => (
                  <li key={n.id} className="py-2.5 flex items-start justify-between gap-3">
                    <span className="text-sm text-slate-200 leading-snug">{n.headline}</span>
                    <Dir label={n.sentiment} />
                  </li>
                ))}
          </ul>
        </Card>

        <div className="md:col-span-2">
          <Card title="AI Morning Brief" accentLeft>
            {loading
              ? <div className="space-y-2">
                  <p className="text-xs text-muted animate-pulse font-mono">Waking backend — may take up to 60s on first load…</p>
                  <Skeleton lines={4} />
                </div>
              : <p className="text-sm leading-relaxed text-slate-300">{brief || "No brief available."}</p>}
          </Card>
        </div>
      </div>
    </div>
  );
}
