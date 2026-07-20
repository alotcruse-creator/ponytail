"use client";
import { clearToken, type Status } from "@/lib/api";
import { useLive } from "@/lib/live";

const EMPTY: Status = { generated_at: "", news_live: false, rates_as_of: null };

export function Freshness() {
  const { data: s, loading } = useLive<Status>("/status", EMPTY);

  const time = s.generated_at
    ? new Date(s.generated_at).toLocaleString("en-US", {
        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : "—";

  return (
    <div className="max-w-6xl mx-auto px-4 flex items-center gap-3 py-1.5 text-[11px] text-muted border-b border-border/60">
      <span className="inline-flex items-center gap-1.5">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-bull opacity-70" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-bull" />
        </span>
        <span className="font-mono">{loading ? "syncing…" : `live · ${time}`}</span>
      </span>
      <span className="hidden sm:inline text-border">|</span>
      <span className={`hidden sm:inline-flex items-center gap-1 ${s.news_live ? "text-bull" : "text-flat"}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${s.news_live ? "bg-bull" : "bg-flat"}`} />
        {s.news_live ? "live news feed" : "sample news"}
      </span>
      <button
        onClick={() => window.location.reload()}
        className="ml-auto font-mono text-muted hover:text-paper transition-colors border border-border rounded px-2 py-0.5"
      >
        ↻ refresh
      </button>
      <button
        onClick={() => { clearToken(); window.location.reload(); }}
        className="font-mono text-muted hover:text-bear transition-colors border border-border rounded px-2 py-0.5"
      >
        sign out
      </button>
    </div>
  );
}
