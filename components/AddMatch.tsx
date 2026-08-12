"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createMatch } from "@/lib/actions";

export function AddMatch({
  tournamentId,
  teams,
}: {
  tournamentId: string;
  teams: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [homeTeamId, setHomeTeamId] = useState(teams[0]?.id ?? "");
  const [awayTeamId, setAwayTeamId] = useState(teams[1]?.id ?? "");
  const [round, setRound] = useState(1);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!homeTeamId || !awayTeamId || homeTeamId === awayTeamId) {
      alert("Please select two different teams");
      return;
    }
    setBusy(true);
    try {
      await createMatch({ tournamentId, homeTeamId, awayTeamId, round });
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to create match");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card border border-base-200 bg-base-100 p-4">
      <h3 className="font-semibold mb-4 text-sm opacity-60 uppercase tracking-wide">
        Manual Match Entry
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 items-end">
        <label className="form-control w-full">
          <div className="label">
            <span className="label-text">Round</span>
          </div>
          <input
            type="number"
            className="input input-bordered w-full"
            value={round}
            min={1}
            onChange={(e) => setRound(Number(e.target.value))}
            required
          />
        </label>

        <label className="form-control w-full">
          <div className="label">
            <span className="label-text">Home Team</span>
          </div>
          <select
            className="select select-bordered w-full"
            value={homeTeamId}
            onChange={(e) => setHomeTeamId(e.target.value)}
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>

        <label className="form-control w-full">
          <div className="label">
            <span className="label-text">Away Team</span>
          </div>
          <select
            className="select select-bordered w-full"
            value={awayTeamId}
            onChange={(e) => setAwayTeamId(e.target.value)}
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>

        <button className="btn btn-primary w-full" type="submit" disabled={busy}>
          {busy ? <span className="loading loading-spinner" /> : "Add Match"}
        </button>
      </div>
    </form>
  );
}
