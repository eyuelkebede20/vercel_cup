import Link from "next/link";
import { notFound } from "next/navigation";
import { getTournament } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { TournamentTabs } from "@/components/TournamentTabs";

export default async function TournamentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = await params;
  const t = await getTournament(tournamentId);
  if (!t) notFound();

  const user = await getCurrentUser();
  const isOwner = user?.id === t.ownerId;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">{t.name}</h1>
        <p className="text-sm opacity-60">
          {t.teamCount} teams · {t.playersPerTeam} players/side
          {t.doubleRound ? " · home & away" : ""}
        </p>
      </header>

      <TournamentTabs tournamentId={tournamentId} isOwner={isOwner} />

      {children}
    </div>
  );
}
