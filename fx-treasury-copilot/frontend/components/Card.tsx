// Premium panel: warm raised surface, hairline frame, gold eyebrow label.
export function Card({ title, right, children, accentLeft }: {
  title?: string; right?: React.ReactNode; children: React.ReactNode; accentLeft?: boolean;
}) {
  return (
    <section className="relative rounded-xl border border-border bg-panel/70 backdrop-blur-sm p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_24px_48px_-30px_rgba(0,0,0,0.85)]">
      {accentLeft && (
        <span className="absolute left-0 top-5 bottom-5 w-px bg-gradient-to-b from-accent/70 via-accent/25 to-transparent" />
      )}
      {title && (
        <header className="flex items-baseline justify-between mb-4">
          <div>
            <h2 className="text-[10px] font-medium tracking-luxe text-accent/85 uppercase">{title}</h2>
            <div className="mt-2 h-px w-9 rule-gold" />
          </div>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

const DIR: Record<string, { t: string; b: string; r: string; g: string }> = {
  Bullish: { t: "text-bull", b: "bg-bull/10", r: "border-bull/30", g: "▲" },
  Bearish: { t: "text-bear", b: "bg-bear/10", r: "border-bear/30", g: "▼" },
  Neutral: { t: "text-flat", b: "bg-flat/10", r: "border-flat/25", g: "◆" },
};

export function Dir({ label }: { label: string }) {
  const d = DIR[label] ?? DIR.Neutral;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.12em] px-2.5 py-1 rounded-full border whitespace-nowrap ${d.t} ${d.b} ${d.r}`}
    >
      <span className="text-[7px] leading-none">{d.g}</span>
      {label}
    </span>
  );
}

// Impact meter: five hairline segments, filled in gold. Reads as an instrument.
export function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-[3px]" title={`Impact ${n}/5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={`h-3 w-[3px] rounded-full ${i < n ? "bg-accent" : "bg-border"}`}
        />
      ))}
    </span>
  );
}
