# CLAUDE.md — MatchDay

> Football tournament & fixture manager. Build a tournament, name the teams, auto-generate the
> fixtures, register players, log goals from a phone-friendly admin panel, see a live standings
> table, and share clean fixture cards (exportable as images).
> Also browses real-world league data (fixtures + standings) with the same card layout.
>
> A **Gemini-powered setup assistant** lets users create everything by chatting — "create me a
> league" → it asks how many teams, players, etc., then builds it.
>
> **Deploys to Vercel, backed by Supabase Postgres.** `Vercel_CUP` is a working name — keep it in
> one constant (`APP_NAME`) so it's renamable in one place.

---

## 1. What we're building (the core loop)

The whole app is one guided flow. There are **two ways in**: the manual setup wizard, or the AI
chat assistant (section 8). Both end up calling the _same_ creation logic.

1. **Setup** — admin picks **number of teams** and **players per team**. These two numbers seed everything.
2. **Name teams** — render that many editable team "boxes". Each is inline-renamable (click → edit → blur/Enter saves). No modal.
3. **Generate fixtures** — a **"Do Fixtures"** button at the bottom runs a single round-robin so every team plays every other once. Result renders as a readable fixture list/grid grouped by round.
4. **Register players** — once fixtures exist, the admin selects a team and adds players: **name + shirt number (required), email (optional)**. The email field is captured but **not used for sending in the demo** (see §12).
5. **Log results (admin panel)** — per match, the admin enters the score. For **each goal**, an input asks _who scored_ — the admin **taps a shirt number** (no name typing). Number → player is resolved internally.
6. **Standings** — a live table derived from logged results (W/D/L, GF, GA, GD, Pts) updates as goals are entered. This is the payoff screen.
7. **Share cards** — generate shareable **daisyUI cards** for any fixture/result, exportable as a **PNG** to drop in a chat group.
8. **Discover** — a public section fetches **real leagues' fixtures + standings** from an external API, rendered with the _same card components_ so the app feels alive when visitors browse.

> Steps 1–7 are the admin's own tournament. Step 8 is read-only public data. They share UI, not data sources.

**Format is locked to round-robin league play** (everyone plays everyone). No knockout brackets in this build — different generator, different UI, and doing both is a hackathon trap.

---

## 2. Tech stack (locked)

