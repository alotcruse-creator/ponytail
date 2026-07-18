// Reusable panel. Every card on every page is this.
export function Card({ title, right, children }: {
  title?: string; right?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <section className="bg-panel border border-border rounded-lg p-4">
      {title && (
        <header className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold tracking-widest text-muted uppercase">
            {title}
          </h2>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

// Sentiment arrow + colour, shared everywhere a currency direction is shown.
export function Dir({ label }: { label: string }) {
  const map: Record<string, [string, string]> = {
    Bullish: ["▲", "text-bull"], Bearish: ["▼", "text-bear"],
    Neutral: ["■", "text-flat"],
  };
  const [icon, cls] = map[label] ?? ["■", "text-flat"];
  return <span className={cls}>{icon} {label}</span>;
}

// 1..5 importance stars.
export function Stars({ n }: { n: number }) {
  return <span className="text-accent">{"★".repeat(n)}<span className="text-border">{"★".repeat(5 - n)}</span></span>;
}
