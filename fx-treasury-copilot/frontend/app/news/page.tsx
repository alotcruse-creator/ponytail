import { Card, Dir, Stars } from "@/components/Card";
import { api, type News } from "@/lib/api";

export default async function NewsPage() {
  const news = await api<News[]>("/news");
  return (
    <div className="space-y-3">
      <h1 className="text-lg font-semibold">Market News</h1>
      {news.map((n) => (
        <Card key={n.id}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Stars n={n.importance} />
                <span className="font-semibold">{n.headline}</span>
              </div>
              <p className="text-sm text-slate-400">{n.summary}</p>
              <div className="mt-2 text-xs text-muted">
                {n.source} · Affected <span className="text-slate-300">{n.currency}</span> · Confidence {n.confidence}%
              </div>
            </div>
            <Dir label={n.sentiment} />
          </div>
        </Card>
      ))}
    </div>
  );
}
