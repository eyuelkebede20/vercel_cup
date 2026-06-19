import { NextResponse } from "next/server";

// Server-side proxy to football-data.org. The browser calls this; we add the
// X-Auth-Token from the environment so the key never reaches the client.
export const runtime = "nodejs";

const BASE = "https://api.football-data.org/v4";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const key = process.env.FOOTBALL_DATA_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "Leagues data isn't configured (missing FOOTBALL_DATA_KEY)." },
      { status: 503 },
    );
  }

  const { path } = await params;
  const search = new URL(req.url).search;
  const target = `${BASE}/${path.join("/")}${search}`;

  const res = await fetch(target, {
    headers: { "X-Auth-Token": key },
    next: { revalidate: 120 },
  });

  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
