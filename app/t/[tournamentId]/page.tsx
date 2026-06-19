import Link from "next/link";
import { getTournament, getTeams, getMatches, teamMap, toMatchView } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { FixtureCard } from "@/components/FixtureCard";
import { RegenerateButton } from "@/components/RegenerateButton";

export default async function FixturesPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = await params;
  const [t, teams, matches, user] = await Promise.all([
    getTournament(tournamentId),
    getTeams(tournamentId),
    getMatches(tournamentId),
    getCurrentUser(),
  ]);

  const tm = teamMap(teams);
  const isOwner = user?.id === t?.ownerId;

  // Group by round for the "perfect view".
  const byRound = new Map<number, typeof matches>();
  for (const m of matches) {
    const list = byRound.get(m.round) ?? [];
    list.push(m);
    byRound.set(m.round, list);
  }
  const rounds = [...byRound.keys()].sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Fixtures</h2>
        <div className="flex gap-2">
          {isOwner && (
            <Link href={`/t/${tournamentId}/admin`} className="btn btn-sm btn-primary">
              Log results
            </Link>
          )}
          {isOwner && <RegenerateButton tournamentId={tournamentId} />}
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="card border border-dashed border-base-300 bg-base-100">
          <div className="card-body items-center text-center opacity-70">
            No fixtures yet.
          </div>
        </div>
      ) : (
        rounds.map((round) => (
          <section key={round} className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide opacity-60">
              Round {round}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {byRound.get(round)!.map((m) => (
                <FixtureCard key={m.id} match={toMatchView(m, tm)} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
