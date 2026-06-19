# MatchDay

Football tournament & fixture manager — build a round-robin league, name teams,
auto-generate fixtures, register players, log goals from a phone-friendly admin
panel, watch a live standings table, and export clean share cards as PNGs.
Plus an AI setup assistant and a "discover" section for real-world leagues.

Built per [`claude.md`](./claude.md). Stack: **Next.js (App Router) + TypeScript,
Tailwind + daisyUI, Drizzle ORM over Supabase Postgres, better-auth, Google Gemini,
football-data.org**.

## Quickstart

```bash
npm install
cp .env.example .env.local   # then fill in the values (see below)
npm run db:push              # create tables in Supabase (uses DIRECT_URL)
npm run db:seed              # optional: demo league + admin to log in as
npm run dev                  # http://localhost:3000
```

`db:seed` creates a demo admin (`demo@matchday.app` / `demo-password-123`) and a
populated 4-team "Sunday Cup" so standings and share cards have data on first
load. Re-running it wipes and recreates that tournament.

### Required env (`.env.local`)

| Var | What | Needed for |
| --- | --- | --- |
| `DATABASE_URL` | Supabase **pooler** (port 6543) | app runtime |
| `DIRECT_URL` | Supabase **direct** (port 5432) | migrations / `db:push` |
| `BETTER_AUTH_SECRET` | random 32+ chars | auth (sign-in/up) |
| `BETTER_AUTH_URL` | `http://localhost:3000` in dev | auth callbacks/cookies |
| `GEMINI_API_KEY` | Google Gemini key | AI setup assistant |
| `FOOTBALL_DATA_KEY` | football-data.org key | leagues discover (optional) |

Generate a secret: `openssl rand -base64 32` (or any 32+ random chars).

The app boots without `GEMINI_API_KEY` / `FOOTBALL_DATA_KEY` — those two
features degrade gracefully. It needs `DATABASE_URL` + `BETTER_AUTH_SECRET`
to do anything useful.

## The core loop

1. **Sign up** → `/setup` (manual) or `/chat` (AI assistant).
2. Pick team/player counts → name teams → **Do Fixtures** (round-robin).
3. Register players per team (name + shirt number).
4. **Admin** → tap shirt numbers to log goals; the score + standings update.
5. **Standings** fill in live; **Share cards** export to PNG.
6. **Discover** real leagues at `/leagues` (same card components).

## Scripts

```bash
npm run dev          # local dev
npm run build        # production build
npm run db:generate  # SQL from schema changes
npm run db:migrate   # apply migrations (DIRECT_URL)
npm run db:push      # fast path: push schema straight to Supabase
```

## Deploy (Vercel + Supabase)

Import the repo, set **all** env vars for Production + Preview, deploy. Keep
`BETTER_AUTH_URL` pointed at the deployed URL. DB/auth routes stay on the Node
runtime (don't add `export const runtime = "edge"`). Migrations run from your
machine/CI against `DIRECT_URL`, never from a serverless function.
