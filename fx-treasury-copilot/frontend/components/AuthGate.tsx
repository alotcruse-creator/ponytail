"use client";
import { useEffect, useState } from "react";
import { getToken, setToken, login } from "@/lib/api";
import { Logo } from "./Logo";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setAuthed(!!getToken());
    setReady(true);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const token = await login(email, password);
    setBusy(false);
    if (token) {
      setToken(token);
      setAuthed(true);
    } else {
      setError("Incorrect email or password.");
    }
  }

  if (!ready) return null;
  if (authed) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <Logo className="h-7 w-7" />
          <span className="font-serif text-xl text-paper tracking-tight">
            FX <span className="italic text-accent">Copilot</span>
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-gradient-to-br from-panel/90 to-raised/60 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_28px_60px_-32px_rgba(0,0,0,0.9)]">
          <h1 className="font-serif text-2xl text-paper mb-1">Sign in</h1>
          <p className="text-xs text-ash mb-6">Access is limited to authorised users.</p>

          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <span className="text-[10px] font-medium tracking-luxe text-muted uppercase">Email</span>
              <input
                type="email" autoComplete="username" value={email}
                onChange={(e) => setEmail(e.target.value)} required
                className="mt-1.5 w-full bg-bg border border-border rounded-lg px-3.5 py-2.5 text-sm text-paper placeholder:text-ash focus:outline-none focus:border-accent/50"
                placeholder="you@example.com"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-medium tracking-luxe text-muted uppercase">Password</span>
              <input
                type="password" autoComplete="current-password" value={password}
                onChange={(e) => setPassword(e.target.value)} required
                className="mt-1.5 w-full bg-bg border border-border rounded-lg px-3.5 py-2.5 text-sm text-paper placeholder:text-ash focus:outline-none focus:border-accent/50"
                placeholder="••••••••"
              />
            </label>

            {error && <p className="text-xs text-bear">{error}</p>}

            <button
              type="submit" disabled={busy}
              className="w-full rounded-lg bg-accent/90 text-bg font-medium text-sm py-2.5 hover:bg-accent transition-colors disabled:opacity-40"
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[11px] text-ash">
          You'll stay signed in on this device. Read-only market intelligence — never executes trades.
        </p>
      </div>
    </div>
  );
}
