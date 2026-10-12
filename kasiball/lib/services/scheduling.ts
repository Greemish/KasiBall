import { prisma } from "@/lib/prisma";
import {
  NotFoundError,
  BusinessRuleError,
  ConflictError,
} from "@/lib/errors";
import type { ScheduleFixtureInput } from "@/lib/validations/schedule";

function timesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function dbTimeToMinutes(t: Date): number {
  return t.getUTCHours() * 60 + t.getUTCMinutes();
}

export async function validateScheduleSlot(
  fixtureId: string,
  input: ScheduleFixtureInput
) {
  const fixture = await prisma.fixture.findUnique({
    where: { id: fixtureId },
    include: { season: { select: { matchDurationMinutes: true } } },
  });

  if (!fixture) {
    throw new NotFoundError("Fixture not found", "FIXTURE_NOT_FOUND");
  }

  const duration = fixture.season.matchDurationMinutes;
  const newStart = toMinutes(input.kickoffTime);
  const newEnd = newStart + duration;

  const dayStart = new Date(input.scheduledDate);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  const sameDayFixtures = await prisma.fixture.findMany({
    where: {
      id: { not: fixtureId },
      scheduled_date: { gte: dayStart, lt: dayEnd },
      kickoff_time: { not: null },
    },
    include: {
      season: { select: { matchDurationMinutes: true } },
    },
  });

  for (const other of sameDayFixtures) {
    if (other.groundId !== input.groundId) continue;
    if (!other.kickoff_time) continue;

    const otherStart = dbTimeToMinutes(other.kickoff_time);
    const otherEnd = otherStart + other.season.matchDurationMinutes;

    if (timesOverlap(newStart, newEnd, otherStart, otherEnd)) {
      throw new ConflictError(
        "This ground is already booked at that time",
        "GROUND_CLASH"
      );
    }
  }

  if (input.refereeId) {
    for (const other of sameDayFixtures) {
      if (other.refereeId !== input.refereeId) continue;
      if (!other.kickoff_time) continue;

      const otherStart = dbTimeToMinutes(other.kickoff_time);
      const otherEnd = otherStart + other.season.matchDurationMinutes;

      if (timesOverlap(newStart, newEnd, otherStart, otherEnd)) {
        throw new ConflictError(
          "This referee is already officiating at that time",
          "REFEREE_CLASH"
        );
      }
    }
  }

  for (const other of sameDayFixtures) {
    if (!other.kickoff_time) continue;

    const involvesHome =
      other.homeTeamId === fixture.homeTeamId ||
      other.awayTeamId === fixture.homeTeamId;
    const involvesAway =
      other.homeTeamId === fixture.awayTeamId ||
      other.awayTeamId === fixture.awayTeamId;

    if (!involvesHome && !involvesAway) continue;

    const otherStart = dbTimeToMinutes(other.kickoff_time);
    const otherEnd = otherStart + other.season.matchDurationMinutes;

    if (timesOverlap(newStart, newEnd, otherStart, otherEnd)) {
      throw new ConflictError(
        "One of these teams is already playing at that time",
        "TEAM_CLASH"
      );
    }
  }
}

export async function scheduleFixture(
  fixtureId: string,
  input: ScheduleFixtureInput
) {
  await validateScheduleSlot(fixtureId, input);

  const ground = await prisma.ground.findUnique({
    where: { id: input.groundId },
    select: { id: true },
  });
  if (!ground) {
    throw new NotFoundError("Ground not found", "GROUND_NOT_FOUND");
  }

  if (input.refereeId) {
    const referee = await prisma.referee.findUnique({
      where: { id: input.refereeId },
      select: { id: true },
    });
    if (!referee) {
      throw new NotFoundError("Referee not found", "REFEREE_NOT_FOUND");
    }
  }

  const [h, m] = input.kickoffTime.split(":").map(Number);
  const kickoff = new Date(Date.UTC(1970, 0, 1, h, m, 0));

  return prisma.$transaction(async (tx) => {
    const updated = await tx.fixture.update({
      where: { id: fixtureId },
      data: {
        scheduled_date: input.scheduledDate,
        kickoff_time: kickoff,
        groundId: input.groundId,
        refereeId: input.refereeId ?? null,
        status: "SCHEDULED",
      },
      include: {
        match: { select: { id: true } },
      },
    });

    if (!updated.match) {
      await tx.match.create({
        data: {
          fixtureId: updated.id,
          status: "NOT_STARTED",
          homeScore: 0,
          awayScore: 0,
        },
      });
    }

    return tx.fixture.findUniqueOrThrow({
      where: { id: fixtureId },
      include: {
        homeTeam: { select: { id: true, name: true } },
        awayTeam: { select: { id: true, name: true } },
        ground: { select: { id: true, name: true } },
        referee: { select: { id: true, firstName: true, lastName: true } },
        season: { select: { id: true, name: true, matchDurationMinutes: true } },
        match: { select: { id: true, status: true } },
      },
    });
  });
}

export async function unscheduleFixture(fixtureId: string) {
  const fixture = await prisma.fixture.findUnique({
    where: { id: fixtureId },
    include: {
      match: {
        include: {
          _count: { select: { squads: true, events: true, forfeits: true } },
        },
      },
    },
  });

  if (!fixture) {
    throw new NotFoundError("Fixture not found", "FIXTURE_NOT_FOUND");
  }

  if (fixture.match) {
    const m = fixture.match;
    const isEmpty =
      m.status === "NOT_STARTED" &&
      m._count.squads === 0 &&
      m._count.events === 0 &&
      m._count.forfeits === 0;

    if (!isEmpty) {
      throw new BusinessRuleError(
        "This match has data and cannot be unscheduled",
        "FIXTURE_HAS_MATCH"
      );
    }

    await prisma.match.delete({ where: { id: m.id } });
  }

  return prisma.fixture.update({
    where: { id: fixtureId },
    data: {
      scheduled_date: null,
      kickoff_time: null,
      groundId: null,
      refereeId: null,
      status: "SCHEDULED",
    },
  });
}