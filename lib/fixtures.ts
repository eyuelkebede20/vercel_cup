// Single round-robin via the circle method.
// Every team plays every other team exactly once (twice if `double`).

const BYE = "__BYE__";

export type Fixture = { round: number; home: string; away: string };

export function generateRoundRobin(
  teamIds: string[],
  double = false,
): Fixture[] {
  // Work on a copy; add a BYE placeholder if odd so the count is even.
  const ids = [...teamIds];
  if (ids.length < 2) return [];
  if (ids.length % 2 !== 0) ids.push(BYE);

  const n = ids.length;
  const rounds = n - 1;
  const half = n / 2;

  // Fix the first team; rotate the rest each round.
  const fixed = ids[0];
  let rotating = ids.slice(1);

  const fixtures: Fixture[] = [];

  for (let r = 0; r < rounds; r++) {
    const roundTeams = [fixed, ...rotating];

    for (let i = 0; i < half; i++) {
      const home = roundTeams[i];
      const away = roundTeams[n - 1 - i];
      if (home === BYE || away === BYE) continue;

      // Alternate home/away by round so it isn't always the same side at home.
      const swap = r % 2 === 1;
      fixtures.push({
        round: r + 1,
        home: swap ? away : home,
        away: swap ? home : away,
      });
    }

    // Rotate: move the last rotating team to the front.
    rotating = [rotating[rotating.length - 1], ...rotating.slice(0, -1)];
  }

  if (double) {
    const second = fixtures.map((f) => ({
      round: f.round + rounds,
      home: f.away,
      away: f.home,
    }));
    return [...fixtures, ...second];
  }

  return fixtures;
}
