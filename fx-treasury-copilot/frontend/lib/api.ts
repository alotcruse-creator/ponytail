// Single fetch point. Works from both server and client components.
// On free-tier Render the first wake takes ~50s — client-side fetch lets the
// browser wait instead of hitting Vercel's 10s serverless limit.
export const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function api<T>(path: string, fallback: T): Promise<T> {
  try {
    const r = await fetch(`${BASE}${path}`, { cache: "no-store" });
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
