import { prisma } from "@/lib/prisma";
import {
  NotFoundError,
  BusinessRuleError,
  ConflictError,
} from "@/lib/errors";
import { generateRoundRobin } from "@/lib/fixtures/round-robin";
import type { GenerateFixturesInput } from "@/lib/validations/fixture";

const FIXTURE_INCLUDE = {
  homeTeam: {
    select: { id: true, name: true, club: { select: { id: true, name: true } } },
  },
  awayTeam: {
    select: { id: true, name: true, club: { select: { id: true, name: true } } },
  },
  ground: { select: { id: true, name: true } },
  referee: { select: { id: true, firstName: true, lastName: true } },
} as const;

// ---------------------------------------------------------------------------
// Generate
// ---------------------------------------------------------------------------

export async function generateFixtures(
  seasonId: string,
  ageGroupId: string,
  options: GenerateFixturesInput
) {
  // Season must exist and not be terminal.
  const season = await prisma.season.findUnique({
    where: { id: seasonId },
  });

  if (!season) {
    throw new NotFoundError("Season not found", "SEASON_NOT_FOUND");
  }

  if (season.status === "CANCELLED" || season.status === "COMPLETED") {
    throw new BusinessRuleError(
      `A ${season.status.toLowerCase()} season cannot generate fixtures`,
      "SEASON_LOCKED"
    );
  }

  // Age group must belong to the season.
  const ageGroup = await prisma.ageGroup.findUnique({
    where: { id: ageGroupId },
    select: { id: true, seasonId: true, name: true },
  });

  if (!ageGroup || ageGroup.seasonId !== seasonId) {
    throw new NotFoundError("Age group not found", "AGE_GROUP_NOT_FOUND");
  }

  // Block if fixtures already exist — season has begun.
  const existingCount = await prisma.fixture.count({
    where: { ageGroupId },
  });

  if (existingCount > 0) {
    throw new ConflictError(
      "Fixtures already exist for this age group",
      "FIXTURES_ALREADY_EXIST"
    );
  }

  // Get the teams in this age group.
  const teams = await prisma.team.findMany({
    where: { ageGroupId },
    select: { id: true },
    orderBy: { id: "asc" },
  });

  if (teams.length < 2) {
    throw new BusinessRuleError(
      "At least 2 teams are required to generate fixtures",
      "NOT_ENOUGH_TEAMS"
    );
  }

  const teamIds = teams.map((t) => t.id);

  // Generate the schedule (pure function).
  const schedule = generateRoundRobin(teamIds, options);

  // Persist in a transaction.
  return prisma.$transaction(async (tx) => {
    await tx.fixture.createMany({
      data: schedule.map((f) => ({
        seasonId,
        ageGroupId,
        homeTeamId: f.homeTeamId,
        awayTeamId: f.awayTeamId,
        roundNumber: f.roundNumber,
        status: "SCHEDULED" as const,
      })),
    });

    return tx.fixture.findMany({
      where: { ageGroupId },
      orderBy: [{ roundNumber: "asc" }],
      include: FIXTURE_INCLUDE,
    });
  });
}

// ---------------------------------------------------------------------------
// List / get
// ---------------------------------------------------------------------------

export async function listFixturesByAgeGroup(
  seasonId: string,
  ageGroupId: string
) {
  const ageGroup = await prisma.ageGroup.findUnique({
    where: { id: ageGroupId },
    select: { id: true, seasonId: true },
  });

  if (!ageGroup || ageGroup.seasonId !== seasonId) {
    throw new NotFoundError("Age group not found", "AGE_GROUP_NOT_FOUND");
  }

  return prisma.fixture.findMany({
    where: { ageGroupId },
    orderBy: [{ roundNumber: "asc" }],
    include: FIXTURE_INCLUDE,
  });
}

export async function getFixtureById(id: string) {
  const fixture = await prisma.fixture.findUnique({
    where: { id },
    include: {
      ...FIXTURE_INCLUDE,
      season: { select: { id: true, name: true } },
      ageGroup: { select: { id: true, name: true } },
    },
  });

  if (!fixture) {
    throw new NotFoundError("Fixture not found", "FIXTURE_NOT_FOUND");
  }

  return fixture;
}

// ---------------------------------------------------------------------------
// Clear (guarded)
// ---------------------------------------------------------------------------

export async function clearFixtures(seasonId: string, ageGroupId: string) {
  const ageGroup = await prisma.ageGroup.findUnique({
    where: { id: ageGroupId },
    select: { id: true, seasonId: true },
  });

  if (!ageGroup || ageGroup.seasonId !== seasonId) {
    throw new NotFoundError("Age group not found", "AGE_GROUP_NOT_FOUND");
  }

  // Block if any fixture has been scheduled (has a date/ground) or has a match.
  const scheduledOrPlayed = await prisma.fixture.count({
    where: {
      ageGroupId,
      OR: [
        { scheduled_date: { not: null } },
        { groundId: { not: null } },
        { match: { isNot: null } },
      ],
    },
  });

  if (scheduledOrPlayed > 0) {
    throw new BusinessRuleError(
      "Fixtures have been scheduled or played and cannot be cleared",
      "FIXTURES_LOCKED"
    );
  }

  const deleted = await prisma.fixture.deleteMany({ where: { ageGroupId } });
  return { deleted: deleted.count };
}