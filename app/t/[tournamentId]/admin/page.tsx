import { notFound, redirect } from "next/navigation";
import { eq, asc, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { player, goal } from "@/lib/db/schema";
import { getTournament, getTeams, getMatches, teamMap } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { MatchLogger } from "@/components/MatchLogger";
import { AddMatch } from "@/components/AddMatch";
import type { Player } from "@/lib/db/schema";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = await params;
  const t = await getTournament(tournamentId);
  if (!t) notFound();

  const user = await getCurrentUser();
  if (!user || user.id !== t.ownerId) redirect(`/t/${tournamentId}`);

  const [teams, matches] = await Promise.all([
    getTeams(tournamentId),
    getMatches(tournamentId),
  ]);
  const tm = teamMap(teams);

  // Load every player and goal in two queries, then group in memory.
  const teamIds = teams.map((t) => t.id);
  const matchIds = matches.map((m) => m.id);

  const players: Player[] = teamIds.length
    ? await db
        .select()
        .from(player)
        .where(inArray(player.teamId, teamIds))
        .orderBy(asc(player.number))
    : [];

  const goals = matchIds.length
    ? await db.select().from(goal).where(inArray(goal.matchId, matchIds))
    : [];

  const playersByTeam = new Map<string, Player[]>();
  for (const p of players) {
    const list = playersByTeam.get(p.teamId) ?? [];
    list.push(p);
    playersByTeam.set(p.teamId, list);
  }

  const goalsByMatch = new Map<string, { teamId: string; scorerId: string }[]>();
  for (const g of goals) {
    const list = goalsByMatch.get(g.matchId) ?? [];
    list.push({ teamId: g.teamId, scorerId: g.scorerId });
    goalsByMatch.set(g.matchId, list);
  }

  // Group matches by round.
  const byRound = new Map<number, typeof matches>();
  for (const m of matches) {
    const list = byRound.get(m.round) ?? [];
    list.push(m);
    byRound.set(m.round, list);
  }
  const rounds = [...byRound.keys()].sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Admin — log results</h2>
        <p className="text-sm opacity-60">
          Tap a shirt number for each goal. The score and standings update when
          you save.
        </p>
      </div>

      {matches.length === 0 && (
        <div className="alert">
          <span>No fixtures yet.</span>
        </div>
      )}

      {rounds.map((round) => (
        <section key={round} className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide opacity-60">
            Round {round}
          </h3>
          <div className="space-y-2">
            {byRound.get(round)!.map((m) => {
              const home = tm.get(m.homeTeamId)!;
              const away = tm.get(m.awayTeamId)!;
              return (
                <MatchLogger
                  key={m.id}
                  matchId={m.id}
                  status={m.status}
                  homeScore={m.homeScore}
                  awayScore={m.awayScore}
                  home={{
                    teamId: home.id,
                    name: home.name,
                    players: playersByTeam.get(home.id) ?? [],
                  }}
                  away={{
                    teamId: away.id,
                    name: away.name,
                    players: playersByTeam.get(away.id) ?? [],
                  }}
                  initialGoals={goalsByMatch.get(m.id) ?? []}
                />
              );
            })}
          </div>
        </section>
      ))}

      <section className="pt-4">
        <AddMatch tournamentId={tournamentId} teams={teams.map(t => ({ id: t.id, name: t.name }))} />
      </section>
    </div>
  );
}
