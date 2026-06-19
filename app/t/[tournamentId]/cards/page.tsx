import { getMatches, getTeams, teamMap, toMatchView } from "@/lib/queries";
import { ResultCard } from "@/components/ResultCard";
import { CardExportButton } from "@/components/CardExportButton";

export default async function CardsPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = await params;
  const [teams, matches] = await Promise.all([
    getTeams(tournamentId),
    getMatches(tournamentId),
  ]);
  const tm = teamMap(teams);

  // Played results first (they make the best share cards), then upcoming.
  const ordered = [...matches].sort((a, b) => {
    const ap = a.status === "played" ? 0 : 1;
    const bp = b.status === "played" ? 0 : 1;
    return ap - bp || a.round - b.round;
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Share cards</h2>
        <p className="text-sm opacity-60">
          One-tap PNG export — drop a clean card straight into the group chat.
        </p>
      </div>

      {ordered.length === 0 ? (
        <div className="alert">
          <span>No fixtures to share yet.</span>
        </div>
      ) : (
        <div className="grid justify-items-center gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ordered.map((m) => {
            const view = toMatchView(m, tm);
            const filename = `${view.home.name}-vs-${view.away.name}.png`
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-");
            return (
              <CardExportButton key={m.id} filename={filename}>
                <ResultCard match={view} />
              </CardExportButton>
            );
          })}
        </div>
      )}
    </div>
  );
}
