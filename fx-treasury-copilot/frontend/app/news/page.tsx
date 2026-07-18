"use client";
import { useEffect, useState } from "react";
import { Card, Dir, Stars } from "@/components/Card";
import { api, type News } from "@/lib/api";

export default function NewsPage() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<News[]>("/news", []).then((n) => { setNews(n); setLoading(false); });
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-serif text-[26px] sm:text-3xl font-normal text-paper tracking-tight">Market News</h1>
        {!loading && (
          <span className="text-xs font-mono text-muted">{news.length} item{news.length !== 1 ? "s" : ""}</span>
        )}
      </div>

      {loading && (
        <Card>
          <p className="text-sm text-muted font-mono animate-pulse">Loading — waking backend, may take up to 60s…</p>
        </Card>
      )}
      {!loading && news.length === 0 && (
        <Card>
          <p className="text-sm text-muted">No news yet. Backend returned empty — try refreshing.</p>
        </Card>
      )}

      {news.map((n) => (
        <Card key={n.id}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                <Stars n={n.importance} />
                <span className="text-xs font-mono font-semibold text-muted border border-border rounded px-1.5 py-0.5 bg-bg">
                  {n.currency}
                </span>
                <span className="font-semibold text-sm text-paper leading-snug">{n.headline}</span>
              </div>
              <p className="text-sm text-ash leading-relaxed">{n.summary}</p>
              <div className="mt-2 flex items-center gap-3 text-xs text-muted">
                <span>{n.source}</span>
                <span>·</span>
                <span>Confidence <span className="text-silver font-mono">{n.confidence}%</span></span>
                {n.published_time && <span>· {n.published_time}</span>}
              </div>
            </div>
            <div className="shrink-0">
              <Dir label={n.sentiment} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
