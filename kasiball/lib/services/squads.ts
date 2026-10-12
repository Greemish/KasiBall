import { prisma } from "@/lib/prisma";
import {
  NotFoundError,
  BusinessRuleError,
} from "@/lib/errors";
import { ForbiddenError } from "@/lib/auth";
import type { SetSquadInput } from "@/lib/validations/squad";

const EDITABLE_STATUSES = ["NOT_STARTED", "IN_PROGRESS"] as const;

/**
 * Sets (replaces) the full matchday squad for a manager's club team
 * in a given match.
 *
 * Enforces:
 * - match exists and is editable (not terminal)
 * - the manager's club owns one of the two teams in the fixture
 * - every playerRegistrationId belongs to that team, in the same season
 * - every player is VERIFIED
 * - no duplicate playerRegistrations
 */
export async function setMatchSquad(
  clubId: string,
  matchId: string,
  input: SetSquadInput
) {
  // 1. Load the match + fixture + both teams.
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      fixture: {
        select: {
          id: true,
          seasonId: true,
          homeTeamId: true,
          awayTeamId: true,
        },
      },
    },
  });

  if (!match) {
    throw new NotFoundError("Match not found", "MATCH_NOT_FOUND");
  }

  // 2. Editable?
  if (
    !EDITABLE_STATUSES.includes(
      match.status as (typeof EDITABLE_STATUSES)[number]
    )
  ) {
    throw new BusinessRuleError(
      `A ${match.status.toLowerCase()} match cannot be edited`,
      "MATCH_LOCKED"
    );
  }

  // 3. Which team in this fixture belongs to the manager's club?
  const teams = await prisma.team.findMany({
    where: {
      id: { in: [match.fixture.homeTeamId, match.fixture.awayTeamId] },
      clubId,
    },
    select: { id: true },
  });

  if (teams.length === 0) {
    throw new ForbiddenError(
      "Your club is not part of this match"
    );
  }

  const teamId = teams[0].id;

  // 4. No duplicate playerRegistrationIds in the payload.
  const ids = input.players.map((p) => p.playerRegistrationId);
  if (new Set(ids).size !== ids.length) {
    throw new BusinessRuleError(
      "Duplicate players in the squad",
      "DUPLICATE_PLAYERS"
    );
  }

  // 5. Every registration must belong to this team + season and be VERIFIED.
  const registrations = await prisma.playerRegistration.findMany({
    where: {
      id: { in: ids },
      teamId,
      seasonId: match.fixture.seasonId,
    },
    select: {
      id: true,
      registrationStatus: true,
    },
  });

  if (registrations.length !== ids.length) {
    throw new BusinessRuleError(
      "One or more players are not registered to this team for this season",
      "PLAYER_NOT_IN_TEAM"
    );
  }

  const unverified = registrations.filter(
    (r) => r.registrationStatus !== "VERIFIED"
  );
  if (unverified.length > 0) {
    throw new BusinessRuleError(
      "All selected players must be verified",
      "PLAYER_NOT_VERIFIED"
    );
  }

  // 6. Replace the squad in a transaction.
  return prisma.$transaction(async (tx) => {
    await tx.matchdaySquad.deleteMany({
      where: { matchId, teamId },
    });

    if (input.players.length > 0) {
      await tx.matchdaySquad.createMany({
        data: input.players.map((p) => ({
          matchId,
          teamId,
          playerRegistrationId: p.playerRegistrationId,
          starting: p.starting,
          substitute: p.substitute,
          goalkeeper: p.goalkeeper,
          shirtNumber: p.shirtNumber ?? null,
        })),
      });
    }

    return tx.matchdaySquad.findMany({
      where: { matchId, teamId },
      orderBy: [{ starting: "desc" }, { shirtNumber: "asc" }],
      include: {
        playerRegistration: {
          include: { player: true },
        },
      },
    });
  });
}

export async function getClubMatchSquad(
  clubId: string,
  matchId: string
) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      fixture: {
        select: { homeTeamId: true, awayTeamId: true },
      },
    },
  });

  if (!match) {
    throw new NotFoundError("Match not found", "MATCH_NOT_FOUND");
  }

  const teams = await prisma.team.findMany({
    where: {
      id: { in: [match.fixture.homeTeamId, match.fixture.awayTeamId] },
      clubId,
    },
    select: { id: true },
  });

  if (teams.length === 0) {
    throw new ForbiddenError("Your club is not part of this match");
  }

  const teamId = teams[0].id;

  return prisma.matchdaySquad.findMany({
    where: { matchId, teamId },
    orderBy: [{ starting: "desc" }, { shirtNumber: "asc" }],
    include: {
      playerRegistration: { include: { player: true } },
    },
  });
}

export async function getAdminMatchSquads(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
  });

  if (!match) {
    throw new NotFoundError("Match not found", "MATCH_NOT_FOUND");
  }

  return prisma.matchdaySquad.findMany({
    where: { matchId },
    orderBy: [
      { teamId: "asc" },
      { starting: "desc" },
      { shirtNumber: "asc" },
    ],
    include: {
      team: { select: { id: true, name: true } },
      playerRegistration: { include: { player: true } },
    },
  });
}