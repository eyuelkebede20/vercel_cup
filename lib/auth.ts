import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db";
import { user, session, account, verification } from "./db/schema";

// better-auth server instance. Uses the Supabase DB through the Drizzle
// adapter (provider:"pg"). Email/password only — no Supabase Auth.
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  emailAndPassword: {
    enabled: true,
    // Hackathon: no email provider wired, so don't gate on verification.
    requireEmailVerification: false,
  },
  // Ensures Set-Cookie headers flow through Server Actions.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
