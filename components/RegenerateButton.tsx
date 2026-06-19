"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { regenerateFixtures } from "@/lib/actions";

// Regenerating clears existing matches + goals, so warn first.
export function RegenerateButton({ tournamentId }: { tournamentId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run() {
    const ok = window.confirm(
      "Regenerate fixtures? This clears all existing matches and logged goals.",
    );
    if (!ok) return;
    setBusy(true);
    try {
      await regenerateFixtures(tournamentId);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className="btn btn-sm btn-ghost" onClick={run} disabled={busy}>
      {busy ? <span className="loading loading-spinner loading-xs" /> : "↻ Regenerate"}
    </button>
  );
}
