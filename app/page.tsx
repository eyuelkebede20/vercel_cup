import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { tournament } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/session";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

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
    <div className="space-y-10">
      <section className="hero rounded-box bg-base-100 py-12">
        <div className="hero-content text-center">
          <div className="max-w-xl">
            <h1 className="text-4xl font-bold">{APP_NAME}</h1>
            <p className="py-4 text-lg opacity-70">{APP_TAGLINE}</p>
            <div className="flex flex-wrap justify-center gap-2">
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
                    Get started
                  </Link>
                  <Link href="/leagues" className="btn btn-outline">
                    Browse real leagues
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

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
                <Link
                  key={t.id}
                  href={`/t/${t.id}`}
                  className="card border border-base-200 bg-base-100 transition hover:border-primary"
                >
                  <div className="card-body">
                    <h3 className="card-title">{t.name}</h3>
                    <p className="text-sm opacity-60">
                      {t.teamCount} teams · {t.playersPerTeam} players/side
                      {t.doubleRound ? " · home & away" : ""}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
