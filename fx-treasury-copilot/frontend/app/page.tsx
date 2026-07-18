export const dynamic = "force-dynamic";

import { Card, Dir, Stars } from "@/components/Card";
import { SentimentChart } from "@/components/SentimentChart";
import { api, type Event, type News, type Sentiment } from "@/lib/api";

type Market = { sentiment: Sentiment[]; high_impact: Event[]; top_news: News[] };
type Php = { sentiment: Sentiment; drivers: string[]; commentary: string };

const EMPTY_MARKET: Market = { sentiment: [], high_impact: [], top_news: [] };
const EMPTY_PHP: Php = { sentiment: { currency: "PHP", label: "Neutral", score: 50 }, drivers: [], commentary: "Loading…" };

export default async function Dashboard() {
  const [market, php, brief] = await Promise.all([
    api<Market>("/market-summary", EMPTY_MARKET),
    api<Php>("/php", EMPTY_PHP),
    api<{ brief: string }>("/morning-brief", { brief: "Loading morning brief…" }),
  ]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="Today's Market">
        <div className="grid grid-cols-2 gap-2 text-sm">
          {market.sentiment.map((s) => (
            <div key={s.currency} className="flex justify-between border-b border-border py-1">
              <span className="font-semibold">{s.currency}</span>
              <Dir label={s.label} />
            </div>
          ))}
        </div>
        {market.sentiment.length > 0 && (
          <div className="mt-4"><SentimentChart data={market.sentiment} /></div>
        )}
      </Card>

      <Card title="Today's High Impact Events">
        <ul className="text-sm divide-y divide-border">
          {market.high_impact.map((e) => (
            <li key={e.id} className="flex items-center justify-between py-2">
              <span><span className="text-muted mr-2">{e.time}</span>{e.event} <span className="text-muted">({e.currency})</span></span>
              <Stars n={e.importance} />
            </li>
          ))}
          {market.high_impact.length === 0 && <li className="py-2 text-muted">No data — backend may be starting up.</li>}
        </ul>
      </Card>

      <Card title="PHP Focus">
        <div className="flex items-center justify-between mb-2">
          <Dir label={php.sentiment.label} />
          <span className="text-2xl font-bold text-accent">{php.sentiment.score}%</span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {php.drivers.map((d) => (
            <span key={d} className="bg-bg border border-border rounded px-2 py-1 text-muted">{d}</span>
          ))}
        </div>
      </Card>

      <Card title="Top Headlines">
        <ul className="text-sm divide-y divide-border">
          {market.top_news.map((n) => (
            <li key={n.id} className="py-2 flex items-center justify-between gap-2">
              <span>{n.headline}</span>
              <Dir label={n.sentiment} />
            </li>
          ))}
          {market.top_news.length === 0 && <li className="py-2 text-muted">No data — backend may be starting up.</li>}
        </ul>
      </Card>

      <div className="md:col-span-2">
        <Card title="AI Morning Brief">
          <p className="text-sm leading-relaxed text-slate-300">{brief.brief}</p>
        </Card>
      </div>
    </div>
  );
}
