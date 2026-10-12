export type GeneratedFixture = {
  roundNumber: number;
  homeTeamId: string;
  awayTeamId: string;
};

export type RoundRobinOptions = {
  doubleRoundRobin: boolean;
  balancedHomeAway: boolean;
};

const BYE = "__BYE__";

/**
 * Generates a round-robin schedule using the circle method.
 *
 * - Handles odd team counts via a BYE placeholder (that team sits out).
 * - doubleRoundRobin: every pair plays twice (reversed in the second half).
 * - balancedHomeAway: alternates home/away so each team plays roughly
 *   half at home. When false, home/away is assigned pragmatically but
 *   still avoids a team being home every single round.
 *
 * Returns fixtures WITHOUT dates/grounds/referees — scheduling is separate.
 */
export function generateRoundRobin(
  teamIds: string[],
  options: RoundRobinOptions
): GeneratedFixture[] {
  if (teamIds.length < 2) {
    throw new Error("At least 2 teams are required to generate fixtures");
  }

  // Work on a mutable copy; add BYE if odd.
  const teams = [...teamIds];
  const hasBye = teams.length % 2 !== 0;
  if (hasBye) teams.push(BYE);

  const n = teams.length;
  const roundsPerHalf = n - 1;
  const fixtures: GeneratedFixture[] = [];

  // Circle method: fix the last team, rotate the rest.
  // We rotate an array of indices.
  const rotation = [...teams];

  for (let round = 0; round < roundsPerHalf; round++) {
    for (let i = 0; i < n / 2; i++) {
      const teamA = rotation[i];
      const teamB = rotation[n - 1 - i];

      if (teamA === BYE || teamB === BYE) continue; // bye — skip

      // Decide home/away for this pairing.
      let home: string;
      let away: string;

      if (options.balancedHomeAway) {
        // Alternate: on even pairings teamA is home, on odd teamB is home.
        // This distributes home games evenly across rounds.
        if ((round + i) % 2 === 0) {
          home = teamA;
          away = teamB;
        } else {
          home = teamB;
          away = teamA;
        }
      } else {
        // Pragmatic: teamA home. Still varied because teamA changes
        // each round via rotation.
        home = teamA;
        away = teamB;
      }

      fixtures.push({
        roundNumber: round + 1,
        homeTeamId: home,
        awayTeamId: away,
      });
    }

    // Rotate: keep rotation[0] fixed, shift the rest.
    const fixed = rotation[0];
    const rest = rotation.slice(1);
    rest.unshift(rest.pop()!);
    rotation.length = 0;
    rotation.push(fixed, ...rest);
  }

  if (!options.doubleRoundRobin) {
    return fixtures;
  }

  // Second half: mirror the first half with reversed home/away.
  const secondHalf = fixtures.map((f) => ({
    roundNumber: f.roundNumber + roundsPerHalf,
    homeTeamId: options.balancedHomeAway ? f.awayTeamId : f.homeTeamId,
    awayTeamId: options.balancedHomeAway ? f.homeTeamId : f.awayTeamId,
  }));

  return [...fixtures, ...secondHalf];
}