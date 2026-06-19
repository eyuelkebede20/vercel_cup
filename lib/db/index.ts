import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Runtime uses the Supabase transaction pooler (port 6543). The pooler is in
// transaction mode and can't reuse prepared statements, so prepare:false is
// mandatory — this is the #1 thing that breaks on Vercel otherwise.
//
// We don't throw on a missing URL at import time (that would break `next build`
// without env). postgres.js connects lazily, so a missing/placeholder URL only
// fails when a query actually runs — set DATABASE_URL before using the app.
const connectionString =
  process.env.DATABASE_URL ?? "postgresql://placeholder:placeholder@localhost:5432/placeholder";

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL is not set — DB queries will fail. Copy .env.example to .env.local.");
}

// Reuse the client across hot reloads / serverless invocations.
const globalForDb = globalThis as unknown as {
  pg?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.pg ?? postgres(connectionString, { prepare: false });

if (process.env.NODE_ENV !== "production") globalForDb.pg = client;

export const db = drizzle(client, { schema });
export { schema };
