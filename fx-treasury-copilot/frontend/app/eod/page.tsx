"use client";
import { useEffect, useState } from "react";
import { Card, Dir } from "@/components/Card";
import { api, type Sentiment, type News } from "@/lib/api";

type Market = { sentiment: Sentiment[]; top_news: News[] };
const EMPTY_MARKET: Market = { sentiment: [], top_news: [] };

export default function EodPage() {
  const [report, setReport] = useState("");
  const [market, setMarket] = useState<Market>(EMPTY_MARKET);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api<{ report: string }>("/end-of-day", { report: "" }),
      api<Market>("/market-summary", EMPTY_MARKET),
    ]).then(([r, m]) => { setReport(r.report); setMarket(m); setLoading(false); });
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-serif text-[26px] sm:text-3xl font-normal text-paper tracking-tight">End-of-Day Recap</h1>
        <span className="text-xs text-muted font-mono">
          {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </span>
      </div>

      <Card title="AI — Session Recap" accentLeft>
        {loading
          ? <div className="space-y-2">
              <p className="text-xs text-muted font-mono animate-pulse">Waking backend — may take up to 60s on first load…</p>
              <div className="h-3.5 bg-border/60 rounded-full animate-pulse w-4/5" />
              <div className="h-3.5 bg-border/60 rounded-full animate-pulse w-3/5" />
            </div>
          : <p className="text-sm leading-relaxed text-silver">{report || "No recap available."}</p>}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Closing Sentiment">
          {loading
            ? <p className="text-sm text-muted font-mono animate-pulse">Loading…</p>
            : <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                {market.sentiment.map((s) => (
                  <div key={s.currency} className="flex items-center justify-between border-b border-border py-1.5">
                    <span className="font-mono font-semibold text-xs text-silver">{s.currency}</span>
                    <Dir label={s.label} />
                  </div>
                ))}
              </div>}
        </Card>

        <Card title="Session Drivers">
          <ul className="divide-y divide-border">
            {loading
              ? <li className="py-3 text-sm text-muted font-mono animate-pulse">Loading…</li>
              : market.top_news.length === 0
                ? <li className="py-3 text-sm text-muted">No drivers.</li>
                : market.top_news.map((n) => (
                  <li key={n.id} className="py-2.5 flex items-start justify-between gap-3">
                    <span className="text-sm text-paper leading-snug">{n.headline}</span>
                    <Dir label={n.sentiment} />
                  </li>
                ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
