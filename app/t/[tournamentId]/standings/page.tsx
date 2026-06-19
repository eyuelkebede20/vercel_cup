import { getTeams, getMatches } from "@/lib/queries";
import { computeStandings } from "@/lib/standings";

export default async function StandingsPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = await params;
  const [teams, matches] = await Promise.all([
    getTeams(tournamentId),
    getMatches(tournamentId),
  ]);

  const rows = computeStandings(teams, matches);
  const anyPlayed = matches.some((m) => m.status === "played");

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Standings</h2>

      {!anyPlayed && (
        <div className="alert">
          <span>
            No results logged yet — the table fills in as you log goals in Admin.
          </span>
        </div>
      )}

      <div className="overflow-x-auto rounded-box border border-base-200 bg-base-100">
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Team</th>
              <th className="text-center">P</th>
              <th className="text-center">W</th>
              <th className="text-center">D</th>
              <th className="text-center">L</th>
              <th className="text-center">GF</th>
              <th className="text-center">GA</th>
              <th className="text-center">GD</th>
              <th className="text-center font-bold">Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.teamId} className={i === 0 ? "bg-primary/10 font-medium" : ""}>
                <td>{i + 1}</td>
                <td className="font-medium">{r.teamName}</td>
                <td className="text-center">{r.played}</td>
                <td className="text-center">{r.won}</td>
                <td className="text-center">{r.drawn}</td>
                <td className="text-center">{r.lost}</td>
                <td className="text-center">{r.goalsFor}</td>
                <td className="text-center">{r.goalsAgainst}</td>
                <td className="text-center">
                  {r.goalDifference > 0 ? `+${r.goalDifference}` : r.goalDifference}
                </td>
                <td className="text-center font-bold">{r.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
