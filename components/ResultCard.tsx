import { Crest } from "./Crest";
import { APP_NAME } from "@/lib/constants";
import type { MatchView } from "@/lib/types";

// The "shareable" card — fixed aspect ratio, bold score, winner highlighted.
// This is the one exported to PNG for a group chat.
export function ResultCard({ match }: { match: MatchView }) {
  const hs = match.home.score ?? 0;
  const as = match.away.score ?? 0;
  const played =
    match.status === "played" &&
    match.home.score != null &&
    match.away.score != null;

  const homeWin = played && hs > as;
  const awayWin = played && as > hs;

  return (
    <div
      className="card aspect-[4/3] w-full max-w-sm overflow-hidden bg-gradient-to-br from-base-100 to-base-200 ring-1 ring-base-300"
      data-export-card
    >
      <div className="card-body items-stretch justify-between gap-2 p-5">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest opacity-60">
          <span>{APP_NAME}</span>
          <span>
            {match.competition ??
              (match.round != null ? `Round ${match.round}` : "")}
          </span>
        </div>

        <div className="grid grid-cols-3 items-center gap-1">
          <TeamColumn
            name={match.home.name}
            crest={match.home.crest}
            winner={homeWin}
          />
          <div className="text-center">
            {played ? (
              <div className="text-4xl font-extrabold tabular-nums">
                {hs}
                <span className="mx-1 opacity-30">–</span>
                {as}
              </div>
            ) : (
              <div className="text-2xl font-bold opacity-40">vs</div>
            )}
          </div>
          <TeamColumn
            name={match.away.name}
            crest={match.away.crest}
            winner={awayWin}
          />
        </div>

        <div className="text-center text-xs opacity-50">
          {played ? "Full time" : "Upcoming fixture"}
        </div>
      </div>
    </div>
  );
}

function TeamColumn({
  name,
  crest,
  winner,
}: {
  name: string;
  crest?: string | null;
  winner: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <Crest name={name} crest={crest} size={56} />
      <span
        className={`text-sm leading-tight ${
          winner ? "font-bold text-primary" : "font-medium"
        }`}
      >
        {name}
      </span>
    </div>
  );
}
