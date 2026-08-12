"use client";

import { useState } from "react";
import { deleteTournament } from "@/lib/actions";

export function DeleteLeagueButton({ tournamentId }: { tournamentId: string }) {
  const [loading, setLoading] = useState(false);

  return (
    <button
      className="btn btn-circle btn-sm btn-ghost hover:bg-error hover:text-error-content absolute top-2 right-2 z-10"
      disabled={loading}
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this league? This cannot be undone.")) {
          setLoading(true);
          try {
            await deleteTournament(tournamentId);
          } catch (e) {
            setLoading(false);
          }
        }
      }}
      title="Delete League"
    >
      {loading ? (
        <span className="loading loading-spinner loading-xs" />
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      )}
    </button>
  );
}
