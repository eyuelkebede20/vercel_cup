import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db";
import { user, session, account, verification } from "./db/schema";

// Origins allowed to POST to the auth endpoints. better-auth rejects others
// with a 403 (CSRF protection). We allow local dev, the configured base URL,
// and any Vercel deployment/preview URL so sign-up works whether you open the
// clean production domain or a per-deploy *.vercel.app URL.
const trustedOrigins = [
  "http://localhost:3000",
  "http://localhost:3100",
  "https://*.vercel.app",
];
if (process.env.BETTER_AUTH_URL) trustedOrigins.push(process.env.BETTER_AUTH_URL);

// better-auth server instance. Uses the Supabase DB through the Drizzle
// adapter (provider:"pg"). Email/password only — no Supabase Auth.
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins,
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
