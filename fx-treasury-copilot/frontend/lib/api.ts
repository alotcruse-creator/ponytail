// Single fetch point for the backend. Server components only (no client fetch).
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function api<T>(path: string): Promise<T> {
  // ponytail: no-store so the morning dashboard is always today's data, not a
  // build-time snapshot. Add revalidate caching only if the feed gets heavy.
  const r = await fetch(`${BASE}${path}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`${path} -> ${r.status}`);
  return r.json() as Promise<T>;
}

export type News = {
  id: number; headline: string; summary: string; source: string;
  currency: string; sentiment: string; importance: number; confidence: number;
  published_time: string;
};
export type Event = {
  id: number; event: string; country: string; currency: string; time: string;
  forecast: string; previous: string; actual: string; importance: number;
};
export type Sentiment = { currency: string; label: string; score: number };
