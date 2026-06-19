import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { team } from "@/lib/db/schema";
import { getTournament, getPlayersForTeam } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { PlayerForm } from "@/components/PlayerForm";
import { InlineRename } from "@/components/InlineRename";

export default async function TeamPlayersPage({
  params,
}: {
  params: Promise<{ tournamentId: string; teamId: string }>;
}) {
  const { tournamentId, teamId } = await params;

  const tm = await db.query.team.findFirst({ where: eq(team.id, teamId) });
  if (!tm || tm.tournamentId !== tournamentId) notFound();

  const [t, players, user] = await Promise.all([
    getTournament(tournamentId),
    getPlayersForTeam(teamId),
    getCurrentUser(),
  ]);

  const isOwner = user?.id === t?.ownerId;
  if (!isOwner) {
    // Registering players is an owner-only surface.
    redirect(`/t/${tournamentId}/teams`);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <InlineRename teamId={teamId} name={tm.name} />
        <Link href={`/t/${tournamentId}/teams`} className="btn btn-ghost btn-sm">
          ← All teams
        </Link>
      </div>

      <PlayerForm
        teamId={teamId}
        players={players}
        target={t?.playersPerTeam ?? players.length}
      />
    </div>
  );
}
