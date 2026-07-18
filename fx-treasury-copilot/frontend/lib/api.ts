// Single fetch point. Works from both server and client components.
// On free-tier Render the first wake takes ~50s — client-side fetch lets the
// browser wait instead of hitting Vercel's 10s serverless limit.
export const BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://fx-backend-yrpw.onrender.com";

const TOKEN_KEY = "fxc_token";

export function getToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
}
export function setToken(t: string): void {
  if (typeof window !== "undefined") localStorage.setItem(TOKEN_KEY, t);
}
export function clearToken(): void {
  if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(): Record<string, string> {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// A stale/expired token: drop it and bounce back to the login gate.
function handle401(): void {
  clearToken();
  if (typeof window !== "undefined") window.location.reload();
}

export async function api<T>(path: string, fallback: T): Promise<T> {
  try {
    const r = await fetch(`${BASE}${path}`, { cache: "no-store", headers: authHeaders() });
    if (r.status === 401) { handle401(); return fallback; }
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
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (r.status === 401) { handle401(); return fallback; }
    if (!r.ok) return fallback;
    return r.json() as Promise<T>;
  } catch {
    return fallback;
  }
}

// Direct login call (does not go through the authed helpers above).
export async function login(email: string, password: string): Promise<string | null> {
  try {
    const r = await fetch(`${BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
    if (!r.ok) return null;
    const d = await r.json();
    return d.token ?? null;
  } catch {
    return null;
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

// ── Phase 5 ──
export type Sensitivity = { currency: string; usd_exposure: number; dpnl_per_1pct: number };
export type ScenarioPreset = {
  name: string; description: string; shocks: Record<string, number>;
  pnl_usd: number; pnl_label: string;
  by_currency: { currency: string; shock_pct: number; pnl_usd: number }[];
};
export type Scenario = {
  as_of: string;
  sensitivities: Sensitivity[];
  var: { per_currency: { currency: string; var_usd: number }[]; portfolio_var_usd: number; portfolio_label: string };
  presets: ScenarioPreset[];
  commentary: string;
};
export type CustomShock = {
  shocks: Record<string, number>; total_pnl_usd: number; total_label: string;
  by_currency: { currency: string; shock_pct: number; pnl_usd: number }[];
};

export type Trigger = {
  id: number; kind: string; currency: string; op: string; level: number;
  note: string; current: number | null; current_label: string; level_label: string; status: string;
};
export type Alerts = { triggers: Trigger[]; fired: number; total: number };

export type Corridor = {
  currency: string; country: string; base_daily_usd: number; base_label: string;
  today_factor: number; total_usd: number; total_label: string;
  avg_daily_usd: number; avg_label: string;
  peak: { date: string; expected_usd: number; factor: number };
  series: { date: string; expected_usd: number; factor: number }[];
};
export type Flows = { horizon_days: number; as_of: string; corridors: Corridor[]; commentary: string };

export type CoverageRow = {
  currency: string; country: string;
  forecast_usd: number; forecast_label: string;
  hedged_usd: number; hedged_label: string;
  open_usd: number; open_label: string;
  coverage_pct: number; status: string;
  carry_pa: number; carry_label: string; carry_sign: string;
};
export type Coverage = {
  cover_days: number; target_low: number; target_high: number; as_of: string;
  rows: CoverageRow[]; total_open_usd: number; total_open_label: string; commentary: string;
};
