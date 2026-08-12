import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { tournament } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/session";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { ResultCard } from "@/components/ResultCard";
import { FixtureCard } from "@/components/FixtureCard";
import { DeleteLeagueButton } from "@/components/DeleteLeagueButton";
import type { MatchView } from "@/lib/types";

const SAMPLE_RESULT: MatchView = {
  id: "demo-result",
  status: "played",
  round: 3,
  home: { name: "Lions", score: 3 },
  away: { name: "Sharks", score: 1 },
};

const SAMPLE_FIXTURE: MatchView = {
  id: "demo-fixture",
  status: "scheduled",
  round: 4,
  kickoffAt: "2026-06-21T15:00:00Z",
  home: { name: "Eagles" },
  away: { name: "Wolves" },
};

const STEPS = [
  { n: 1, title: "Set it up", body: "Pick the number of teams and squad size — by chat or a quick form." },
  { n: 2, title: "Do fixtures", body: "One tap builds a full round-robin so everyone plays everyone." },
  { n: 3, title: "Log goals", body: "Tap a player's shirt number pitchside — the score updates live." },
  { n: 4, title: "Share it", body: "Live standings plus clean cards you export as a PNG for the group chat." },
];

const FEATURES = [
  { icon: "✨", title: "AI setup assistant", body: "Say “create me a league” and answer a couple of questions — it builds the whole thing." },
  { icon: "🗓️", title: "Auto fixtures", body: "Round-robin scheduling, grouped by round so it scans like a real calendar." },
  { icon: "⚽", title: "Tap-to-score", body: "Big shirt-number buttons, not name dropdowns. Built for a phone at the side of the pitch." },
  { icon: "📊", title: "Live standings", body: "W/D/L, GF, GA, GD and points — derived from goals the moment you log them." },
  { icon: "🖼️", title: "Shareable cards", body: "Every fixture and result as a tidy card, one tap to export as a PNG." },
  { icon: "🌍", title: "Discover leagues", body: "Browse real-world fixtures and tables rendered with the exact same cards." },
];

export default async function HomePage() {
  const user = await getCurrentUser();

  const myTournaments = user
    ? await db
        .select()
        .from(tournament)
        .where(eq(tournament.ownerId, user.id))
        .orderBy(desc(tournament.createdAt))
    : [];

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="grid items-center gap-10 lg:grid-cols-2">
        <div className="space-y-6">
          <span className="badge badge-primary badge-outline gap-2">
            ⚽ Football tournament manager
          </span>
          <h1 className="text-5xl font-extrabold leading-tight tracking-tight">
            {APP_NAME}
          </h1>
          <p className="max-w-md text-lg opacity-70">{APP_TAGLINE}</p>
          <p className="max-w-md opacity-60">
            Spin up a league, register squads, log goals from your phone, and
            watch the table move in real time — then share clean cards anyone can
            screenshot.
          </p>
          <div className="flex flex-wrap gap-3">
            {user ? (
              <>
                <Link href="/chat" className="btn btn-primary">
                  ✨ Create with AI
                </Link>
                <Link href="/setup" className="btn btn-outline">
                  Manual setup
                </Link>
              </>
            ) : (
              <>
                <Link href="/sign-up" className="btn btn-primary">
                  Get started — it&apos;s free
                </Link>
                <Link href="/leagues" className="btn btn-ghost">
                  Browse real leagues →
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Live product preview — the real components */}
        <div className="relative">
          <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-primary/5 blur-2xl" />
          <div className="flex flex-col gap-4">
            <div className="rotate-1">
              <ResultCard match={SAMPLE_RESULT} />
            </div>
            <div className="-rotate-1 sm:ml-16">
              <FixtureCard match={SAMPLE_FIXTURE} />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold">From zero to kickoff in minutes</h2>
          <p className="mx-auto mt-2 max-w-lg opacity-60">
            One guided flow — manual or AI. Both end up at the same live league.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="card border border-base-200 bg-base-100">
              <div className="card-body gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-content">
                  {s.n}
                </div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="text-sm opacity-60">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Everything a kickabout needs</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="card border border-base-200 bg-base-100 transition hover:-translate-y-0.5 hover:border-primary/40"
            >
              <div className="card-body gap-2">
                <div className="text-3xl">{f.icon}</div>
                <h3 className="card-title text-lg">{f.title}</h3>
                <p className="text-sm opacity-60">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Your leagues (signed in) */}
      {user && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Your leagues</h2>
            <Link href="/setup" className="btn btn-sm btn-ghost">
              + New
            </Link>
          </div>

          {myTournaments.length === 0 ? (
            <div className="card border border-dashed border-base-300 bg-base-100">
              <div className="card-body items-center text-center">
                <p className="opacity-70">No leagues yet.</p>
                <Link href="/chat" className="btn btn-primary btn-sm">
                  Create your first one
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {myTournaments.map((t) => (
                <div key={t.id} className="relative card border border-base-200 bg-base-100 transition hover:border-primary">
                  <Link
                    href={`/t/${t.id}`}
                    className="card-body"
                  >
                    <h3 className="card-title pr-6">{t.name}</h3>
                    <p className="text-sm opacity-60">
                      {t.teamCount} teams · {t.playersPerTeam} players/side
                      {t.doubleRound ? " · home & away" : ""}
                    </p>
                  </Link>
                  <DeleteLeagueButton tournamentId={t.id} />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* CTA / footer strip */}
      {!user && (
        <section className="card border border-base-200 bg-gradient-to-br from-primary/10 to-base-100">
          <div className="card-body items-center gap-4 text-center">
            <h2 className="text-2xl font-bold">Ready to run your league?</h2>
            <p className="max-w-md opacity-60">
              Create an admin account and build your first round-robin in a couple
              of minutes.
            </p>
            <Link href="/sign-up" className="btn btn-primary">
              Get started
            </Link>
          </div>
        </section>
      )}

      <p className="pb-4 text-center text-xs opacity-40">
        Built on Next.js · Deploys to Vercel · Supabase Postgres
      </p>
    </div>
  );
}
