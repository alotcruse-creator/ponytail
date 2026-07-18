export function Card({ title, right, children, accentLeft }: {
  title?: string; right?: React.ReactNode; children: React.ReactNode; accentLeft?: boolean;
}) {
  return (
    <section
      className={`bg-panel border border-border rounded-lg p-4 relative ${
        accentLeft ? "border-l-[3px] border-l-accent" : ""
      }`}
    >
      {title && (
        <header className="flex items-center justify-between mb-3">
          <h2 className="text-[10px] font-semibold tracking-[0.18em] text-muted uppercase">
            {title}
          </h2>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

const DIR_MAP: Record<string, { icon: string; color: string; bg: string; ring: string }> = {
  Bullish: { icon: "▲", color: "text-bull", bg: "bg-bull/10", ring: "border-bull/25" },
  Bearish: { icon: "▼", color: "text-bear", bg: "bg-bear/10", ring: "border-bear/25" },
  Neutral: { icon: "◆", color: "text-flat", bg: "bg-flat/10", ring: "border-flat/25" },
};

export function Dir({ label }: { label: string }) {
  const d = DIR_MAP[label] ?? DIR_MAP.Neutral;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md border whitespace-nowrap ${d.color} ${d.bg} ${d.ring}`}
    >
      <span className="text-[9px] leading-none">{d.icon}</span>
      {label}
    </span>
  );
}

export function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-px">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`text-[11px] leading-none ${i < n ? "text-accent" : "text-border"}`}>
          ★
        </span>
      ))}
    </span>
  );
}
