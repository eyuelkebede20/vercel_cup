import { eq, asc, desc, sql } from "drizzle-orm";
import { db } from "./db";
import { tournament, team, player, match, goal } from "./db/schema";
import type { Match, Team } from "./db/schema";
import type { MatchView } from "./types";

export async function getTopScorers(tournamentId: string) {
  return db
    .select({
      id: player.id,
      name: player.name,
      teamName: team.name,
      goals: sql<number>`cast(count(${goal.id}) as int)`,
    })
    .from(goal)
    .innerJoin(player, eq(goal.scorerId, player.id))
    .innerJoin(team, eq(player.teamId, team.id))
    .where(eq(team.tournamentId, tournamentId))
    .groupBy(player.id, team.name)
    .orderBy(desc(sql`count(${goal.id})`));
}

export async function getTournament(tournamentId: string) {
  return db.query.tournament.findFirst({
    where: eq(tournament.id, tournamentId),
  });
}

export async function getTeams(tournamentId: string): Promise<Team[]> {
  return db
    .select()
    .from(team)
    .where(eq(team.tournamentId, tournamentId))
    .orderBy(asc(team.createdAt));
}

export async function getMatches(tournamentId: string): Promise<Match[]> {
  return db
    .select()
    .from(match)
    .where(eq(match.tournamentId, tournamentId))
    .orderBy(asc(match.round));
}

export async function getPlayersForTeam(teamId: string) {
  return db
    .select()
    .from(player)
    .where(eq(player.teamId, teamId))
    .orderBy(asc(player.number));
}

export async function getGoalsForMatch(matchId: string) {
  return db.select().from(goal).where(eq(goal.matchId, matchId));
}

// Build the shared MatchView the cards expect from a local match + team lookup.
export function toMatchView(m: Match, teams: Map<string, Team>): MatchView {
  const home = teams.get(m.homeTeamId);
  const away = teams.get(m.awayTeamId);
  return {
    id: m.id,
    kickoffAt: m.kickoffAt ? m.kickoffAt.toISOString() : null,
    round: m.round,
    status: m.status,
    home: { name: home?.name ?? "—", score: m.homeScore },
    away: { name: away?.name ?? "—", score: m.awayScore },
  };
}

export function teamMap(teams: Team[]): Map<string, Team> {
  return new Map(teams.map((t) => [t.id, t]));
}
