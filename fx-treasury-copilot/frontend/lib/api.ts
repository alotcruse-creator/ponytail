// Single fetch point for the backend. Server components only (no client fetch).
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function api<T>(path: string, fallback: T): Promise<T> {
  // ponytail: no-store so the morning dashboard is always live, not a
  // build-time snapshot. Returns fallback on any error so build never fails
  // if the backend is unreachable (sleeping free-tier, missing env var, etc.)
  try {
    const r = await fetch(`${BASE}${path}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) return fallback;
    return r.json() as Promise<T>;
  } catch {
    return fallback;
  }
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
