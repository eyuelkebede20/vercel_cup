// A tiny crest/avatar. Falls back to the team's initials when no crest URL is
// available (local tournaments never have crests).

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export function Crest({
  name,
  crest,
  size = 40,
}: {
  name: string;
  crest?: string | null;
  size?: number;
}) {
  if (crest) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={crest}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-contain"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-full bg-primary/10 font-semibold text-primary"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}
