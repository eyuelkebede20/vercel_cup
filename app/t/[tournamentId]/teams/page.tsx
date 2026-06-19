import Link from "next/link";
import { eq, asc, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { team, player } from "@/lib/db/schema";
import { getTournament } from "@/lib/queries";

export default async function TeamsPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = await params;
  const t = await getTournament(tournamentId);

  const teams = await db
    .select()
    .from(team)
    .where(eq(team.tournamentId, tournamentId))
    .orderBy(asc(team.createdAt));

  // Count players per team in one query.
  const counts =
    teams.length > 0
      ? await db
          .select({ teamId: player.teamId, n: sql<number>`count(*)::int` })
          .from(player)
          .where(
            inArray(
              player.teamId,
              teams.map((x) => x.id),
            ),
          )
          .groupBy(player.teamId)
      : [];
  const countMap = new Map(counts.map((c) => [c.teamId, c.n]));

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Players</h2>
      <p className="text-sm opacity-60">
        Pick a team to register its squad — name + shirt number (email optional).
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((tm) => {
          const n = countMap.get(tm.id) ?? 0;
          return (
            <Link
              key={tm.id}
              href={`/t/${tournamentId}/teams/${tm.id}`}
              className="card border border-base-200 bg-base-100 transition hover:border-primary"
            >
              <div className="card-body flex-row items-center justify-between">
                <span className="font-medium">{tm.name}</span>
                <span
                  className={`badge ${
                    t && n >= t.playersPerTeam ? "badge-success" : "badge-ghost"
                  }`}
                >
                  {n}
                  {t ? ` / ${t.playersPerTeam}` : ""}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
