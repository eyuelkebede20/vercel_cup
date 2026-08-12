import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import {
  MIN_TEAMS,
  MAX_TEAMS,
  MIN_PLAYERS_PER_TEAM,
  MAX_PLAYERS_PER_TEAM,
} from "./constants";
import { aiTurnSchema, type AiTurn } from "./validation";

export type ChatMessage = { role: "user" | "assistant"; content: string };

// A fast Flash model drives the conversational setup. Verify the current model
// name in Google's docs; override with GEMINI_MODEL if needed.
const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

const SYSTEM_PROMPT = `You are MatchDay's setup assistant. Your only job is to collect the information needed to
create a round-robin football league through short, friendly conversation.

Required: tournamentName, teamCount (integer ${MIN_TEAMS}-${MAX_TEAMS}), playersPerTeam (integer ${MIN_PLAYERS_PER_TEAM}-${MAX_PLAYERS_PER_TEAM}).
Optional: doubleRound (true if teams play home AND away; default false), teamNames (a list), generateFixtures (boolean, whether to auto-generate a round-robin schedule; default true).

Rules:
- Ask for ONE missing field at a time. Keep replies to a sentence or two.
- Never invent values. If the user is vague ("a few teams"), ask for a number.
- Accept corrections at any point ("actually make it 10 teams").
- If asked for something out of scope (knockouts, other sports), say you only set up
  round-robin football leagues, and steer back.
- When every REQUIRED field is known: status="ready", a one-line confirmation in "reply",
  and fill "payload". Otherwise status="collecting", next question in "reply", payload=null.
- Respond with the JSON object only — no markdown, no extra text.`;

// Forced response schema — Gemini must return exactly this shape. Routing it
// through zod + the existing createTournament action means a confused or
// adversarial model can't corrupt data; worst case zod rejects and the user retries.
const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    status: { type: SchemaType.STRING, format: "enum", enum: ["collecting", "ready"] },
    reply: { type: SchemaType.STRING },
    payload: {
      type: SchemaType.OBJECT,
      nullable: true,
      properties: {
        tournamentName: { type: SchemaType.STRING },
        teamCount: { type: SchemaType.NUMBER },
        playersPerTeam: { type: SchemaType.NUMBER },
        doubleRound: { type: SchemaType.BOOLEAN },
        generateFixtures: { type: SchemaType.BOOLEAN },
        teamNames: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      },
      required: ["tournamentName", "teamCount", "playersPerTeam", "doubleRound", "generateFixtures", "teamNames"],
    },
  },
  required: ["status", "reply", "payload"],
} as const;

export async function runChatTurn(messages: ChatMessage[]): Promise<AiTurn> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set.");

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      responseSchema: responseSchema as any,
      temperature: 0.4,
    },
  });

  // Gemini is stateless per call — we send the full history every request.
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const result = await model.generateContent({ contents });
  const text = result.response.text();

  // Validate against our zod contract before trusting anything.
  return aiTurnSchema.parse(JSON.parse(text));
}
