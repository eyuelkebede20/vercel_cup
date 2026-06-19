// View-models shared by the local tournament and the public "discover"
// section, so <FixtureCard>/<ResultCard> render a real match and a local one
// identically. The leagues proxy normalizes external data into these shapes.

export type SideView = {
  name: string;
  crest?: string | null;
  score?: number | null;
};

export type MatchView = {
  id: string;
  kickoffAt?: string | null;
  home: SideView;
  away: SideView;
  status: "scheduled" | "played" | string;
  round?: number | null;
  competition?: string | null;
};

export type StandingView = {
  position: number;
  team: string;
  crest?: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor?: number | null;
  goalsAgainst?: number | null;
  goalDifference?: number | null;
  points: number;
};
