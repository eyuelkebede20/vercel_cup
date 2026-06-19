"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addPlayer, deletePlayer } from "@/lib/actions";
import type { Player } from "@/lib/db/schema";

// Register players for a team: name + shirt number (required), email (optional,
// captured but unused in the demo). `target` nudges toward the squad size.
export function PlayerForm({
  teamId,
  players,
  target,
}: {
  teamId: string;
  players: Player[];
  target: number;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await addPlayer({
      teamId,
      name,
      number: Number(number),
      email: email || undefined,
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setName("");
    setNumber("");
    setEmail("");
    router.refresh();
  }

  async function remove(id: string) {
    await deletePlayer(id);
    router.refresh();
  }

  const sorted = [...players].sort((a, b) => a.number - b.number);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Squad</h2>
        <span
          className={`badge ${
            players.length >= target ? "badge-success" : "badge-ghost"
          }`}
        >
          {players.length} / {target}
        </span>
      </div>

      <ul className="divide-y divide-base-200 rounded-box border border-base-200">
        {sorted.length === 0 && (
          <li className="p-4 text-sm opacity-60">
            No players yet — add your first one below.
          </li>
        )}
        {sorted.map((p) => (
          <li key={p.id} className="flex items-center gap-3 p-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-content tabular-nums">
              {p.number}
            </span>
            <span className="flex-1 font-medium">{p.name}</span>
            {p.email && (
              <span className="hidden text-xs opacity-50 sm:inline">
                {p.email}
              </span>
            )}
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={() => remove(p.id)}
              aria-label={`Remove ${p.name}`}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <form
        onSubmit={submit}
        className="grid grid-cols-1 gap-2 sm:grid-cols-[5rem_1fr_1fr_auto]"
      >
        <input
          className="input input-bordered"
          placeholder="No."
          inputMode="numeric"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          required
          aria-label="Shirt number"
        />
        <input
          className="input input-bordered"
          placeholder="Player name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          aria-label="Player name"
        />
        <input
          className="input input-bordered"
          placeholder="Email (optional)"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Email (optional)"
        />
        <button className="btn btn-primary" disabled={saving} type="submit">
          {saving ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            "Add"
          )}
        </button>
      </form>

      {error && <div className="alert alert-error py-2 text-sm">{error}</div>}
    </div>
  );
}
