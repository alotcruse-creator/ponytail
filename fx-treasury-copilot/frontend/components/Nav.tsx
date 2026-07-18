"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  ["/", "Dashboard"], ["/news", "News"],
  ["/calendar", "Calendar"], ["/php", "PHP"], ["/eod", "EOD"],
] as const;

function Clock() {
  const [t, setT] = useState("");
  useEffect(() => {
    const tick = () =>
      setT(new Date().toLocaleTimeString("en-US", {
        hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit",
      }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="font-mono text-xs tabular-nums text-muted">{t} UTC+8</span>;
}

export function Nav() {
  const path = usePathname();
  return (
    <nav className="sticky top-0 z-20 border-b border-border bg-panel/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 h-13 flex items-center gap-2">
        <div className="flex items-center gap-2 shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-bull opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-bull" />
          </span>
          <span className="font-mono text-sm font-bold tracking-tight text-slate-100">FX</span>
          <span className="font-mono text-sm font-bold tracking-tight text-accent">COPILOT</span>
        </div>

        {/* links scroll horizontally within their own strip so the page never does */}
        <div className="flex gap-0.5 overflow-x-auto no-scrollbar min-w-0 -mx-1 px-1">
          {LINKS.map(([href, label]) => {
            const active = path === href;
            return (
              <Link
                key={href}
                href={href}
                className={`shrink-0 whitespace-nowrap px-2.5 sm:px-3 py-1.5 rounded text-sm transition-all duration-150 ${
                  active
                    ? "bg-white/8 text-slate-100 border border-border shadow-sm"
                    : "text-muted hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        <div className="ml-auto hidden md:flex items-center gap-4 shrink-0">
          <span className="text-[10px] font-mono font-semibold tracking-widest text-muted">LIVE</span>
          <Clock />
        </div>
      </div>
    </nav>
  );
}
