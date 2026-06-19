import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Node runtime — postgres.js + better-auth need it (App Router defaults to Node).
export const { GET, POST } = toNextJsHandler(auth);
