"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createTournament } from "@/lib/actions";
import { tournamentSetupSchema, type TournamentSetup } from "@/lib/validation";

type Msg = { role: "user" | "assistant"; content: string };

const GREETING =
  "Hi! I'll set up your round-robin league. To start — what should we call it?";

export function ChatSetup() {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<TournamentSetup | null>(null);
  const [creating, setCreating] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, pending]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setPending(null);
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Gemini is stateless — send the full history every request.
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");

      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);

      if (data.status === "ready" && data.payload) {
        const safe = tournamentSetupSchema.safeParse(data.payload);
        if (safe.success) setPending(safe.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmCreate() {
    if (!pending) return;
    setCreating(true);
    setError(null);
    try {
      const { tournamentId } = await createTournament(pending);
      router.push(`/t/${tournamentId}`);
    } catch {
      setError("Couldn't create the league. Try again.");
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto flex h-[70vh] max-w-2xl flex-col rounded-box border border-base-200 bg-base-100">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`chat ${m.role === "user" ? "chat-end" : "chat-start"}`}
          >
            <div
              className={`chat-bubble ${
                m.role === "user" ? "chat-bubble-primary" : ""
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="chat chat-start">
            <div className="chat-bubble">
              <span className="loading loading-dots loading-sm" />
            </div>
          </div>
        )}

        {pending && (
          <div className="card border border-primary/40 bg-primary/5">
            <div className="card-body gap-3">
              <h3 className="font-semibold">Ready to create</h3>
              <ul className="text-sm">
                <li>
                  <strong>{pending.tournamentName}</strong>
                </li>
                <li>{pending.teamCount} teams</li>
                <li>{pending.playersPerTeam} players per team</li>
                <li>
                  {pending.doubleRound ? "Home & away (double round)" : "Single round-robin"}
                </li>
                {pending.teamNames.length > 0 && (
                  <li className="opacity-70">
                    Teams: {pending.teamNames.join(", ")}
                  </li>
                )}
              </ul>
              <button
                className="btn btn-primary btn-sm"
                onClick={confirmCreate}
                disabled={creating}
              >
                {creating ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  "Create league →"
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="alert alert-error mx-4 mb-2 py-2 text-sm">{error}</div>
      )}

      <form onSubmit={send} className="flex gap-2 border-t border-base-200 p-3">
        <input
          className="input input-bordered flex-1"
          placeholder="Type your message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          autoFocus
        />
        <button className="btn btn-primary" type="submit" disabled={loading}>
          Send
        </button>
      </form>
    </div>
  );
}
