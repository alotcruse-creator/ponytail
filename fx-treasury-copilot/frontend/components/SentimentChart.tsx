"use client";
import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis } from "recharts";
import type { Sentiment } from "@/lib/api";

const COLOR: Record<string, string> = {
  Bullish: "#22c55e", Bearish: "#ef4444", Neutral: "#eab308",
};

// ponytail: Recharts is already the chosen chart lib; one bar chart covers the
// "news sentiment" panel. No custom SVG.
export function SentimentChart({ data }: { data: Sentiment[] }) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
        <XAxis dataKey="currency" stroke="#7d8da1" fontSize={12} tickLine={false} />
        <YAxis domain={[0, 100]} stroke="#7d8da1" fontSize={12} tickLine={false} axisLine={false} />
        <Bar dataKey="score" radius={[3, 3, 0, 0]}>
          {data.map((d) => <Cell key={d.currency} fill={COLOR[d.label] ?? "#eab308"} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
