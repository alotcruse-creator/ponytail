export const dynamic = "force-dynamic";

import { Card, Stars } from "@/components/Card";
import { api, type Event } from "@/lib/api";

const EMPTY = { events: [] as Event[], top5: [] as Event[] };

export default async function CalendarPage() {
  const { events, top5 } = await api<{ events: Event[]; top5: Event[] }>("/calendar", EMPTY);
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Economic Calendar</h1>

      <Card title="AI — Today's Top Events">
        {top5.length === 0
          ? <p className="text-muted text-sm">No data — backend may be starting up.</p>
          : <ol className="text-sm space-y-1 list-decimal list-inside">
              {top5.map((e) => (
                <li key={e.id}>
                  {e.event} <span className="text-muted">({e.currency})</span> — likely FX impact on {e.currency}
                </li>
              ))}
            </ol>
        }
      </Card>

      <Card>
        <table className="w-full text-sm">
          <thead className="text-muted text-xs uppercase">
            <tr className="text-left">
              <th className="py-1">Time</th><th>Country</th><th>Ccy</th>
              <th>Event</th><th>Forecast</th><th>Previous</th><th>Impact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {events.map((e) => (
              <tr key={e.id}>
                <td className="py-2">{e.time}</td>
                <td>{e.country}</td><td>{e.currency}</td><td>{e.event}</td>
                <td>{e.forecast || "—"}</td><td>{e.previous || "—"}</td>
                <td><Stars n={e.importance} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
