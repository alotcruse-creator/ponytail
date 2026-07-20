"use client";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/Card";
import { post } from "@/lib/api";

type Msg = { role: "user" | "assistant"; text: string };

const SUGGESTIONS = [
  "What's my FX exposure right now?",
  "Any liquidity gaps this week?",
  "How is PHP looking today?",
  "Give me the morning brief.",
];

export default function ChatPage() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  async function send(q: string) {
    const question = q.trim();
    if (!question || busy) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text: question }]);
    setBusy(true);
    const { answer } = await post<{ answer: string }>("/chat", { question }, {
      answer: "The assistant is unavailable right now — the backend didn't respond.",
    });
    setMsgs((m) => [...m, { role: "assistant", text: answer }]);
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between mb-1">
        <h1 className="font-serif text-[26px] sm:text-3xl font-normal text-paper tracking-tight">Assistant</h1>
        <span className="text-[10px] font-mono text-ash uppercase tracking-luxe">Read-only · grounded in your data</span>
      </div>

      <Card>
        <div className="min-h-[280px] max-h-[52vh] overflow-y-auto space-y-3 pr-1">
          {msgs.length === 0 && (
            <div className="text-sm text-muted leading-relaxed">
              Ask about the market, your FX exposure, or your liquidity. Every answer is
              drawn from the same computed figures shown across the app — the assistant
              reports and explains, it never proposes or places trades.
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-accent/15 border border-accent/25 text-paper rounded-br-sm"
                  : "bg-raised/70 border border-border text-silver rounded-bl-sm"
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm bg-raised/70 border border-border px-4 py-2.5">
                <span className="inline-flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent/70 animate-pulse" />
                  <span className="h-1.5 w-1.5 rounded-full bg-accent/50 animate-pulse [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-accent/30 animate-pulse [animation-delay:300ms]" />
                </span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {msgs.length === 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)}
                className="text-xs text-silver border border-border rounded-full px-3 py-1.5 hover:border-accent/40 hover:text-paper transition-colors">
                {s}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2 mt-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about exposure, liquidity, or the market…"
            className="flex-1 bg-bg border border-border rounded-lg px-3.5 py-2.5 text-sm text-paper placeholder:text-ash focus:outline-none focus:border-accent/50"
          />
          <button type="submit" disabled={busy || !input.trim()}
            className="shrink-0 rounded-lg bg-accent/90 text-bg font-medium text-sm px-4 py-2.5 disabled:opacity-40 hover:bg-accent transition-colors">
            Ask
          </button>
        </form>
      </Card>

      <p className="text-[11px] text-ash text-center">
        Phase 4 · Answers are generated from deterministic figures. Not financial advice; execution is never automated.
      </p>
    </div>
  );
}
