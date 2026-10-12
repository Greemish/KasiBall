import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";

export type StandingsRow = {
  position: number;
  teamId: string;
  teamName: string;
  clubName: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

export async function getStandings(
  seasonId: string,
  ageGroupId: string
): Promise<StandingsRow[]> {
  // Validate the age group belongs to the season.
  const ageGroup = await prisma.ageGroup.findUnique({
    where: { id: ageGroupId },
    select: { id: true, seasonId: true },
  });

  if (!ageGroup || ageGroup.seasonId !== seasonId) {
    throw new NotFoundError("Age group not found", "AGE_GROUP_NOT_FOUND");
  }

  // All teams in the age group.
  const teams = await prisma.team.findMany({
    where: { ageGroupId },
    select: {
      id: true,
      name: true,
      club: { select: { name: true } },
    },
  });

  // All countable matches in the age group.
  const matches = await prisma.match.findMany({
    where: {
      status: { in: ["COMPLETED", "FORFEITED"] },
      fixture: { ageGroupId },
    },
    include: {
      fixture: {
        select: { homeTeamId: true, awayTeamId: true },
      },
      forfeits: {
        select: { teamId: true },
      },
    },
  });

  // Seed a stats row per team.
  type Stats = {
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
  };

  const stats = new Map<string, Stats>();
  for (const t of teams) {
    stats.set(t.id, {
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
    });
  }

  for (const m of matches) {
    const homeId = m.fixture.homeTeamId;
    const awayId = m.fixture.awayTeamId;

    let homeGoals: number;
    let awayGoals: number;

    if (m.status === "FORFEITED") {
      // Find who forfeited. If home forfeited → away wins 3-0, and vice versa.
      const forfeitingTeamId = m.forfeits[0]?.teamId;
      if (!forfeitingTeamId) continue; // malformed forfeit — skip

      if (forfeitingTeamId === homeId) {
        homeGoals = 0;
        awayGoals = 3;
      } else if (forfeitingTeamId === awayId) {
        homeGoals = 3;
        awayGoals = 0;
      } else {
        continue; // forfeit team not in this match — skip
      }
    } else {
      homeGoals = m.homeScore;
      awayGoals = m.awayScore;
    }

    const home = stats.get(homeId);
    const away = stats.get(awayId);
    if (!home || !away) continue;

    home.played++;
    away.played++;
    home.goalsFor += homeGoals;
    home.goalsAgainst += awayGoals;
    away.goalsFor += awayGoals;
    away.goalsAgainst += homeGoals;

    if (homeGoals > awayGoals) {
      home.won++;
      away.lost++;
    } else if (homeGoals < awayGoals) {
      away.won++;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
    }
  }

  // Build rows.
  const rows: Omit<StandingsRow, "position">[] = teams.map((t) => {
    const s = stats.get(t.id)!;
    return {
      teamId: t.id,
      teamName: t.name,
      clubName: t.club?.name ?? null,
      played: s.played,
      won: s.won,
      drawn: s.drawn,
      lost: s.lost,
      goalsFor: s.goalsFor,
      goalsAgainst: s.goalsAgainst,
      goalDifference: s.goalsFor - s.goalsAgainst,
      points: s.won * 3 + s.drawn * 1,
    };
  });

  // Sort: points desc, GD desc, GF desc, name asc.
  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference)
      return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.teamName.localeCompare(b.teamName);
  });

  return rows.map((r, i) => ({ position: i + 1, ...r }));
}