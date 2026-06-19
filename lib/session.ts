import { headers } from "next/headers";
import { auth } from "./auth";

// Server-side session helpers. Use in Server Components, Server Actions, and
// route handlers to read the current user and enforce ownership.

export async function getCurrentUser() {
  const data = await auth.api.getSession({ headers: await headers() });
  return data?.user ?? null;
}

export async function requireUser() {
  const u = await getCurrentUser();
  if (!u) throw new Error("UNAUTHORIZED");
  return u;
}
