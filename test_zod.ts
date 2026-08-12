import { z } from "zod";

const goalInputSchema = z.object({
  teamId: z.string().uuid(),
  scorerId: z.string().uuid(),
  minute: z.number().int().min(1).max(120).nullable(),
});

const logResultSchema = z.object({
  matchId: z.string().uuid(),
  goals: z.array(goalInputSchema).default([]),
  homeScore: z.number().int().min(0).optional(),
  awayScore: z.number().int().min(0).optional(),
});

try {
  const parsed = logResultSchema.parse({
    matchId: "123e4567-e89b-12d3-a456-426614174000",
    goals: [],
    homeScore: 0,
    awayScore: 1,
  });
  console.log("Success:", parsed);
} catch (e) {
  console.error("Error:", e);
}
