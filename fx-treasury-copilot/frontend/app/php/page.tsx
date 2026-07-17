import { Card, Dir } from "@/components/Card";
import { api, type News, type Sentiment } from "@/lib/api";

type Php = {
  sentiment: Sentiment; drivers: string[]; news: News[]; news_count: number;
  tomorrow_events: number; commentary: string;
  exposure_sample: Record<string, string | number>;
};

// Phase-1 PHP figures below are illustrative (see backend note). Phase 2's
// Exposure Monitor replaces exposure_sample with the live position feed.
const LABELS: Record<string, string> = {
  net_exposure: "Net Exposure", position: "Position", volume: "Today's Volume",
  avg_rate: "Average Rate", largest_settlement: "Largest Settlement",
  next_settlement: "Next Settlement", limit_pct: "Exposure Limit",
  liquidity_buffer: "Liquidity Buffer",
};

export default async function PhpPage() {
  const p = await api<Php>("/php");
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">PHP Monitor</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Sentiment">
          <div className="flex items-center justify-between">
            <Dir label={p.sentiment.label} />
            <span className="text-2xl font-bold text-accent">{p.sentiment.score}%</span>
          </div>
        </Card>
        <Card title="Today's PHP News"><span className="text-3xl font-bold">{p.news_count}</span></Card>
        <Card title="Tomorrow's Events"><span className="text-3xl font-bold">{p.tomorrow_events}</span></Card>
      </div>

      <Card title="Snapshot (illustrative — Phase 2 live feed)">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {Object.entries(p.exposure_sample).map(([k, v]) => (
            <div key={k}>
              <div className="text-muted text-xs">{LABELS[k] ?? k}</div>
              <div className="font-semibold">{k === "limit_pct" ? `${v}%` : v}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Current Drivers">
        <div className="flex flex-wrap gap-2 text-xs">
          {p.drivers.map((d) => (
            <span key={d} className="bg-bg border border-border rounded px-2 py-1 text-muted">{d}</span>
          ))}
        </div>
      </Card>

      <Card title="AI Commentary">
        <p className="text-sm leading-relaxed text-slate-300">{p.commentary}</p>
      </Card>

      <Card title="Recent PHP Headlines">
        <ul className="text-sm divide-y divide-border">
          {p.news.map((n) => (
            <li key={n.id} className="py-2 flex items-center justify-between gap-3">
              <span>{n.headline}</span><Dir label={n.sentiment} />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
