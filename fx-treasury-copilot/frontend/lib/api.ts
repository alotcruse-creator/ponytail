// Single fetch point. Works from both server and client components.
// On free-tier Render the first wake takes ~50s — client-side fetch lets the
// browser wait instead of hitting Vercel's 10s serverless limit.
export const BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://fx-backend-yrpw.onrender.com";

export async function api<T>(path: string, fallback: T): Promise<T> {
  try {
    const r = await fetch(`${BASE}${path}`, { cache: "no-store" });
    if (!r.ok) return fallback;
    return r.json() as Promise<T>;
  } catch {
    return fallback;
  }
}

export async function post<T>(path: string, body: unknown, fallback: T): Promise<T> {
  try {
    const r = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (!r.ok) return fallback;
    return r.json() as Promise<T>;
  } catch {
    return fallback;
  }
}

export type News = {
  id: number; headline: string; summary: string; source: string; url?: string;
  currency: string; sentiment: string; importance: number; confidence: number;
  published_time: string;
};
export type Event = {
  id: number; event: string; country: string; currency: string;
  date?: string; time: string;
  forecast: string; previous: string; actual: string; importance: number;
};
export type Sentiment = { currency: string; label: string; score: number };

export type Rate = { pair: string; currency: string; rate: number; date: string | null };
export type RatePoint = { date: string; rate: number };
export type RatesSnapshot = { rates: Rate[]; php_history: RatePoint[]; as_of: string | null };
export type CalendarDay = { date: string; weekday: string; label: string; events: Event[] };
export type Status = { generated_at: string; news_live: boolean; rates_as_of: string | null };

// ── Phase 2–4 ──
export type Alert = { currency: string; level: string; message: string };

export type Position = {
  currency: string; amount: number; amount_label: string; direction: string;
  avg_rate: number; current_rate: number; usd_exposure: number; usd_label: string;
  limit_usd: number; limit_pct: number; status: string;
  pnl_usd: number; pnl_label: string;
};
export type SettlementItem = {
  id: number; currency: string; amount: number; direction: string;
  value_date: string; counterparty: string; usd: number;
};
export type SettlementDay = {
  date: string; label: string; inflow_usd: number; outflow_usd: number;
  net_usd: number; items: SettlementItem[];
};
export type Exposure = {
  base: string; as_of: string; positions: Position[];
  totals: { gross_usd: number; gross_label: string; net_usd: number; net_label: string };
  alerts: Alert[];
  settlements: { days: SettlementDay[]; next: SettlementItem | null; largest: SettlementItem | null };
  commentary: string;
};

export type LiquidityCcy = {
  currency: string; opening: number; opening_label: string;
  floor: number; floor_label: string; min_projected: number; min_label: string;
  gap: number; gap_label: string; status: string;
  series: { date: string; projected: number; flow: number }[];
};
export type Liquidity = {
  base_horizon_days: number; as_of: string;
  currencies: LiquidityCcy[]; alerts: Alert[]; commentary: string;
};
