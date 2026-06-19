import { Crest } from "./Crest";
import type { StandingView } from "@/lib/types";

// Renders a normalized standings table — used by the discover section. Local
// tournament standings have their own server-derived table in the standings page.
export function StandingsTable({ rows }: { rows: StandingView[] }) {
  return (
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
            <th className="text-center">GD</th>
            <th className="text-center font-bold">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.position} className={r.position === 1 ? "bg-primary/10" : ""}>
              <td>{r.position}</td>
              <td>
                <div className="flex items-center gap-2">
                  <Crest name={r.team} crest={r.crest} size={24} />
                  <span className="font-medium">{r.team}</span>
                </div>
              </td>
              <td className="text-center">{r.played}</td>
              <td className="text-center">{r.won}</td>
              <td className="text-center">{r.drawn}</td>
              <td className="text-center">{r.lost}</td>
              <td className="text-center">
                {r.goalDifference != null && r.goalDifference > 0
                  ? `+${r.goalDifference}`
                  : r.goalDifference}
              </td>
              <td className="text-center font-bold">{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
