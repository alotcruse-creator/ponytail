// Shared risk UI: limit-utilization bar, status pill, alert banner.

const TONE: Record<string, { text: string; bar: string; bg: string; ring: string }> = {
  OK: { text: "text-bull", bar: "bg-bull", bg: "bg-bull/10", ring: "border-bull/30" },
  WARN: { text: "text-flat", bar: "bg-flat", bg: "bg-flat/10", ring: "border-flat/25" },
  BREACH: { text: "text-bear", bar: "bg-bear", bg: "bg-bear/10", ring: "border-bear/30" },
  TIGHT: { text: "text-flat", bar: "bg-flat", bg: "bg-flat/10", ring: "border-flat/25" },
  GAP: { text: "text-bear", bar: "bg-bear", bg: "bg-bear/10", ring: "border-bear/30" },
};

export function StatusPill({ status }: { status: string }) {
  const t = TONE[status] ?? TONE.OK;
  return (
    <span className={`inline-flex items-center text-[10px] font-medium uppercase tracking-[0.12em] px-2 py-0.5 rounded-full border ${t.text} ${t.bg} ${t.ring}`}>
      {status}
    </span>
  );
}

export function LimitBar({ pct, status }: { pct: number; status: string }) {
  const t = TONE[status] ?? TONE.OK;
  return (
    <div className="relative h-1.5 w-full rounded-full bg-border/60 overflow-hidden">
      <div className={`h-full ${t.bar} transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
      {/* 100% ceiling marker */}
      <span className="absolute top-[-2px] bottom-[-2px] w-px bg-ash/60" style={{ left: "100%" }} />
    </div>
  );
}

export function AlertBanner({ alerts }: { alerts: { currency: string; level: string; message: string }[] }) {
  if (alerts.length === 0) {
    return (
      <div className="rounded-xl border border-bull/25 bg-bull/[0.06] px-4 py-3 text-sm text-bull/90">
        All clear — nothing over limit or below floor.
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {alerts.map((a, i) => {
        const t = TONE[a.level] ?? TONE.WARN;
        return (
          <div key={i} className={`flex items-start gap-3 rounded-xl border px-4 py-2.5 text-sm ${t.bg} ${t.ring}`}>
            <StatusPill status={a.level} />
            <span className="text-silver leading-snug">{a.message}</span>
          </div>
        );
      })}
    </div>
  );
}
