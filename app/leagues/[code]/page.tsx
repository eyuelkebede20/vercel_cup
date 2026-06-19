import Link from "next/link";
import {
  getCompetitionMatches,
  getCompetitionStandings,
  getCompetitionName,
  isLeaguesConfigured,
} from "@/lib/leagues";
import { FixtureCard } from "@/components/FixtureCard";
import { StandingsTable } from "@/components/StandingsTable";

export default async function CompetitionPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  if (!isLeaguesConfigured()) {
    return (
      <div className="space-y-4">
        <Link href="/leagues" className="btn btn-ghost btn-sm">
          ← All leagues
        </Link>
        <div className="alert alert-warning">
          <span>
            External data isn&apos;t configured. Set <code>FOOTBALL_DATA_KEY</code>.
          </span>
        </div>
      </div>
    );
  }

  let name = code;
  let matches: Awaited<ReturnType<typeof getCompetitionMatches>> = [];
  let standings: Awaited<ReturnType<typeof getCompetitionStandings>> = [];
  let error: string | null = null;

  try {
    [name, matches, standings] = await Promise.all([
      getCompetitionName(code),
      getCompetitionMatches(code),
      getCompetitionStandings(code),
    ]);
  } catch (e) {
    error =
      e instanceof Error
        ? e.message
        : "Couldn't load this league right now.";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{name}</h1>
        <Link href="/leagues" className="btn btn-ghost btn-sm">
          ← All leagues
        </Link>
      </div>

      {error ? (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      ) : (
        <>
          {standings.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Standings</h2>
              <StandingsTable rows={standings} />
            </section>
          )}

          {matches.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Fixtures &amp; results</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {matches.map((m) => (
                  <FixtureCard key={m.id} match={m} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
