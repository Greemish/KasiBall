import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import { computePlayerStats } from "@/lib/services/player-stats";
import { getStandings } from "@/lib/services/standings";

const PUBLIC_SEASON_STATUSES = ["PLANNED", "ACTIVE", "COMPLETED"] as const;
const PUBLIC_MATCH_STATUSES = ["COMPLETED"] as const;

// ---------------------------------------------------------------------------
// Age helper — derive age, never expose DOB
// ---------------------------------------------------------------------------

function ageFromDob(dob: Date): number {
  const now = new Date();
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const m = now.getUTCMonth() - dob.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < dob.getUTCDate())) age--;
  return age;
}

// ---------------------------------------------------------------------------
// Seasons
// ---------------------------------------------------------------------------

export async function listPublicSeasons() {
  return prisma.season.findMany({
    where: { status: { in: [...PUBLIC_SEASON_STATUSES] } },
    orderBy: { startDate: "desc" },
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      status: true,
    },
  });
}

export async function getPublicSeason(id: string) {
  const season = await prisma.season.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      status: true,
      ageGroups: {
        select: { id: true, name: true, minAge: true, maxAge: true },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!season || !PUBLIC_SEASON_STATUSES.includes(season.status as never)) {
    throw new NotFoundError("Season not found", "SEASON_NOT_FOUND");
  }

  return season;
}

// ---------------------------------------------------------------------------
// Standings (reuse the service)
// ---------------------------------------------------------------------------

export async function getPublicStandings(ageGroupId: string) {
  const ageGroup = await prisma.ageGroup.findUnique({
    where: { id: ageGroupId },
    select: { id: true, seasonId: true },
  });

  if (!ageGroup) {
    throw new NotFoundError("Age group not found", "AGE_GROUP_NOT_FOUND");
  }

  return getStandings(ageGroup.seasonId, ageGroupId);
}

// ---------------------------------------------------------------------------
// Fixtures (public — only scheduled + completed)
// ---------------------------------------------------------------------------

export async function listPublicFixtures(ageGroupId: string) {
  return prisma.fixture.findMany({
    where: {
      ageGroupId,
      scheduled_date: { not: null },
    },
    orderBy: [{ scheduled_date: "asc" }, { kickoff_time: "asc" }],
    select: {
      id: true,
      roundNumber: true,
      scheduled_date: true,
      kickoff_time: true,
      status: true,
      homeTeam: { select: { id: true, name: true } },
      awayTeam: { select: { id: true, name: true } },
      ground: { select: { id: true, name: true } },
      match: {
        select: {
          homeScore: true,
          awayScore: true,
          status: true,
        },
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Clubs
// ---------------------------------------------------------------------------

export async function listPublicClubs() {
  return prisma.club.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      shortName: true,
      logoUrl: true,
      _count: { select: { teams: true } },
    },
  });
}

export async function getPublicClub(id: string) {
  const club = await prisma.club.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      shortName: true,
      logoUrl: true,
      teams: {
        where: { status: "APPROVED" },
        select: {
          id: true,
          name: true,
          ageGroup: { select: { id: true, name: true } },
        },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!club) {
    throw new NotFoundError("Club not found", "CLUB_NOT_FOUND");
  }

  return club;
}

// ---------------------------------------------------------------------------
// Teams (public — approved only, with a public squad)
// ---------------------------------------------------------------------------

export async function getPublicTeam(id: string) {
  const team = await prisma.team.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      shortName: true,
      logoUrl: true,
      status: true,
      club: { select: { id: true, name: true } },
      ageGroup: { select: { id: true, name: true } },
    },
  });

  if (!team || team.status !== "APPROVED") {
    throw new NotFoundError("Team not found", "TEAM_NOT_FOUND");
  }

  // Public squad — name, shirt number, age only.
  const registrations = await prisma.playerRegistration.findMany({
    where: {
      teamId: id,
      registrationStatus: "VERIFIED",
    },
    select: {
      shirtNumber: true,
      player: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          dateOfBirth: true,
        },
      },
    },
    orderBy: { shirtNumber: "asc" },
  });

  const squad = registrations.map((r) => ({
    playerId: r.player.id,
    name: `${r.player.firstName} ${r.player.lastName}`,
    shirtNumber: r.shirtNumber,
    age: ageFromDob(r.player.dateOfBirth),
  }));

  return { ...team, squad };
}

// ---------------------------------------------------------------------------
// Players
// ---------------------------------------------------------------------------

export async function searchPublicPlayers(query: string) {
  const q = query.trim();
  if (q.length < 2) return [];

  const players = await prisma.player.findMany({
    where: {
      OR: [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
      ],
      registrations: {
        some: { registrationStatus: "VERIFIED" },
      },
    },
    take: 30,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      registrations: {
        where: { registrationStatus: "VERIFIED" },
        select: {
          team: {
            select: {
              id: true,
              name: true,
              club: { select: { id: true, name: true } },
            },
          },
        },
        take: 1,
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return players.map((p) => ({
    playerId: p.id,
    name: `${p.firstName} ${p.lastName}`,
    age: ageFromDob(p.dateOfBirth),
    team: p.registrations[0]?.team ?? null,
  }));
}

export async function getPublicPlayer(id: string) {
  const player = await prisma.player.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      photoUrl: true,
    },
  });

  if (!player) {
    throw new NotFoundError("Player not found", "PLAYER_NOT_FOUND");
  }

  const stats = await computePlayerStats(id);

  // Career totals + per-season, with NO private fields.
  return {
    playerId: player.id,
    name: `${player.firstName} ${player.lastName}`,
    age: ageFromDob(player.dateOfBirth),
    photoUrl: player.photoUrl,
    totals: stats.totals,
    bySeason: stats.bySeason,
  };
}