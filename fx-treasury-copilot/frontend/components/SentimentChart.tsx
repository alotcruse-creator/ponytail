"use client";
import {
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import type { Sentiment } from "@/lib/api";

const COLOR: Record<string, string> = {
  Bullish: "#3fb950", Bearish: "#f85149", Neutral: "#d29922",
};

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: Sentiment }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-panel border border-border rounded-md px-3 py-2 text-xs shadow-lg">
      <div className="font-semibold text-slate-100">{d.currency}</div>
      <div className="text-muted">{d.label} · {d.score}%</div>
    </div>
  );
}

export function SentimentChart({ data }: { data: Sentiment[] }) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <CartesianGrid vertical={false} stroke="#21262d" strokeDasharray="3 3" />
        <XAxis dataKey="currency" stroke="#8b949e" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis
          domain={[0, 100]}
          stroke="#8b949e"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}`}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
        <Bar dataKey="score" radius={[3, 3, 0, 0]} maxBarSize={40}>
          {data.map((d) => (
            <Cell key={d.currency} fill={COLOR[d.label] ?? "#d29922"} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
