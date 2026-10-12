import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";

const MATCH_INCLUDE = {
  fixture: {
    include: {
      homeTeam: {
        select: { id: true, name: true, club: { select: { id: true, name: true } } },
      },
      awayTeam: {
        select: { id: true, name: true, club: { select: { id: true, name: true } } },
      },
      ground: { select: { id: true, name: true } },
      referee: { select: { id: true, firstName: true, lastName: true } },
      season: { select: { id: true, name: true, matchDurationMinutes: true } },
      ageGroup: { select: { id: true, name: true } },
    },
  },
} as const;

export async function listMatches(filter?: {
  seasonId?: string;
  ageGroupId?: string;
  status?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "FORFEITED" | "ABANDONED" | "NO_RESULT";
}) {
  return prisma.match.findMany({
    where: {
      ...(filter?.status ? { status: filter.status } : {}),
      ...(filter?.seasonId || filter?.ageGroupId
        ? {
            fixture: {
              ...(filter?.seasonId ? { seasonId: filter.seasonId } : {}),
              ...(filter?.ageGroupId ? { ageGroupId: filter.ageGroupId } : {}),
            },
          }
        : {}),
    },
    orderBy: { fixture: { scheduled_date: "asc" } },
    include: MATCH_INCLUDE,
  });
}

export async function getMatchById(id: string) {
  const match = await prisma.match.findUnique({
    where: { id },
    include: MATCH_INCLUDE,
  });

  if (!match) {
    throw new NotFoundError("Match not found", "MATCH_NOT_FOUND");
  }

  return match;
}

export async function getMatchByFixtureId(fixtureId: string) {
  const match = await prisma.match.findUnique({
    where: { fixtureId },
    include: MATCH_INCLUDE,
  });

  if (!match) {
    throw new NotFoundError("Match not found", "MATCH_NOT_FOUND");
  }

  return match;
}

import {
  BusinessRuleError,
} from "@/lib/errors";
import {
    ForbiddenError,
} from "@/lib/auth";
import type { RecordEventInput } from "@/lib/validations/match-event";

// ---------------------------------------------------------------------------
// Referee access
// ---------------------------------------------------------------------------

/**
 * Loads a match and asserts the given referee is the one assigned to
 * its fixture. Throws ForbiddenError otherwise.
 */
export async function getRefereeMatch(refereeId: string, matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      ...MATCH_INCLUDE,
      events: {
        orderBy: { minute: "asc" },
        include: {
          team: { select: { id: true, name: true } },
          playerRegistration: { include: { player: true } },
        },
      },
    },
  });

  if (!match) {
    throw new NotFoundError("Match not found", "MATCH_NOT_FOUND");
  }

  if (match.fixture.referee?.id !== refereeId) {
    throw new ForbiddenError("You are not assigned to this match");
  }

  return match;
}

export async function listRefereeMatches(refereeId: string) {
  return prisma.match.findMany({
    where: { fixture: { refereeId } },
    orderBy: { fixture: { scheduled_date: "asc" } },
    include: MATCH_INCLUDE,
  });
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

export async function startMatch(refereeId: string, matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { fixture: { select: { refereeId: true } } },
  });

  if (!match) {
    throw new NotFoundError("Match not found", "MATCH_NOT_FOUND");
  }

  if (match.fixture.refereeId !== refereeId) {
    throw new ForbiddenError("You are not assigned to this match");
  }

  if (match.status !== "NOT_STARTED") {
    throw new BusinessRuleError(
      `A ${match.status.toLowerCase()} match cannot be started`,
      "MATCH_NOT_STARTABLE"
    );
  }

  return prisma.match.update({
    where: { id: matchId },
    data: { status: "IN_PROGRESS" },
    include: MATCH_INCLUDE,
  });
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export async function recordEvent(
  refereeId: string,
  matchId: string,
  input: RecordEventInput
) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      fixture: {
        select: { refereeId: true, homeTeamId: true, awayTeamId: true },
      },
    },
  });

  if (!match) {
    throw new NotFoundError("Match not found", "MATCH_NOT_FOUND");
  }

  if (match.fixture.refereeId !== refereeId) {
    throw new ForbiddenError("You are not assigned to this match");
  }

  if (match.status !== "IN_PROGRESS") {
    throw new BusinessRuleError(
      "Events can only be recorded while the match is in progress",
      "MATCH_NOT_IN_PROGRESS"
    );
  }

  // The team must be one of the two in this fixture.
  if (
    input.teamId !== match.fixture.homeTeamId &&
    input.teamId !== match.fixture.awayTeamId
  ) {
    throw new BusinessRuleError(
      "Team is not part of this match",
      "TEAM_NOT_IN_MATCH"
    );
  }

  // If a player is named, they must be registered to that team for this season.
  if (input.playerRegistrationId) {
    const reg = await prisma.playerRegistration.findFirst({
      where: {
        id: input.playerRegistrationId,
        teamId: input.teamId,
      },
      select: { id: true },
    });
    if (!reg) {
      throw new BusinessRuleError(
        "Player is not registered to this team",
        "PLAYER_NOT_IN_TEAM"
      );
    }
  }

  return prisma.matchEvent.create({
    data: {
      matchId,
      teamId: input.teamId,
      playerRegistrationId: input.playerRegistrationId ?? null,
      assistPlayerRegistrationId: input.assistPlayerRegistrationId ?? null,
      eventType: input.eventType,
      minute: input.minute ?? null,
      notes: input.notes ?? null,
    },
  });
}

