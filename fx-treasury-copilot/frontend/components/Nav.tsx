import Link from "next/link";

const LINKS = [
  ["/", "Dashboard"], ["/news", "Market News"],
  ["/calendar", "Economic Calendar"], ["/php", "PHP Monitor"],
];

export function Nav() {
  return (
    <nav className="border-b border-border bg-panel/60 sticky top-0 z-10 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 flex items-center gap-6 h-12">
        <span className="font-bold text-accent tracking-tight">FX TREASURY COPILOT</span>
        <div className="flex gap-4 text-sm text-muted">
          {LINKS.map(([href, label]) => (
            <Link key={href} href={href} className="hover:text-slate-100">{label}</Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
