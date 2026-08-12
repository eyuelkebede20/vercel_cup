import { GoogleGenerativeAI } from "@google/generative-ai";

const key = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(key);

const responseSchema = {
  type: "OBJECT",
  properties: {
    status: { type: "STRING", format: "enum", enum: ["collecting", "ready"] },
    reply: { type: "STRING" },
    payload: {
      type: "OBJECT",
      nullable: true,
      properties: {
        tournamentName: { type: "STRING" },
        teamCount: { type: "NUMBER" },
        playersPerTeam: { type: "NUMBER" },
        doubleRound: { type: "BOOLEAN" },
        generateFixtures: { type: "BOOLEAN" },
        teamNames: { type: "ARRAY", items: { type: "STRING" } },
        historicalMatches: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              homeTeam: { type: "STRING" },
              awayTeam: { type: "STRING" },
              homeScore: { type: "NUMBER" },
              awayScore: { type: "NUMBER" },
            },
            required: ["homeTeam", "awayTeam", "homeScore", "awayScore"]
          }
        },
      },
      required: ["tournamentName", "teamCount", "playersPerTeam", "doubleRound", "generateFixtures", "teamNames"],
    },
  },
  required: ["status", "reply", "payload"],
};

const model = genAI.getGenerativeModel({
  model: "gemini-flash-latest",
  systemInstruction: `You are MatchDay's setup assistant. Your only job is to collect the information needed to
create a round-robin football league through short, friendly conversation.

Required: tournamentName, teamCount (integer 2-32), playersPerTeam (integer 1-30).
Optional: doubleRound (true if teams play home AND away; default false), teamNames (a list), generateFixtures (boolean, whether to auto-generate a round-robin schedule; default true), historicalMatches (a list of objects with homeTeam, awayTeam, homeScore, awayScore for already played games).

Rules:
- Ask for ONE missing field at a time. Keep replies to a sentence or two.
- Never invent values. If the user is vague ("a few teams"), ask for a number.
- Accept corrections at any point ("actually make it 10 teams").
- When every REQUIRED field is known: status="ready", a one-line confirmation in "reply",
  and fill "payload". Otherwise status="collecting", next question in "reply", payload=null.
- Respond with the JSON object only — no markdown, no extra text.`,
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: responseSchema as any,
    temperature: 0.4,
  },
});

async function main() {
  const contents = [
    {
      role: "user",
      parts: [{ text: "There are Five teams, Aerospace, Development, Emerging, Embeded and Cybersecurity and currently 3 games are held, Cyber - Development (0 -1), Aerospace - Embeded (2-2) and Cybersecurity - Emerging(4-1) now constract the league" }]
    },
    {
      role: "model",
      parts: [{ text: `{"status":"collecting","reply":"Great, I've got the 5 teams and past matches recorded! What would you like to name your tournament?","payload":null}` }]
    },
    {
      role: "user",
      parts: [{ text: "Tech Cup, 11 players per team." }]
    }
  ];
  try {
    const result = await model.generateContent({ contents });
    console.log(result.response.text());
  } catch (e) {
    console.error(e);
  }
}

main();
