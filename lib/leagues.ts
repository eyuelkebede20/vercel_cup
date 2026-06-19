import type { MatchView, StandingView } from "./types";

// External league data (football-data.org). The browser never holds the API
// key — server components call these helpers, and the /api/leagues proxy adds
// the X-Auth-Token. Everything is normalized into the SAME shapes our cards
// expect, so <FixtureCard> renders a real match and a local one identically.

const BASE = "https://api.football-data.org/v4";

// Free-tier friendly competition codes for the discover landing.
export const FEATURED_COMPETITIONS: { code: string; name: string }[] = [
  { code: "PL", name: "Premier League" },
  { code: "PD", name: "La Liga" },
  { code: "SA", name: "Serie A" },
  { code: "BL1", name: "Bundesliga" },
  { code: "FL1", name: "Ligue 1" },
  { code: "CL", name: "UEFA Champions League" },
];

export function isLeaguesConfigured(): boolean {
  return Boolean(process.env.FOOTBALL_DATA_KEY);
}

/* --------------------------- sample fallback ------------------------ */
// When FOOTBALL_DATA_KEY is unset (or the API errors), discover falls back to
// this baked-in "last week" data — rendered through the SAME cards, so the
// section still feels alive with zero external dependency.

export const SAMPLE_NOTICE =
  "Sample data — add FOOTBALL_DATA_KEY for live fixtures & standings.";

// Fixed dates (last week relative to this build) — no runtime clock needed.
const SAMPLE_MATCHES: MatchView[] = [
  {
    id: "s1",
    kickoffAt: "2026-06-13T14:00:00Z",
    status: "played",
    round: 37,
    competition: "Sample League",
    home: { name: "Arsenal", score: 3 },
    away: { name: "Chelsea", score: 1 },
  },
  {
    id: "s2",
    kickoffAt: "2026-06-13T16:30:00Z",
    status: "played",
    round: 37,
    competition: "Sample League",
    home: { name: "Manchester City", score: 2 },
    away: { name: "Liverpool", score: 2 },
  },
  {
    id: "s3",
    kickoffAt: "2026-06-14T13:00:00Z",
    status: "played",
    round: 37,
    competition: "Sample League",
    home: { name: "Newcastle", score: 0 },
    away: { name: "Tottenham", score: 1 },
  },
  {
    id: "s4",
    kickoffAt: "2026-06-20T14:00:00Z",
    status: "scheduled",
    round: 38,
    competition: "Sample League",
    home: { name: "Liverpool", score: null },
    away: { name: "Arsenal", score: null },
  },
  {
    id: "s5",
    kickoffAt: "2026-06-20T16:30:00Z",
    status: "scheduled",
    round: 38,
    competition: "Sample League",
    home: { name: "Chelsea", score: null },
    away: { name: "Manchester City", score: null },
  },
];

const SAMPLE_STANDINGS: StandingView[] = [
  { position: 1, team: "Manchester City", played: 37, won: 27, drawn: 7, lost: 3, goalsFor: 92, goalsAgainst: 32, goalDifference: 60, points: 88 },
  { position: 2, team: "Arsenal", played: 37, won: 26, drawn: 6, lost: 5, goalsFor: 84, goalsAgainst: 33, goalDifference: 51, points: 84 },
  { position: 3, team: "Liverpool", played: 37, won: 23, drawn: 9, lost: 5, goalsFor: 81, goalsAgainst: 40, goalDifference: 41, points: 78 },
  { position: 4, team: "Tottenham", played: 37, won: 19, drawn: 6, lost: 12, goalsFor: 70, goalsAgainst: 58, goalDifference: 12, points: 63 },
  { position: 5, team: "Newcastle", played: 37, won: 17, drawn: 10, lost: 10, goalsFor: 62, goalsAgainst: 44, goalDifference: 18, points: 61 },
  { position: 6, team: "Chelsea", played: 37, won: 16, drawn: 9, lost: 12, goalsFor: 58, goalsAgainst: 49, goalDifference: 9, points: 57 },
];

export function sampleMatches(): MatchView[] {
  return SAMPLE_MATCHES;
}

export function sampleStandings(): StandingView[] {
  return SAMPLE_STANDINGS;
}

async function fd<T>(path: string, revalidate = 120): Promise<T> {
  const key = process.env.FOOTBALL_DATA_KEY;
  if (!key) throw new Error("FOOTBALL_DATA_KEY is not set.");
  const res = await fetch(`${BASE}${path}`, {
    headers: { "X-Auth-Token": key },
    next: { revalidate },
  });
  if (!res.ok) {
    throw new Error(`football-data.org responded ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/* ----------------------------- normalizers -------------------------- */

type FdMatch = {
  id: number;
  utcDate: string;
  status: string;
  matchday: number | null;
  competition?: { name?: string };
  homeTeam: { name: string; crest?: string | null };
  awayTeam: { name: string; crest?: string | null };
  score: { fullTime: { home: number | null; away: number | null } };
};

function normalizeMatch(m: FdMatch): MatchView {
  const played = m.status === "FINISHED";
  return {
    id: String(m.id),
    kickoffAt: m.utcDate,
    status: played ? "played" : "scheduled",
    round: m.matchday,
    competition: m.competition?.name ?? null,
    home: {
      name: m.homeTeam.name,
      crest: m.homeTeam.crest ?? null,
      score: m.score.fullTime.home,
    },
    away: {
      name: m.awayTeam.name,
      crest: m.awayTeam.crest ?? null,
      score: m.score.fullTime.away,
    },
  };
}

type FdStandingRow = {
  position: number;
  team: { name: string; crest?: string | null };
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
};

function normalizeStandingRow(r: FdStandingRow): StandingView {
  return {
    position: r.position,
    team: r.team.name,
    crest: r.team.crest ?? null,
    played: r.playedGames,
    won: r.won,
    drawn: r.draw,
    lost: r.lost,
    goalsFor: r.goalsFor,
    goalsAgainst: r.goalsAgainst,
    goalDifference: r.goalDifference,
    points: r.points,
  };
}

/* ------------------------------- public ----------------------------- */

export async function getCompetitionMatches(code: string): Promise<MatchView[]> {
  const data = await fd<{ matches: FdMatch[] }>(
    `/competitions/${code}/matches?status=SCHEDULED,FINISHED`,
    180,
  );
  // Trim to a reasonable window so a card grid stays browseable.
  return data.matches.slice(0, 24).map(normalizeMatch);
}

export async function getCompetitionStandings(
  code: string,
): Promise<StandingView[]> {
  const data = await fd<{ standings: { type: string; table: FdStandingRow[] }[] }>(
    `/competitions/${code}/standings`,
    300,
  );
  const total = data.standings.find((s) => s.type === "TOTAL") ?? data.standings[0];
  return (total?.table ?? []).map(normalizeStandingRow);
}

export async function getCompetitionName(code: string): Promise<string> {
  const known = FEATURED_COMPETITIONS.find((c) => c.code === code);
  if (known) return known.name;
  try {
    const data = await fd<{ name: string }>(`/competitions/${code}`, 86400);
    return data.name;
  } catch {
    return code;
  }
}
