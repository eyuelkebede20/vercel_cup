"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logResult } from "@/lib/actions";
import type { Player } from "@/lib/db/schema";

type SideData = {
  teamId: string;
  name: string;
  players: Player[];
};

type LoggedGoal = {
  // local id for list keys / undo
  key: string;
  teamId: string;
  scorerId: string;
  scorerNumber: number;
  scorerName: string;
};

// The tactile heart of the app. For each goal the admin TAPS a shirt number
// (no name typing); the score updates live. Numbers render as big buttons in a
// grid — mobile-first, because admins log pitchside on a phone.
export function GoalLogger({
  matchId,
  home,
  away,
  initialGoals,
  initialHomeScore,
  initialAwayScore,
}: {
  matchId: string;
  home: SideData;
  away: SideData;
  initialGoals: { teamId: string; scorerId: string }[];
  initialHomeScore?: number | null;
  initialAwayScore?: number | null;
}) {
  const router = useRouter();

  const allPlayers = [...home.players, ...away.players];
  const findPlayer = (id: string) => allPlayers.find((p) => p.id === id);

  const [goals, setGoals] = useState<LoggedGoal[]>(() =>
    initialGoals.flatMap((g, i) => {
      const p = allPlayers.find((pl) => pl.id === g.scorerId);
      if (!p) return [];
      return [
        {
          key: `init-${i}`,
          teamId: g.teamId,
          scorerId: g.scorerId,
          scorerNumber: p.number,
          scorerName: p.name,
        },
      ];
    }),
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If there are goals, score is derived. Otherwise it falls back to the manual override.
  const [manualHome, setManualHome] = useState(initialHomeScore ?? 0);
  const [manualAway, setManualAway] = useState(initialAwayScore ?? 0);

  const homeScore = goals.length > 0 ? goals.filter((g) => g.teamId === home.teamId).length : manualHome;
  const awayScore = goals.length > 0 ? goals.filter((g) => g.teamId === away.teamId).length : manualAway;

  function addGoal(teamId: string, p: Player) {
    setSaved(false);
    setGoals((g) => [
      ...g,
      {
        key: `${Date.now()}-${p.id}-${g.length}`,
        teamId,
        scorerId: p.id,
        scorerNumber: p.number,
        scorerName: p.name,
      },
    ]);
  }

  function removeGoal(key: string) {
    setSaved(false);
    setGoals((g) => g.filter((x) => x.key !== key));
  }

  async function save() {
    setSaving(true);
    setError(null);
    const res = await logResult({
      matchId,
      goals: goals.map((g) => ({
        teamId: g.teamId,
        scorerId: g.scorerId,
        minute: null,
      })),
      homeScore: goals.length > 0 ? undefined : manualHome,
      awayScore: goals.length > 0 ? undefined : manualAway,
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {/* Live score */}
      <div className="flex items-center justify-center gap-4 text-center">
        <span className="flex-1 truncate text-right font-semibold">
          {home.name}
        </span>
        <div className="flex items-center gap-2 rounded-box bg-base-200 px-4 py-2 text-3xl font-extrabold tabular-nums">
          {goals.length > 0 ? (
            <span>{homeScore}</span>
          ) : (
            <input 
              type="number" 
              min="0"
              className="w-12 bg-transparent text-center outline-none" 
              value={manualHome} 
              onChange={(e) => setManualHome(parseInt(e.target.value) || 0)} 
            />
          )}
          <span className="opacity-30">–</span>
          {goals.length > 0 ? (
            <span>{awayScore}</span>
          ) : (
            <input 
              type="number" 
              min="0"
              className="w-12 bg-transparent text-center outline-none" 
              value={manualAway} 
              onChange={(e) => setManualAway(parseInt(e.target.value) || 0)} 
            />
          )}
        </div>
        <span className="flex-1 truncate text-left font-semibold">
          {away.name}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberGrid side={home} onTap={(p) => addGoal(home.teamId, p)} />
        <NumberGrid side={away} onTap={(p) => addGoal(away.teamId, p)} />
      </div>

      {/* Goal log with undo */}
      {goals.length > 0 && (
        <div className="rounded-box border border-base-200 p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide opacity-60">
            Goals
          </div>
          <ul className="flex flex-wrap gap-2">
            {goals.map((g) => (
              <li key={g.key}>
                <button
                  type="button"
                  onClick={() => removeGoal(g.key)}
                  className="badge badge-lg gap-1 hover:badge-error"
                  title="Tap to undo this goal"
                >
                  <span
                    className={
                      g.teamId === home.teamId ? "text-primary" : "text-secondary"
                    }
                  >
                    #{g.scorerNumber}
                  </span>
                  {g.scorerName}
                  <span className="opacity-50">✕</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <div className="alert alert-error py-2 text-sm">{error}</div>}

      <div className="flex items-center gap-3">
        <button
          className="btn btn-primary flex-1"
          onClick={save}
          disabled={saving}
        >
          {saving ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            "Save result"
          )}
        </button>
        {saved && <span className="text-sm text-success">✓ Saved</span>}
        <button
          className="btn btn-outline btn-error"
          onClick={async () => {
            if (confirm("Delete this match completely?")) {
              const { deleteMatch } = await import("@/lib/actions");
              await deleteMatch(matchId);
            }
          }}
        >
          Delete match
        </button>
      </div>
    </div>
  );
}

function NumberGrid({
  side,
  onTap,
}: {
  side: SideData;
  onTap: (p: Player) => void;
}) {
  const sorted = [...side.players].sort((a, b) => a.number - b.number);
  return (
    <div className="rounded-box border border-base-200 p-3">
      <div className="mb-2 truncate text-sm font-semibold">{side.name}</div>
      {sorted.length === 0 ? (
        <p className="py-4 text-center text-xs opacity-50">
          No players registered for this team yet.
        </p>
      ) : (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {sorted.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onTap(p)}
              className="btn btn-outline h-auto flex-col py-2 hover:btn-primary"
              title={`Goal for ${p.name}`}
            >
              <span className="text-lg font-bold tabular-nums">{p.number}</span>
              <span className="max-w-full truncate text-[10px] font-normal opacity-70">
                {p.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
