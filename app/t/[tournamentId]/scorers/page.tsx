import { getTopScorers } from "@/lib/queries";

export default async function ScorersPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = await params;
  const scorers = await getTopScorers(tournamentId);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Top Scorers</h2>

      {scorers.length === 0 ? (
        <div className="alert">
          <span>No goals logged yet. The leaderboard will update as matches are played!</span>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-box border border-base-200 bg-base-100">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Player</th>
                <th>Team</th>
                <th className="text-center font-bold">Goals</th>
              </tr>
            </thead>
            <tbody>
              {scorers.map((scorer, i) => (
                <tr key={scorer.id} className={i === 0 ? "bg-primary/10 font-medium" : ""}>
                  <td>{i + 1}</td>
                  <td className="font-medium">{scorer.name}</td>
                  <td>{scorer.teamName}</td>
                  <td className="text-center font-bold">{scorer.goals}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
