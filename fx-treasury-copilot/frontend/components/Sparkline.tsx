import type { RatePoint } from "@/lib/api";

// ponytail: a 30-point line needs no chart library — one SVG path does it.
export function Sparkline({ data, width = 120, height = 32 }: {
  data: RatePoint[]; width?: number; height?: number;
}) {
  if (data.length < 2) return null;
  const vals = data.map((d) => d.rate);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const step = width / (data.length - 1);
  const y = (v: number) => height - ((v - min) / span) * (height - 4) - 2;
  const pts = data.map((d, i) => `${(i * step).toFixed(1)},${y(d.rate).toFixed(1)}`);
  const up = vals[vals.length - 1] >= vals[0];
  const stroke = up ? "#3fb950" : "#f85149";

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={(data.length - 1) * step} cy={y(vals[vals.length - 1])} r={2} fill={stroke} />
    </svg>
  );
}
