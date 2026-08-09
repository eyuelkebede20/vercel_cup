import Link from "next/link";
import {
  getCompetitionMatches,
  getCompetitionStandings,
  getCompetitionName,
  isLeaguesConfigured,
  sampleMatches,
  sampleStandings,
  SAMPLE_NOTICE,
} from "@/lib/leagues";
import { FixtureCard } from "@/components/FixtureCard";
import { StandingsTable } from "@/components/StandingsTable";
import type { MatchView, StandingView } from "@/lib/types";

export default async function CompetitionPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  let name = code;
  let matches: MatchView[] = [];
  let standings: StandingView[] = [];
  let sample = !isLeaguesConfigured();
  let error: string | null = null;

  if (isLeaguesConfigured()) {
    try {
      [name, matches, standings] = await Promise.all([
        getCompetitionName(code),
        getCompetitionMatches(code),
        getCompetitionStandings(code),
      ]);
    } catch {
      // API hiccup / rate limit — fall back to the sample so the page still works.
      sample = true;
    }
  }

  if (sample) {
    name = await getCompetitionName(code).catch(() => code);
    matches = sampleMatches();
    standings = sampleStandings();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{name}</h1>
          {sample && (
            <span className="badge badge-ghost badge-sm mt-1">Sample data</span>
          )}
        </div>
        <Link href="/leagues" className="btn btn-ghost btn-sm">
          ← All leagues
        </Link>
      </div>

      {sample && (
        <div className="alert">
          <span>{SAMPLE_NOTICE}</span>
        </div>
      )}

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
