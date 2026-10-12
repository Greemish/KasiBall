import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";

export type PlayerSeasonStats = {
  seasonId: string;
  seasonName: string;
  matches: number;
  starts: number;
  subApps: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  cleanSheets: number;
};

export type PlayerStats = {
  playerId: string;
  firstName: string;
  lastName: string;
  totals: Omit<PlayerSeasonStats, "seasonId" | "seasonName">;
  bySeason: PlayerSeasonStats[];
};

export type LeaderboardRow = {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  goals: number;
  assists: number;
  appearances: number;
  cleanSheets: number;
};

const COUNTABLE_MATCH_STATUSES = ["COMPLETED", "FORFEITED"] as const;

// ---------------------------------------------------------------------------
// Per-player stats (career + optional per-season breakdown)
// ---------------------------------------------------------------------------

export async function computePlayerStats(
  playerId: string
): Promise<PlayerStats> {
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: {
      registrations: {
        include: { season: { select: { id: true, name: true } } },
      },
    },
  });

  if (!player) {
    throw new NotFoundError("Player not found", "PLAYER_NOT_FOUND");
  }

  const registrationIds = player.registrations.map((r) => r.id);

  // Group registrations by season for the breakdown.
  const seasonMap = new Map<
    string,
    { name: string; registrationIds: string[] }
  >();
  for (const reg of player.registrations) {
    const entry = seasonMap.get(reg.seasonId) ?? {
      name: reg.season.name,
      registrationIds: [],
    };
    entry.registrationIds.push(reg.id);
    seasonMap.set(reg.seasonId, entry);
  }

  const bySeason: PlayerSeasonStats[] = [];

  for (const [seasonId, { name, registrationIds: regIds }] of seasonMap) {
    const stats = await computeStatsForRegistrations(regIds, seasonId);
    bySeason.push({ seasonId, seasonName: name, ...stats });
  }

  // Sort seasons most-recent-first by name (rough; could be by dates if needed)
  bySeason.sort((a, b) => b.seasonName.localeCompare(a.seasonName));

  // Career totals = sum of seasons.
  const totals = bySeason.reduce(
    (acc, s) => ({
      matches: acc.matches + s.matches,
      starts: acc.starts + s.starts,
      subApps: acc.subApps + s.subApps,
      goals: acc.goals + s.goals,
      assists: acc.assists + s.assists,
      yellowCards: acc.yellowCards + s.yellowCards,
      redCards: acc.redCards + s.redCards,
      cleanSheets: acc.cleanSheets + s.cleanSheets,
    }),
    {
      matches: 0,
      starts: 0,
      subApps: 0,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      cleanSheets: 0,
    }
  );

  return {
    playerId: player.id,
    firstName: player.firstName,
    lastName: player.lastName,
    totals,
    bySeason,
  };
}

/**
 * Core aggregation for a set of registrations, optionally scoped to a season.
 */
async function computeStatsForRegistrations(
  registrationIds: string[],
  seasonId?: string
) {
  if (registrationIds.length === 0) {
    return {
      matches: 0,
      starts: 0,
      subApps: 0,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      cleanSheets: 0,
    };
  }

  // Squad appearances
  const squads = await prisma.matchdaySquad.findMany({
    where: {
      playerRegistrationId: { in: registrationIds },
      match: {
        status: { in: [...COUNTABLE_MATCH_STATUSES] },
        ...(seasonId ? { fixture: { seasonId } } : {}),
      },
    },
    include: {
      match: {
        include: {
          fixture: {
            select: { homeTeamId: true, awayTeamId: true },
          },
        },
      },
    },
  });

  const matchIds = new Set(squads.map((s) => s.matchId));

  let starts = 0;
  let subApps = 0;
  let cleanSheets = 0;

  for (const s of squads) {
    if (s.starting) starts++;
    if (s.substitute) subApps++;

    if (s.goalkeeper && s.match) {
      const m = s.match;
      const isHome = m.fixture.homeTeamId === s.teamId;
      const opponentScore = isHome ? m.awayScore : m.homeScore;
      if (opponentScore === 0) cleanSheets++;
    }
  }

  // Events
  const events = await prisma.matchEvent.findMany({
    where: {
      match: {
        status: { in: [...COUNTABLE_MATCH_STATUSES] },
        ...(seasonId ? { fixture: { seasonId } } : {}),
      },
      OR: [
        { playerRegistrationId: { in: registrationIds } },
        { assistPlayerRegistrationId: { in: registrationIds } },
      ],
    },
    select: {
      eventType: true,
      playerRegistrationId: true,
      assistPlayerRegistrationId: true,
    },
  });

  let goals = 0;
  let assists = 0;
  let yellowCards = 0;
  let redCards = 0;

  const idSet = new Set(registrationIds);

  for (const e of events) {
    if (e.playerRegistrationId && idSet.has(e.playerRegistrationId)) {
      if (e.eventType === "GOAL") goals++;
      else if (e.eventType === "YELLOW_CARD") yellowCards++;
      else if (e.eventType === "RED_CARD") redCards++;
      // OWN_GOAL: deliberately not credited to the player
    }
    if (
      e.assistPlayerRegistrationId &&
      idSet.has(e.assistPlayerRegistrationId)
    ) {
      assists++;
    }
  }

  return {
    matches: matchIds.size,
    starts,
    subApps,
    goals,
    assists,
    yellowCards,
    redCards,
    cleanSheets,
  };
}

// ---------------------------------------------------------------------------
// Leaderboards
// ---------------------------------------------------------------------------

export type LeaderboardSort = "goals" | "assists" | "appearances" | "cleanSheets";

export async function getLeaderboard(
  filter: { seasonId: string; ageGroupId?: string },
  sortBy: LeaderboardSort = "goals",
  limit = 20
): Promise<LeaderboardRow[]> {
  // Find all registrations in scope.
  const registrations = await prisma.playerRegistration.findMany({
    where: {
      seasonId: filter.seasonId,
      ...(filter.ageGroupId
        ? { team: { ageGroupId: filter.ageGroupId } }
        : {}),
    },
    include: {
      player: { select: { id: true, firstName: true, lastName: true } },
      team: { select: { id: true, name: true } },
    },
  });

  const rows: LeaderboardRow[] = [];

  for (const reg of registrations) {
    const stats = await computeStatsForRegistrations(
      [reg.id],
      filter.seasonId
    );
    rows.push({
      playerId: reg.player.id,
      playerName: `${reg.player.firstName} ${reg.player.lastName}`,
      teamId: reg.team.id,
      teamName: reg.team.name,
      goals: stats.goals,
      assists: stats.assists,
      appearances: stats.matches,
      cleanSheets: stats.cleanSheets,
    });
  }

  const sortKey =
    sortBy === "appearances" ? "appearances" : sortBy;

  rows.sort((a, b) => {
    const diff = b[sortKey] - a[sortKey];
    if (diff !== 0) return diff;
    return a.playerName.localeCompare(b.playerName);
  });

  return rows.slice(0, limit);
}