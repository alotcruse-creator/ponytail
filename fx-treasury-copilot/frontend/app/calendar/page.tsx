"use client";
import { Card, Stars } from "@/components/Card";
import { useLive } from "@/lib/live";
import { type Event, type CalendarDay } from "@/lib/api";

const EMPTY = { events: [] as Event[], days: [] as CalendarDay[], top5: [] as Event[] };

export default function CalendarPage() {
  const { data, loading } = useLive<typeof EMPTY>("/calendar", EMPTY);

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-[26px] sm:text-3xl font-normal text-paper tracking-tight mb-2">Economic Calendar — Week Ahead</h1>

      <Card title="AI — Top Events This Week" accentLeft>
        {loading
          ? <p className="text-sm text-muted font-mono animate-pulse">Loading…</p>
          : data.top5.length === 0
            ? <p className="text-sm text-muted">No top events available.</p>
            : <ol className="space-y-2">
                {data.top5.map((e, i) => (
                  <li key={e.id} className="flex items-start gap-3 text-sm">
                    <span className="font-mono text-xs text-muted w-4 shrink-0 pt-0.5">{i + 1}.</span>
                    <div>
                      <span className="text-paper">{e.event}</span>
                      <span className="ml-2 text-xs text-muted">({e.currency})</span>
                      <span className="ml-1 text-xs text-muted">— FX impact on {e.currency}</span>
                    </div>
                  </li>
                ))}
              </ol>}
      </Card>

      {loading && <Card><p className="text-sm text-muted font-mono animate-pulse">Loading week…</p></Card>}

      {!loading && data.days.map((day) => (
        <Card key={day.date}>
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-sm font-semibold text-paper">
              {day.label}
              <span className="ml-2 text-xs font-normal text-muted font-mono">{day.date}</span>
            </h2>
            <span className="text-[10px] font-mono text-muted uppercase tracking-widest">
              {day.events.length} event{day.events.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="pb-2 text-[10px] font-semibold tracking-widest text-muted uppercase pr-4">Time</th>
                  <th className="pb-2 text-[10px] font-semibold tracking-widest text-muted uppercase pr-4">Country</th>
                  <th className="pb-2 text-[10px] font-semibold tracking-widest text-muted uppercase pr-4">Ccy</th>
                  <th className="pb-2 text-[10px] font-semibold tracking-widest text-muted uppercase pr-4">Event</th>
                  <th className="pb-2 text-[10px] font-semibold tracking-widest text-muted uppercase pr-4">Forecast</th>
                  <th className="pb-2 text-[10px] font-semibold tracking-widest text-muted uppercase pr-4">Previous</th>
                  <th className="pb-2 text-[10px] font-semibold tracking-widest text-muted uppercase">Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {day.events.map((e) => (
                  <tr key={e.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 pr-4 font-mono text-xs tabular-nums text-muted">{e.time}</td>
                    <td className="py-2.5 pr-4 text-silver">{e.country}</td>
                    <td className="py-2.5 pr-4">
                      <span className="font-mono text-xs font-semibold text-accent border border-border rounded px-1.5 py-0.5 bg-bg">
                        {e.currency}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-paper">{e.event}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-silver">{e.forecast || "—"}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-muted">{e.previous || "—"}</td>
                    <td className="py-2.5"><Stars n={e.importance} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}
    </div>
  );
}
