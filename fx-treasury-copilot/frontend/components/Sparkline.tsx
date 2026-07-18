import type { RatePoint } from "@/lib/api";

// ponytail: a 30-point line needs no chart library — one SVG path does it.
// A single champagne line + faint area fill reads cleaner than red/green here.
export function Sparkline({ data, width = 120, height = 32 }: {
  data: RatePoint[]; width?: number; height?: number;
}) {
  if (data.length < 2) return null;
  const id = `sl-${width}-${height}`;
  const vals = data.map((d) => d.rate);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const step = width / (data.length - 1);
  const y = (v: number) => height - ((v - min) / span) * (height - 6) - 3;
  const pts = data.map((d, i) => `${(i * step).toFixed(1)},${y(d.rate).toFixed(1)}`);
  const line = pts.join(" ");
  const area = `${line} ${width},${height} 0,${height}`;
  const lastX = (data.length - 1) * step;
  const lastY = y(vals[vals.length - 1]);

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c9a96b" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#c9a96b" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke="#c9a96b"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={lastX} cy={lastY} r={2.5} fill="#e6cf9c" />
    </svg>
  );
}
