// Champagne "gem" mark — an outlined diamond around a solid core.
export function Logo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="fxc-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e6cf9c" />
          <stop offset="1" stopColor="#c9a96b" />
        </linearGradient>
      </defs>
      <path d="M12 1.5 L22.5 12 L12 22.5 L1.5 12 Z" stroke="url(#fxc-logo)"
        strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 6.75 L17.25 12 L12 17.25 L6.75 12 Z" fill="url(#fxc-logo)" />
    </svg>
  );
}
