// Single source of truth for the app's name — "Vercel_CUP" is a working name.
// Rename here and it changes everywhere.
export const APP_NAME = "MatchDay";
export const APP_TAGLINE = "Build a league. Log goals. Watch the table move.";

// Domain limits, shared by zod schemas and the AI contract.
export const MIN_TEAMS = 2;
export const MAX_TEAMS = 32;
export const MIN_PLAYERS_PER_TEAM = 1;
export const MAX_PLAYERS_PER_TEAM = 30;
