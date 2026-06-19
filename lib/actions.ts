"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { tournament, team, player, match, goal } from "./db/schema";
import { requireUser } from "./session";
import { generateRoundRobin } from "./fixtures";
import {
  tournamentSetupSchema,
  playerSchema,
  renameTeamSchema,
  logResultSchema,
  type TournamentSetup,
} from "./validation";

/* ----------------------------- helpers ----------------------------- */

// Ensure the current user owns this tournament; throws otherwise.
async function requireOwnedTournament(tournamentId: string) {
  const user = await requireUser();
  const row = await db.query.tournament.findFirst({
    where: eq(tournament.id, tournamentId),
  });
  if (!row) throw new Error("NOT_FOUND");
  if (row.ownerId !== user.id) throw new Error("FORBIDDEN");
  return { user, tournament: row };
}

function teamNameFor(names: string[], i: number): string {
  const provided = names[i]?.trim();
  return provided && provided.length > 0 ? provided : `Team ${i + 1}`;
}

/* --------------------------- create league -------------------------- */

// THE single source of truth for creation. The manual wizard's "Do Fixtures"
// button and the AI assistant both call this. Creates the tournament, its
// teams, and the full round-robin fixture list in one transaction-like flow.
export async function createTournament(
  input: TournamentSetup,
): Promise<{ tournamentId: string }> {
  const user = await requireUser();
  const setup = tournamentSetupSchema.parse(input);

  // 1. Tournament row.
  const [created] = await db
    .insert(tournament)
    .values({
      name: setup.tournamentName,
      ownerId: user.id,
      teamCount: setup.teamCount,
      playersPerTeam: setup.playersPerTeam,
      doubleRound: setup.doubleRound,
    })
    .returning({ id: tournament.id });

  const tournamentId = created.id;

  // 2. Teams (named or auto-named to the target count).
  const teamRows = await db
    .insert(team)
    .values(
      Array.from({ length: setup.teamCount }, (_, i) => ({
        tournamentId,
        name: teamNameFor(setup.teamNames, i),
      })),
    )
    .returning({ id: team.id });

  // 3. Fixtures — single round-robin (doubled if requested).
  const fixtures = generateRoundRobin(
    teamRows.map((t) => t.id),
    setup.doubleRound,
  );

  if (fixtures.length > 0) {
    await db.insert(match).values(
      fixtures.map((f) => ({
        tournamentId,
        round: f.round,
        homeTeamId: f.home,
        awayTeamId: f.away,
      })),
    );
  }

  revalidatePath("/");
  return { tournamentId };
}

/* --------------------------- regenerate ---------------------------- */

// Re-run the round-robin from scratch. Clears existing matches + goals
// (the UI warns before calling this).
export async function regenerateFixtures(tournamentId: string): Promise<void> {
  const { tournament: t } = await requireOwnedTournament(tournamentId);

  const teamRows = await db
    .select({ id: team.id })
    .from(team)
    .where(eq(team.tournamentId, tournamentId));

  // Cascade from match deletes goals.
  await db.delete(match).where(eq(match.tournamentId, tournamentId));

  const fixtures = generateRoundRobin(
    teamRows.map((r) => r.id),
    t.doubleRound,
  );

  if (fixtures.length > 0) {
    await db.insert(match).values(
      fixtures.map((f) => ({
        tournamentId,
        round: f.round,
        homeTeamId: f.home,
        awayTeamId: f.away,
      })),
    );
  }

  revalidatePath(`/t/${tournamentId}`);
  revalidatePath(`/t/${tournamentId}/standings`);
}

/* ----------------------------- rename ------------------------------ */

export async function renameTeam(input: {
  teamId: string;
  name: string;
}): Promise<void> {
  const { teamId, name } = renameTeamSchema.parse(input);

  const row = await db.query.team.findFirst({ where: eq(team.id, teamId) });
  if (!row) throw new Error("NOT_FOUND");
  await requireOwnedTournament(row.tournamentId);

  await db.update(team).set({ name }).where(eq(team.id, teamId));
  revalidatePath(`/t/${row.tournamentId}`);
}

