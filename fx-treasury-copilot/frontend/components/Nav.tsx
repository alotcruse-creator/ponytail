"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";

const GROUPS: [string, string][][] = [
  [["/", "Dashboard"], ["/news", "News"], ["/calendar", "Calendar"], ["/php", "PHP"]],
  [["/exposure", "Exposure"], ["/scenario", "Scenario"], ["/alerts", "Alerts"]],
  [["/liquidity", "Liquidity"], ["/flows", "Flows"], ["/coverage", "Coverage"]],
  [["/eod", "EOD"], ["/chat", "Assistant"]],
];

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
  return <span className="font-mono text-xs tnum text-muted">{t} <span className="text-ash">MNL</span></span>;
}

export function Nav() {
  const path = usePathname();
  return (
    <nav className="sticky top-0 z-20 border-b border-border/80 bg-bg/70 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-15 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <Logo className="h-5 w-5" />
          <span className="font-serif text-lg leading-none text-paper tracking-tight">
            FX <span className="italic text-accent">Copilot</span>
          </span>
        </Link>

        {/* links scroll horizontally within their own strip so the page never does */}
        <div className="flex items-center overflow-x-auto no-scrollbar min-w-0 -mx-1 px-1">
          {GROUPS.map((group, gi) => (
            <div key={gi} className="flex items-center shrink-0">
              {gi > 0 && <span className="mx-1.5 h-4 w-px bg-border shrink-0" />}
              {group.map(([href, label]) => {
                const active = path === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`relative shrink-0 whitespace-nowrap px-2 sm:px-2.5 py-1 text-[13px] tracking-wide transition-colors duration-150 ${
                      active ? "text-paper" : "text-muted hover:text-silver"
                    }`}
                  >
                    {label}
                    {active && (
                      <span className="absolute -bottom-[7px] left-2 right-2 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        <div className="ml-auto hidden md:flex items-center gap-4 shrink-0">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-medium tracking-luxe text-ash uppercase">
            <span className="h-1 w-1 rounded-full bg-bull" /> Live
          </span>
          <Clock />
        </div>
      </div>
    </nav>
  );
}