export async function deleteEvent(
  refereeId: string,
  matchId: string,
  eventId: string
) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { fixture: { select: { refereeId: true } } },
  });

  if (!match) {
    throw new NotFoundError("Match not found", "MATCH_NOT_FOUND");
  }

  if (match.fixture.refereeId !== refereeId) {
    throw new ForbiddenError("You are not assigned to this match");
  }

  if (match.status !== "IN_PROGRESS") {
    throw new BusinessRuleError(
      "Events can only be removed while the match is in progress",
      "MATCH_NOT_IN_PROGRESS"
    );
  }

  const event = await prisma.matchEvent.findUnique({ where: { id: eventId } });
  if (!event || event.matchId !== matchId) {
    throw new NotFoundError("Event not found", "EVENT_NOT_FOUND");
  }

  await prisma.matchEvent.delete({ where: { id: eventId } });
  return { deleted: true };
}

// ---------------------------------------------------------------------------
// Submit (compute score from events)
// ---------------------------------------------------------------------------

export async function submitMatch(refereeId: string, matchId: string, id: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      fixture: { select: { refereeId: true, homeTeamId: true, awayTeamId: true } },
      events: true,
    },
  });

  if (!match) {
    throw new NotFoundError("Match not found", "MATCH_NOT_FOUND");
  }

  if (match.fixture.refereeId !== refereeId) {
    throw new ForbiddenError("You are not assigned to this match");
  }

  if (match.status !== "IN_PROGRESS") {
    throw new BusinessRuleError(
      "Only an in-progress match can be submitted",
      "MATCH_NOT_IN_PROGRESS"
    );
  }

  const homeId = match.fixture.homeTeamId;
  const awayId = match.fixture.awayTeamId;

  let homeScore = 0;
  let awayScore = 0;

  for (const e of match.events) {
    if (e.eventType === "GOAL") {
      if (e.teamId === homeId) homeScore++;
      else if (e.teamId === awayId) awayScore++;
    } else if (e.eventType === "OWN_GOAL") {
      // Own goal counts for the OPPOSING team.
      if (e.teamId === homeId) awayScore++;
      else if (e.teamId === awayId) homeScore++;
    }
  }

  return prisma.match.update({
    where: { id: matchId },
    data: {
      homeScore,
      awayScore,
      status: "COMPLETED",
      submittedBy: match.submittedBy, // keep; we set below via the user id param
    },
    include: MATCH_INCLUDE,
  });
}

// ---------------------------------------------------------------------------
// Admin reopen
// ---------------------------------------------------------------------------

export async function reopenMatch(matchId: string) {
  const match = await prisma.match.findUnique({ where: { id: matchId } });

  if (!match) {
    throw new NotFoundError("Match not found", "MATCH_NOT_FOUND");
  }

  if (match.status !== "COMPLETED") {
    throw new BusinessRuleError(
      "Only a completed match can be reopened",
      "MATCH_NOT_COMPLETED"
    );
  }

  return prisma.match.update({
    where: { id: matchId },
    data: { status: "IN_PROGRESS" },
    include: MATCH_INCLUDE,
  });
}