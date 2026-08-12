"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTournament } from "@/lib/actions";
import {
  MIN_TEAMS,
  MAX_TEAMS,
  MIN_PLAYERS_PER_TEAM,
  MAX_PLAYERS_PER_TEAM,
} from "@/lib/constants";

// Steps 1-3 of the manual flow: counts -> name teams -> "Do Fixtures".
// On "Do Fixtures" it calls the same createTournament action the AI uses.
export function SetupWizard() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  const [name, setName] = useState("");
  const [teamCount, setTeamCount] = useState(8);
  const [playersPerTeam, setPlayersPerTeam] = useState(5);
  const [doubleRound, setDoubleRound] = useState(false);
  const [teamNames, setTeamNames] = useState<string[]>([]);
  const [generateFixtures, setGenerateFixtures] = useState(true);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function goToNaming(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // Seed the name boxes, preserving any already typed.
    setTeamNames((prev) =>
      Array.from({ length: teamCount }, (_, i) => prev[i] ?? ""),
    );
    setStep(2);
  }

  function setTeamName(i: number, value: string) {
    setTeamNames((prev) => {
      const next = [...prev];
      next[i] = value;
      return next;
    });
  }

  async function doFixtures() {
    setBusy(true);
    setError(null);
    try {
      const { tournamentId } = await createTournament({
        tournamentName: name,
        teamCount,
        playersPerTeam,
        doubleRound,
        generateFixtures,
        teamNames: teamNames.map((n) => n.trim()),
        historicalMatches: [],
      });
      router.push(`/t/${tournamentId}`);
    } catch (err) {
      setError(
        err instanceof Error && err.message === "UNAUTHORIZED"
          ? "Please sign in first."
          : "Couldn't create the league. Try again.",
      );
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <ul className="steps w-full">
        <li className={`step ${step >= 1 ? "step-primary" : ""}`}>Setup</li>
        <li className={`step ${step >= 2 ? "step-primary" : ""}`}>Name teams</li>
        <li className="step">Fixtures</li>
      </ul>

      {step === 1 && (
        <form
          onSubmit={goToNaming}
          className="card border border-base-200 bg-base-100"
        >
          <div className="card-body gap-4">
            <label className="form-control">
              <div className="label">
                <span className="label-text">League name</span>
              </div>
              <input
                className="input input-bordered"
                placeholder="Sunday Cup"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={80}
              />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="form-control">
                <div className="label">
                  <span className="label-text">Number of teams</span>
                </div>
                <input
                  type="number"
                  className="input input-bordered"
                  value={teamCount}
                  min={MIN_TEAMS}
                  max={MAX_TEAMS}
                  onChange={(e) => setTeamCount(Number(e.target.value))}
                  required
                />
              </label>
              <label className="form-control">
                <div className="label">
                  <span className="label-text">Players per team</span>
                </div>
                <input
                  type="number"
                  className="input input-bordered"
                  value={playersPerTeam}
                  min={MIN_PLAYERS_PER_TEAM}
                  max={MAX_PLAYERS_PER_TEAM}
                  onChange={(e) => setPlayersPerTeam(Number(e.target.value))}
                  required
                />
              </label>
            </div>

            <label className="label cursor-pointer justify-start gap-3">
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={doubleRound}
                onChange={(e) => setDoubleRound(e.target.checked)}
              />
              <span className="label-text">
                Home &amp; away (each pairing plays twice)
              </span>
            </label>

            <label className="label cursor-pointer justify-start gap-3">
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={generateFixtures}
                onChange={(e) => setGenerateFixtures(e.target.checked)}
              />
              <span className="label-text">
                Auto-generate fixtures (round-robin schedule)
              </span>
            </label>

            <button className="btn btn-primary" type="submit">
              Next: name teams →
            </button>
          </div>
        </form>
      )}

      {step === 2 && (
        <div className="card border border-base-200 bg-base-100">
          <div className="card-body gap-4">
            <div>
              <h2 className="text-lg font-semibold">Name your teams</h2>
              <p className="text-sm opacity-60">
                Leave any blank and we&apos;ll fill it in (Team 1, Team 2…).
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {Array.from({ length: teamCount }, (_, i) => (
                <label key={i} className="join">
                  <span className="join-item flex w-12 items-center justify-center bg-base-200 text-sm font-semibold">
                    {i + 1}
                  </span>
                  <input
                    className="input input-bordered join-item w-full"
                    placeholder={`Team ${i + 1}`}
                    value={teamNames[i] ?? ""}
                    onChange={(e) => setTeamName(i, e.target.value)}
                    maxLength={40}
                  />
                </label>
              ))}
            </div>

            {error && (
              <div className="alert alert-error py-2 text-sm">{error}</div>
            )}

            <div className="flex gap-2">
              <button
                className="btn btn-ghost"
                onClick={() => setStep(1)}
                disabled={busy}
              >
                ← Back
              </button>
              <button
                className="btn btn-primary flex-1"
                onClick={doFixtures}
                disabled={busy}
              >
                {busy ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  "⚽ Do Fixtures"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
