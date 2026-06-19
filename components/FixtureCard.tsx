import { Crest } from "./Crest";
import { formatKickoff } from "@/lib/format";
import type { MatchView } from "@/lib/types";

// One card layout for a fixture — used by both the tournament and the public
// discover section. If the match has been played, the score is shown; if not,
// it reads as an upcoming fixture.
export function FixtureCard({ match }: { match: MatchView }) {
  const played =
    match.status === "played" &&
    match.home.score != null &&
    match.away.score != null;
  const kickoff = formatKickoff(match.kickoffAt);

  return (
    <div className="card bg-base-100 border border-base-200">
      <div className="card-body gap-3 p-4">
        <div className="flex items-center justify-between text-xs uppercase tracking-wide opacity-60">
          <span>
            {match.competition ??
              (match.round != null ? `Round ${match.round}` : "Fixture")}
          </span>
          {played ? (
            <span className="badge badge-ghost badge-sm">FT</span>
          ) : kickoff ? (
            <span>{kickoff}</span>
          ) : (
            <span className="badge badge-outline badge-sm">Scheduled</span>
          )}
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <Side name={match.home.name} crest={match.home.crest} align="end" />
          <div className="px-2 text-center">
            {played ? (
              <span className="text-2xl font-bold tabular-nums">
                {match.home.score}
                <span className="mx-1 opacity-40">–</span>
                {match.away.score}
              </span>
            ) : (
              <span className="text-sm font-medium opacity-50">vs</span>
            )}
          </div>
          <Side name={match.away.name} crest={match.away.crest} align="start" />
        </div>
      </div>
    </div>
  );
}

function Side({
  name,
  crest,
  align,
}: {
  name: string;
  crest?: string | null;
  align: "start" | "end";
}) {
  return (
    <div
      className={`flex items-center gap-2 ${
        align === "end" ? "flex-row-reverse text-right" : "text-left"
      }`}
    >
      <Crest name={name} crest={crest} size={36} />
      <span className="font-medium leading-tight">{name}</span>
    </div>
  );
}
