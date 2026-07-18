"use client";
import { useEffect, useState } from "react";
import { api, type Status } from "@/lib/api";

const EMPTY: Status = { generated_at: "", news_live: false, rates_as_of: null };

export function Freshness() {
  const [s, setS] = useState<Status>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Status>("/status", EMPTY).then((d) => { setS(d); setLoading(false); });
  }, []);

  const time = s.generated_at
    ? new Date(s.generated_at).toLocaleString("en-US", {
        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : "—";

  return (
    <div className="max-w-6xl mx-auto px-4 flex items-center gap-3 py-1.5 text-[11px] text-muted border-b border-border/60">
      <span className="font-mono">{loading ? "syncing…" : `data as of ${time}`}</span>
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
    </div>
  );
}
