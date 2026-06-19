import Link from "next/link";
import {
  FEATURED_COMPETITIONS,
  isLeaguesConfigured,
  SAMPLE_NOTICE,
} from "@/lib/leagues";

export default function LeaguesPage() {
  const configured = isLeaguesConfigured();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Discover real leagues</h1>
        <p className="text-sm opacity-60">
          Browse fixtures and standings — rendered with the same cards as your
          own tournaments.
        </p>
      </div>

      {!configured && (
        <div className="alert">
          <span>{SAMPLE_NOTICE}</span>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURED_COMPETITIONS.map((c) => (
          <Link
            key={c.code}
            href={`/leagues/${c.code}`}
            className="card border border-base-200 bg-base-100 transition hover:border-primary"
          >
            <div className="card-body">
              <h3 className="card-title">{c.name}</h3>
              <p className="text-sm opacity-60">
                {configured ? c.code : "Sample preview"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
