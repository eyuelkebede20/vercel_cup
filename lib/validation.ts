import { z } from "zod";
import {
  MIN_TEAMS,
  MAX_TEAMS,
  MIN_PLAYERS_PER_TEAM,
  MAX_PLAYERS_PER_TEAM,
} from "./constants";

// One schema per form, reused client + server + as the AI output contract.

// The shared creation contract. Both the manual wizard and the AI assistant
// produce this shape, which feeds the single createTournament action.
export const tournamentSetupSchema = z.object({
  tournamentName: z.string().trim().min(1, "Name is required").max(80),
  teamCount: z.coerce.number().int().min(MIN_TEAMS).max(MAX_TEAMS),
  playersPerTeam: z.coerce
    .number()
    .int()
    .min(MIN_PLAYERS_PER_TEAM)
    .max(MAX_PLAYERS_PER_TEAM),
  doubleRound: z.coerce.boolean().default(false),
  generateFixtures: z.boolean().default(true),
  // Optional explicit names; pad/truncate to teamCount server-side.
  teamNames: z.array(z.string().trim().max(40)).default([]),
});

export type TournamentSetup = z.infer<typeof tournamentSetupSchema>;

// AI turn contract — Gemini is forced to return exactly this shape.
export const aiTurnSchema = z.object({
  status: z.enum(["collecting", "ready"]),
  reply: z.string(),
  payload: tournamentSetupSchema.nullable().default(null),
});

export type AiTurn = z.infer<typeof aiTurnSchema>;

// Player registration.
export const playerSchema = z.object({
  teamId: z.string().uuid(),
  name: z.string().trim().min(1, "Name is required").max(60),
  number: z.coerce.number().int().min(0).max(999),
  email: z.union([z.string().trim().email(), z.literal("")]).optional(),
});

export type PlayerInput = z.infer<typeof playerSchema>;

// Renaming a team inline.
export const renameTeamSchema = z.object({
  teamId: z.string().uuid(),
  name: z.string().trim().min(1).max(40),
});

// A single scorer pick when logging a result.
export const goalInputSchema = z.object({
  teamId: z.string().uuid(),
  scorerId: z.string().uuid(),
  minute: z.coerce.number().int().min(0).max(200).nullable().default(null),
});

// Logging a full result: the score plus the goals that produced it.
export const logResultSchema = z.object({
  matchId: z.string().uuid(),
  goals: z.array(goalInputSchema).default([]),
});

export type LogResultInput = z.infer<typeof logResultSchema>;

export const createMatchSchema = z.object({
  tournamentId: z.string().uuid(),
  homeTeamId: z.string().uuid(),
  awayTeamId: z.string().uuid(),
  round: z.coerce.number().int().min(1),
});

