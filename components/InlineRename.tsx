"use client";

import { useRouter } from "next/navigation";
import { renameTeam } from "@/lib/actions";

// A heading that renames in place. Click the name → edit → Enter/blur saves.
export function InlineRename({
  teamId,
  name,
}: {
  teamId: string;
  name: string;
}) {
  const router = useRouter();
  return (
    <h2 className="text-xl font-semibold">
      <RenameField
        teamId={teamId}
        name={name}
        onDone={() => router.refresh()}
      />
    </h2>
  );
}

function RenameField({
  teamId,
  name,
  onDone,
}: {
  teamId: string;
  name: string;
  onDone: () => void;
}) {
  return (
    <input
      defaultValue={name}
      className="input input-ghost -ml-3 max-w-xs px-3 text-xl font-semibold focus:input-bordered"
      maxLength={40}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      onBlur={async (e) => {
        const next = e.target.value.trim();
        if (!next || next === name) {
          e.target.value = name;
          return;
        }
        try {
          await renameTeam({ teamId, name: next });
          onDone();
        } catch {
          e.target.value = name;
        }
      }}
    />
  );
}
