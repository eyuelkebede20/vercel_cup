"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { regenerateFixtures } from "@/lib/actions";

// Regenerating clears existing matches + goals. We removed the warn prompt
// to let the user "shuffle" rapidly until they get a fixture list they like.
export function RegenerateButton({ tournamentId }: { tournamentId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run() {
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
      {busy ? <span className="loading loading-spinner loading-xs" /> : "↻ Shuffle"}
    </button>
  );
}
