"use client";

import { useState } from "react";
import { GoalLogger } from "./GoalLogger";
import type { Player } from "@/lib/db/schema";

type SideData = { teamId: string; name: string; players: Player[] };

// A collapsible row per match in the admin panel. Collapsed it shows the
// matchup and current score; expanded it reveals the number-grid GoalLogger.
export function MatchLogger({
  matchId,
  status,
  homeScore,
  awayScore,
  home,
  away,
  initialGoals,
}: {
  matchId: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  home: SideData;
  away: SideData;
  initialGoals: { teamId: string; scorerId: string }[];
}) {
  const [open, setOpen] = useState(false);
  const played = status === "played";

  return (
    <div className="rounded-box border border-base-200 bg-base-100">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 p-3 text-left"
      >
        <span className="flex-1 truncate text-right font-medium">
          {home.name}
        </span>
        <span className="rounded bg-base-200 px-3 py-1 text-sm font-bold tabular-nums">
          {played ? `${homeScore} – ${awayScore}` : "vs"}
        </span>
        <span className="flex-1 truncate text-left font-medium">
          {away.name}
        </span>
        {played && <span className="badge badge-success badge-sm">FT</span>}
        <span className="opacity-40">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="border-t border-base-200 p-4 relative">
          <GoalLogger
            matchId={matchId}
            home={home}
            away={away}
            initialGoals={initialGoals}
            initialHomeScore={homeScore}
            initialAwayScore={awayScore}
          />
        </div>
      )}
    </div>
  );
}