| Concern       | Choice                                   | Why                                                                                                                |
| ------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Framework     | **Next.js (App Router) + TypeScript**    | Full-stack in one repo; API routes for auth, AI, and data proxy. First-class on Vercel.                            |
| Hosting       | **Vercel**                               | Zero-config Next.js deploys; env vars + preview deploys per PR.                                                    |
| Database      | **Supabase Postgres**                    | Hosted Postgres that survives serverless (a local SQLite file would NOT — Vercel's FS is ephemeral/read-only).     |
| ORM           | **Drizzle ORM** (postgres.js driver)     | Typed schema + migrations; works with the Supabase pooler.                                                         |
| Styling       | **Tailwind CSS + daisyUI**               | daisyUI cards are required; clean components, little custom CSS.                                                   |
| Auth          | **better-auth**                          | Required. Email/password admin; sessions over cookies; uses the Supabase DB via the Drizzle adapter.               |
| AI assistant  | **Google Gemini** (a fast _Flash_ model) | Conversational setup; structured-JSON output drives real creation. Verify the current model name in Google's docs. |
| Card export   | **html-to-image**                        | Render a card → downloadable PNG. (Optional: upload to Supabase Storage for a shareable URL.)                      |
| External data | **football-data.org** (free tier)        | Free competitions/matches/standings. API-Football is the fallback.                                                 |
| Validation    | **zod**                                  | One schema per form, reused client + server + as the AI output contract.                                           |

> **Supabase here is the database (and optionally Storage/Realtime), NOT the auth provider.**
> Auth stays in better-auth. Don't wire up Supabase Auth — it would duplicate better-auth.

Do **not** add state libraries, component kits beyond daisyUI, or extra CSS frameworks.

---

## 3. Conventions

- **TypeScript everywhere**, `strict: true`. No `any` — use `unknown` + narrowing.
- **Server Components by default.** Add `"use client"` only for interactive pieces (inline rename, goal logger, chat, forms).
- **Server Actions** for all mutations (create tournament, save players, log goals). Route handlers only for auth, the AI chat endpoint, and the external-data proxy.
- **Node runtime, not Edge**, on any route touching the DB or better-auth (postgres.js + better-auth need Node). App Router defaults to Node — just don't opt those routes into the Edge runtime.
- **Validate on the server too** — never trust client-validated input, and _especially_ never trust raw AI output. Everything passes through zod before touching the DB.
- **No secrets in client code.** Gemini key, football API key, and the DB URL live server-side; the browser calls our own `/api/chat` and `/api/leagues/*` proxies. The only public keys are the Supabase URL + anon key, and only if we use Storage/Realtime from the client.
- **One source of truth for creation** — manual wizard and AI assistant both call the same `createTournament` server action.
- **One source of truth for cards** — `<FixtureCard>` / `<ResultCard>` are used by both the tournament and the discover section.

---

## 4. Project structure

```
app/
  layout.tsx                 # APP_NAME, daisyui theme, nav
  page.tsx                   # landing / discover entry
  (auth)/
    sign-in/page.tsx
    sign-up/page.tsx
  setup/page.tsx             # steps 1-3: counts -> name teams -> "Do Fixtures"
  chat/page.tsx              # AI setup assistant (section 8)
  t/[tournamentId]/
    page.tsx                 # fixtures overview (the "perfect view")
    standings/page.tsx       # live derived table
    teams/[teamId]/page.tsx  # register players
    admin/page.tsx           # log scores + goals (auth required)
    cards/page.tsx           # shareable + PNG-exportable cards
  leagues/
    page.tsx                 # pick a real competition
    [code]/page.tsx          # its fixtures + standings (same cards)
  api/
    auth/[...all]/route.ts   # better-auth handler (Node runtime)
    chat/route.ts            # server-side Gemini proxy (section 8)
    leagues/[...path]/route.ts  # server-side proxy to football-data.org

components/
  FixtureCard.tsx · ResultCard.tsx
  TeamBox.tsx                # inline-renamable team box (client)
  GoalLogger.tsx             # number-grid scorer picker (client)
  PlayerForm.tsx
  ChatSetup.tsx              # chat UI; sends history to /api/chat (client)
  CardExportButton.tsx       # html-to-image -> download PNG (client)

lib/
  auth.ts                    # better-auth server instance (Drizzle adapter, pg)
  auth-client.ts             # better-auth client hooks
  db/
    index.ts                 # drizzle client over postgres.js (pooler, prepare:false)
    schema.ts                # pgTable definitions (section 5)
  fixtures.ts                # round-robin generator (section 6)
  standings.ts               # derive table from matches + goals
  leagues.ts                 # external API fetch + normalize (section 7)
  chat.ts                    # Gemini call + system prompt + response schema (section 8)
  actions.ts                 # createTournament + other server actions
  validation.ts              # zod schemas (incl. the AI payload contract)
  constants.ts               # APP_NAME, etc.

drizzle.config.ts            # points at DIRECT_URL for migrations
```

---

## 5. Data model (Drizzle / Postgres `pgTable`)

better-auth owns `user`, `session`, `account`, `verification` (generate via the better-auth CLI). Our domain tables:

```ts
tournament      { id (uuid pk), name (text), ownerId -> user.id, teamCount (int),
                  playersPerTeam (int), doubleRound (bool default false), createdAt (timestamptz) }

team            { id (uuid pk), tournamentId -> tournament.id, name (text), createdAt }

player          { id (uuid pk), teamId -> team.id, name (text), number (int), email (text null) }
//   UNIQUE(teamId, number) — a shirt number is unique within its team. This makes
//   "tap the number, not the name" unambiguous when logging a goal.

match           { id (uuid pk), tournamentId, round (int), homeTeamId -> team.id, awayTeamId -> team.id,
                  kickoffAt (timestamptz null), homeScore (int null), awayScore (int null),
                  status: 'scheduled' | 'played' }

goal            { id (uuid pk), matchId -> match.id, scorerId -> player.id, teamId -> team.id, minute (int null) }
//   Goals are the source of truth; derive homeScore/awayScore from goal counts per side
//   (or store the score and validate it equals the counts).
```

**Standings are derived, not stored** (`lib/standings.ts`): walk played matches, award 3/1/0,
accumulate GF/GA, sort by Pts → GD → GF. Recompute on read; cheap at hackathon scale.

Notes:

- Use `on delete cascade` on the FKs so deleting a tournament cleans up teams → players → matches → goals.
- `playersPerTeam` is the **target** size shown in the player form; nudge, don't hard-block.

---

## 6. Fixture generation (`lib/fixtures.ts`)

Single round-robin via the **circle method**:

- Take the team IDs. If odd count, add a `BYE` placeholder so it's even.
- Fix the first team; rotate the rest each round.
- For `n` teams → `n-1` rounds, `n/2` matches per round. Skip any match against `BYE`.
- If `tournament.doubleRound` is true, append the schedule again with home/away swapped.

```ts
function generateRoundRobin(teamIds: string[], double = false): Array<{ round: number; home: string; away: string }>;
```

Run once when **"Do Fixtures"** is pressed, persist all `match` rows, redirect to `/t/[id]`. Regenerating warns before clearing existing matches/goals.

---

## 7. External league data (`lib/leagues.ts` + `/api/leagues`)

- The browser **never** holds the API key. It calls our proxy: `/api/leagues/competitions`, `/api/leagues/[code]/matches`, `/api/leagues/[code]/standings`.
- The proxy adds `X-Auth-Token` from `process.env.FOOTBALL_DATA_KEY`, fetches football-data.org, and **normalizes** into the shapes our cards expect:
  - match → `{ id, kickoffAt, home:{name,crest,score?}, away:{name,crest,score?}, status }`
  - standing row → `{ position, team, played, won, drawn, lost, points }`
- **Cache** with Next `revalidate` (60–300s) — free tiers are rate-limited.
- Normalizing here is what lets `<FixtureCard>` render a real match and a local one identically.

> Only feature depending on a service we don't control. If it misbehaves during the hack, **cut it without guilt.**

---

## 8. AI setup assistant (`lib/chat.ts` + `/api/chat` + `ChatSetup.tsx`)

Conversational tournament creation. User types intent ("create me a league"), the assistant asks
for what's missing, and once complete it returns a **structured payload** fed into the normal
`createTournament` action.

### Hard rules

- **Key stays server-side.** Browser POSTs to `/api/chat`; that route holds `GEMINI_API_KEY` and calls Gemini. The browser never talks to Google directly. (Node runtime.)
- **The model never writes to the DB.** It only produces a payload, validated by zod (`tournamentSetupSchema`), then passed to the same `createTournament` server action the manual wizard uses. The bot can do nothing the manual flow can't.
- **Gemini is stateless per call** — send the **full message history** every request. Keep history in React state in `ChatSetup`.

### Flow

1. User message → `POST /api/chat` with `{ messages: [...history] }`.
2. Server prepends the system prompt and calls Gemini with a **forced JSON response schema**.
3. Gemini returns either:
   - `status:"collecting"` → show `reply` (next question), wait for the user.
   - `status:"ready"` → show a **confirmation** ("Create an 8-team league 'Sunday Cup', 5 players each?"). On confirm: validate `payload` → `createTournament(payload)` → generate fixtures → redirect to `/t/[id]`.
4. Stretch: keep assisting after creation (rename a team, log a goal) — but **scope the demo to creation**.

### Structured output contract (zod = `aiTurnSchema`; Gemini `responseMimeType:"application/json"` + `responseSchema`)

```ts
{
  status: "collecting" | "ready",
  reply: string,            // next question, or a confirmation summary
  payload: {                // meaningful only when status === "ready"; null otherwise
    tournamentName: string,
    teamCount: number,      // 2..32
    playersPerTeam: number, // 1..30
    doubleRound: boolean,   // default false
    teamNames: string[]     // optional; [] if unnamed
  } | null
}
```

### Pre-configured system prompt (draft — keep in `lib/chat.ts`)

```
You are MatchDay's setup assistant. Your only job is to collect the information needed to
create a round-robin football league through short, friendly conversation.

Required: tournamentName, teamCount (integer 2-32), playersPerTeam (integer 1-30).
Optional: doubleRound (true if teams play home AND away; default false), teamNames (a list).

Rules:
- Ask for ONE missing field at a time. Keep replies to a sentence or two.
- Never invent values. If the user is vague ("a few teams"), ask for a number.
- Accept corrections at any point ("actually make it 10 teams").
- If asked for something out of scope (knockouts, other sports), say you only set up
  round-robin football leagues, and steer back.
- When every REQUIRED field is known: status="ready", a one-line confirmation in "reply",
  and fill "payload". Otherwise status="collecting", next question in "reply", payload=null.
- Respond with the JSON object only — no markdown, no extra text.
```

Forcing JSON + routing through the existing action means a confused/adversarial model can't corrupt data — worst case zod rejects it and the user retries.

---

## 9. Auth (better-auth)

- `lib/auth.ts`: better-auth server instance, **Drizzle adapter with `provider:"pg"`**, email/password enabled. Set `baseURL` from `BETTER_AUTH_URL`.
- `app/api/auth/[...all]/route.ts`: mount the handler (Node runtime).
- `lib/auth-client.ts`: `createAuthClient` for sign-in/up and `useSession` in client components.
- Generate better-auth's tables with its CLI, then include them in your Drizzle migration.
- **Protect admin surfaces**: `/t/[id]/admin`, chat-driven creation, and all mutating server actions must check the session AND that the user owns the tournament.
- Discover/browse is fully public; only creating/editing needs sign-in.

---

## 10. Deployment — Vercel + Supabase

### Database client (`lib/db/index.ts`)

Use **postgres.js** with the Supabase **transaction pooler** at runtime, prepared statements OFF
(the pooler is in transaction mode and can't reuse them):

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const client = postgres(process.env.DATABASE_URL!, { prepare: false });
export const db = drizzle(client, { schema });
```

### The connection-string gotcha (this is the #1 thing that breaks on Vercel)

Supabase gives you two URLs — use the right one for each job:

- **`DATABASE_URL`** → the **pooler** (host `...pooler.supabase.com`, port **6543**, transaction mode). App runtime on Vercel uses this. `prepare:false` is mandatory.
- **`DIRECT_URL`** → the **direct** connection (port **5432**). Migrations only. `drizzle.config.ts` points here. Never use this from serverless runtime.

### Migrations

Run from your machine or CI against `DIRECT_URL` — **not** from a serverless function:

```
npx drizzle-kit generate   # create SQL from schema changes
npx drizzle-kit migrate    # apply to Supabase (uses DIRECT_URL)
```

For the hackathon, `npx drizzle-kit push` straight to Supabase is fine to move fast.

### Env vars (set in `.env.local` and in the Vercel dashboard)

```
DATABASE_URL=postgresql://postgres.<ref>:<pwd>@aws-0-<region>.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres:<pwd>@db.<ref>.supabase.co:5432/postgres
BETTER_AUTH_SECRET=<random 32+ chars>
BETTER_AUTH_URL=https://<your-app>.vercel.app   # http://localhost:3000 in dev
GEMINI_API_KEY=...
FOOTBALL_DATA_KEY=...
# only if using Supabase Storage/Realtime from the client:
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Vercel notes

- Import the repo, set all env vars (apply to Production + Preview), deploy.
- Set `BETTER_AUTH_URL` to the deployed URL or auth callbacks/cookies will misbehave.
- Keep DB/auth routes on the **Node** runtime (don't add `export const runtime = "edge"`).
- Preview deploys share the same Supabase DB unless you point them at a separate project.

### Optional Supabase wins (stretch — only if core is done)

- **Realtime:** subscribe to `match`/`goal` changes so viewers see scores and standings update live without refreshing — fits the "people come to check things" goal nicely.
- **Storage:** upload exported card PNGs to a public bucket to get a real shareable URL instead of a local download.

---

## 11. UI / UX rules — keep it clean

- Use the **daisyUI `card`** for every fixture and result. One `data-theme` on `<html>`; one calm theme (e.g. `corporate`/`winter`) — don't mix.
- **Generous whitespace, one accent color, no gradient pile-ups.** Let cards breathe.
- Team boxes: quiet inputs, edit in place, save on blur/Enter — no save buttons everywhere.
- **Goal logger is the moment to over-invest.** That team's shirt **numbers as big tappable buttons** (a grid), not a name dropdown — tapping a number records the goal and the score updates live. Mobile-first; admins log on a phone pitchside. Judges remember the tactile feel.
- Fixtures "perfect view": grouped by round, home/away in consistent columns so it scans like a real schedule.
- Standings: clean table, highlight the leader row.
- Share cards: fixed aspect ratio, one-tap **PNG export** — a card for the group chat lands harder than a webpage.
- Chat: simple message thread + input; a tiny "collected: teams, players…" affordance is a nice optional touch.
- Empty states matter — every screen tells the admin the next action.

---

## 12. Scope & cut-lines

- **In:** AI/manual setup, fixtures, players, goal logging, standings, shareable PNG cards.
- **Out for the demo:** **email reminders** — keep the optional email _field_, don't build sending (needs a provider + scheduler for zero demo payoff).
- **Droppable under time pressure:** real-leagues discover (external dependency); Realtime/Storage extras.

---

## 13. Build order (hackathon milestones)

1. Scaffold Next.js + Tailwind + daisyUI; `APP_NAME`, theme, nav shell.
2. Create Supabase project; wire `lib/db` (pooler + prepare:false) + `drizzle.config.ts` (DIRECT_URL).
3. Drizzle schema + `push` to Supabase; generate better-auth tables.
4. better-auth (sign-up/in, session, owner checks).
5. **Manual setup**: counts → team boxes (inline rename) → persist via `createTournament`.
6. **Do Fixtures**: round-robin generator + persist matches → fixtures overview with `<FixtureCard>`.
7. **Player registration** per team (name + number + optional email, zod-validated).
8. **Admin panel**: enter score + `GoalLogger` (number-grid) → derive/validate score.
9. **Standings** derived view.
10. **Shareable cards + PNG export.**
11. **Deploy to Vercel early** (around here, not at the end) — catch env/runtime issues with time to fix.
12. **AI setup assistant**: `/api/chat` + JSON contract + `ChatSetup`, routed into `createTournament`.
13. **Leagues discover**; then polish + optional Realtime/Storage.

> Deploy to Vercel by step 11 at the latest — a deploy that breaks at midnight is the classic
> hackathon loss. If time runs short, ship through step 10 (complete loop + standings) on a live
> URL. Step 12 (chatbot) is the most demo-impressive — prioritize it over step 13.

## 14. Commands

```
npm run dev                 # local dev
npx drizzle-kit generate    # SQL from schema changes
npx drizzle-kit migrate     # apply migrations (uses DIRECT_URL)
npx drizzle-kit push        # fast path: push schema straight to Supabase
npm run build && npm start  # production build locally
# deploy: push to the connected git branch -> Vercel builds automatically
```

---

**Definition of done for the demo:** on the live Vercel URL — open the chat → say "create a
league" → answer a couple of questions → it builds an 8-team round-robin → rename a team → add
players with numbers → tap a number to log a goal and watch the standings move → export a clean
PNG card → (bonus) browse a real league with the identical card layout.
