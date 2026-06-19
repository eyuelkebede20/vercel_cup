"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function TournamentTabs({
  tournamentId,
  isOwner,
}: {
  tournamentId: string;
  isOwner: boolean;
}) {
  const pathname = usePathname();
  const base = `/t/${tournamentId}`;

  const tabs = [
    { href: base, label: "Fixtures", exact: true },
    { href: `${base}/standings`, label: "Standings" },
    { href: `${base}/teams`, label: "Players" },
    { href: `${base}/cards`, label: "Share cards" },
    ...(isOwner ? [{ href: `${base}/admin`, label: "Admin" }] : []),
  ];

  return (
    <div role="tablist" className="tabs tabs-boxed bg-base-100">
      {tabs.map((tab) => {
        const active = tab.exact
          ? pathname === tab.href
          : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            role="tab"
            className={`tab ${active ? "tab-active" : ""}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
