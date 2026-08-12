import { NextResponse } from "next/server";
import { z } from "zod";
import { runChatTurn, type ChatMessage } from "@/lib/chat";
import { getCurrentUser } from "@/lib/session";

// Node runtime — the Gemini key stays server-side; the browser never talks to
// Google directly.
export const runtime = "nodejs";

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(50),
});

export async function POST(req: Request) {
  // Creation is owner-gated; the chat that drives it requires a session too.
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let parsed;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  try {
    const turn = await runChatTurn(parsed.messages as ChatMessage[]);
    return NextResponse.json(turn);
  } catch (err) {
    console.error("chat turn failed", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