/* ----------------------------- players ----------------------------- */

export async function addPlayer(input: {
  teamId: string;
  name: string;
  number: number;
  email?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  let parsed;
  try {
    parsed = playerSchema.parse(input);
  } catch {
    return { ok: false, error: "Please enter a name and a shirt number." };
  }

  const row = await db.query.team.findFirst({
    where: eq(team.id, parsed.teamId),
  });
  if (!row) return { ok: false, error: "Team not found." };
  await requireOwnedTournament(row.tournamentId);

  try {
    await db.insert(player).values({
      teamId: parsed.teamId,
      name: parsed.name,
      number: parsed.number,
      email: parsed.email ? parsed.email : null,
    });
  } catch {
    // Most likely the UNIQUE(teamId, number) constraint.
    return {
      ok: false,
      error: `Shirt number ${parsed.number} is already taken on this team.`,
    };
  }

  revalidatePath(`/t/${row.tournamentId}/teams/${parsed.teamId}`);
  return { ok: true };
}

export async function deletePlayer(playerId: string): Promise<void> {
  const row = await db.query.player.findFirst({
    where: eq(player.id, playerId),
  });
  if (!row) throw new Error("NOT_FOUND");
  const teamRow = await db.query.team.findFirst({
    where: eq(team.id, row.teamId),
  });
  if (!teamRow) throw new Error("NOT_FOUND");
  await requireOwnedTournament(teamRow.tournamentId);

  await db.delete(player).where(eq(player.id, playerId));
  revalidatePath(`/t/${teamRow.tournamentId}/teams/${row.teamId}`);
}

/* --------------------------- log result ---------------------------- */

// Goals are the source of truth: the score is derived from the goal counts
// per side, then persisted onto the match for cheap reads.
export async function logResult(input: {
  matchId: string;
  goals: { teamId: string; scorerId: string; minute: number | null }[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  let parsed;
  try {
    parsed = logResultSchema.parse(input);
  } catch {
    return { ok: false, error: "Invalid result." };
  }

  const m = await db.query.match.findFirst({
    where: eq(match.id, parsed.matchId),
  });
  if (!m) return { ok: false, error: "Match not found." };
  await requireOwnedTournament(m.tournamentId);

  // Every goal must belong to one of the two sides in this match.
  for (const g of parsed.goals) {
    if (g.teamId !== m.homeTeamId && g.teamId !== m.awayTeamId) {
      return { ok: false, error: "A goal was assigned to the wrong team." };
    }
  }

  const homeScore = parsed.goals.filter((g) => g.teamId === m.homeTeamId).length;
  const awayScore = parsed.goals.filter((g) => g.teamId === m.awayTeamId).length;

  // Replace this match's goals, then persist the derived score.
  await db.delete(goal).where(eq(goal.matchId, m.id));
  if (parsed.goals.length > 0) {
    await db.insert(goal).values(
      parsed.goals.map((g) => ({
        matchId: m.id,
        scorerId: g.scorerId,
        teamId: g.teamId,
        minute: g.minute,
      })),
    );
  }

  await db
    .update(match)
    .set({ homeScore, awayScore, status: "played" })
    .where(eq(match.id, m.id));

  revalidatePath(`/t/${m.tournamentId}/admin`);
  revalidatePath(`/t/${m.tournamentId}`);
  revalidatePath(`/t/${m.tournamentId}/standings`);
  revalidatePath(`/t/${m.tournamentId}/cards`);
  return { ok: true };
}

/* --------------------------- delete tourney ------------------------ */

export async function deleteTournament(tournamentId: string): Promise<void> {
  await requireOwnedTournament(tournamentId);
  await db.delete(tournament).where(eq(tournament.id, tournamentId));
  revalidatePath("/");
}
