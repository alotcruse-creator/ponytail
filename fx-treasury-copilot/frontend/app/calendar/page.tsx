"use client";
import { useEffect, useState } from "react";
import { Card, Stars } from "@/components/Card";
import { api, type Event } from "@/lib/api";

const EMPTY = { events: [] as Event[], top5: [] as Event[] };

export default function CalendarPage() {
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<typeof EMPTY>("/calendar", EMPTY).then((d) => { setData(d); setLoading(false); });
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Economic Calendar</h1>

      <Card title="AI — Today's Top Events">
        {loading
          ? <p className="text-muted text-sm animate-pulse">Loading…</p>
          : data.top5.length === 0
            ? <p className="text-muted text-sm">No top events available.</p>
            : <ol className="text-sm space-y-1 list-decimal list-inside">
                {data.top5.map((e) => (
                  <li key={e.id}>{e.event} <span className="text-muted">({e.currency})</span> — likely FX impact on {e.currency}</li>
                ))}
              </ol>}
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted text-xs uppercase">
              <tr className="text-left">
                <th className="py-1">Time</th><th>Country</th><th>Ccy</th>
                <th>Event</th><th>Forecast</th><th>Previous</th><th>Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading
                ? <tr><td colSpan={7} className="py-3 text-muted text-center animate-pulse">Loading…</td></tr>
                : data.events.map((e) => (
                  <tr key={e.id}>
                    <td className="py-2">{e.time}</td>
                    <td>{e.country}</td><td>{e.currency}</td><td>{e.event}</td>
                    <td>{e.forecast || "—"}</td><td>{e.previous || "—"}</td>
                    <td><Stars n={e.importance} /></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
