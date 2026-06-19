/**
 * Seed a demo league so the app has something to show without manual entry.
 *
 *   npm run db:seed
 *
 * Creates (idempotently) a demo admin, a 4-team "Sunday Cup", full squads, a
 * round-robin schedule, and a couple of played rounds so standings + cards are
 * populated. Re-running wipes and recreates the demo tournament.
 *
 * Requires DATABASE_URL + BETTER_AUTH_SECRET in the environment (the npm script
 * loads .env.local via --env-file).
 */
import { eq, and } from "drizzle-orm";
import { db } from "../lib/db";
import { tournament, team, player, match, goal } from "../lib/db/schema";
import { generateRoundRobin } from "../lib/fixtures";
import { auth } from "../lib/auth";

const DEMO = {
  name: "Demo Admin",
  email: "demo@matchday.app",
  password: "demo-password-123",
};

const TEAMS = ["Lions", "Sharks", "Eagles", "Wolves"];
const FIRST_NAMES = ["Alex", "Sam", "Jordan", "Casey", "Riley"];

async function ensureDemoUser(): Promise<string> {
  // Try to create the user; if it already exists, sign in to fetch the id.
  try {
    const res = await auth.api.signUpEmail({ body: DEMO });
    if (res?.user?.id) return res.user.id;
  } catch {
    // already exists — fall through
  }
  const res = await auth.api.signInEmail({ body: DEMO });
  if (!res?.user?.id) throw new Error("Could not create or sign in demo user.");
  return res.user.id;
}

async function main() {
  console.log("Seeding demo data…");
  const ownerId = await ensureDemoUser();
  console.log("  demo admin:", DEMO.email);

  // Idempotent: clear any previous demo tournament (cascade handles children).
  const existing = await db
    .select({ id: tournament.id })
    .from(tournament)
    .where(
      and(eq(tournament.ownerId, ownerId), eq(tournament.name, "Sunday Cup")),
    );
  for (const t of existing) {
    await db.delete(tournament).where(eq(tournament.id, t.id));
  }

  // Tournament.
  const [t] = await db
    .insert(tournament)
    .values({
      name: "Sunday Cup",
      ownerId,
      teamCount: TEAMS.length,
      playersPerTeam: 5,
      doubleRound: false,
    })
    .returning({ id: tournament.id });

  // Teams.
  const teamRows = await db
    .insert(team)
    .values(TEAMS.map((name) => ({ tournamentId: t.id, name })))
    .returning({ id: team.id, name: team.name });

  // Players: numbers 1-5 per team.
  const playersByTeam = new Map<string, { id: string; number: number }[]>();
  for (const tr of teamRows) {
    const rows = await db
      .insert(player)
      .values(
        FIRST_NAMES.map((fn, i) => ({
          teamId: tr.id,
          name: `${fn} ${tr.name.slice(0, 3)}`,
          number: i + 1,
        })),
      )
      .returning({ id: player.id, number: player.number });
    playersByTeam.set(tr.id, rows);
  }

  // Fixtures.
  const fixtures = generateRoundRobin(teamRows.map((r) => r.id), false);
  const matchRows = await db
    .insert(match)
    .values(
      fixtures.map((f) => ({
        tournamentId: t.id,
        round: f.round,
        homeTeamId: f.home,
        awayTeamId: f.away,
      })),
    )
    .returning({
      id: match.id,
      round: match.round,
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
    });

  const maxRound = Math.max(...matchRows.map((m) => m.round));

  // Play every round except the last, so there are also upcoming fixtures.
  // A curated set of scorelines — deterministic (stable reruns) and lively
  // (wins, draws, and goals so standings + scorer cards look real).
  const SCORELINES: [number, number][] = [
    [3, 1],
    [2, 2],
    [0, 2],
    [1, 1],
    [4, 0],
    [2, 3],
  ];

  let played = 0;
  for (const m of matchRows) {
    if (m.round === maxRound) continue;

    const [homeScore, awayScore] = SCORELINES[played % SCORELINES.length];

    const pick = (teamId: string, n: number) => {
      const squad = playersByTeam.get(teamId)!;
      return Array.from({ length: n }, (_, k) => ({
        matchId: m.id,
        scorerId: squad[k % squad.length].id,
        teamId,
        minute: null as number | null,
      }));
    };

    const goals = [
      ...pick(m.homeTeamId, homeScore),
      ...pick(m.awayTeamId, awayScore),
    ];
    if (goals.length > 0) await db.insert(goal).values(goals);

    await db
      .update(match)
      .set({ homeScore, awayScore, status: "played" })
      .where(eq(match.id, m.id));
    played++;
  }

  console.log(
    `  created "Sunday Cup": ${TEAMS.length} teams, ${matchRows.length} fixtures, ${played} played.`,
  );
  console.log("\nDone. Sign in as:");
  console.log(`  ${DEMO.email} / ${DEMO.password}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
