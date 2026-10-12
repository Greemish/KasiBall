import { prisma } from "@/lib/prisma";
import { NotFoundError, BusinessRuleError } from "@/lib/errors";
import type { UpdateTeamInput } from "@/lib/validations/team";

const TEAM_INCLUDE = {
  club: { select: { id: true, name: true, shortName: true } },
  ageGroup: { select: { id: true, name: true, seasonId: true } },
  manager: {
    select: { id: true, firstName: true, lastName: true, phone: true },
  },
} as const;

// ---------------------------------------------------------------------------
// Admin operations
// ---------------------------------------------------------------------------

export async function listTeams(filter?: {
  clubId?: string;
  ageGroupId?: string;
}) {
  return prisma.team.findMany({
    where: {
      ...(filter?.clubId ? { clubId: filter.clubId } : {}),
      ...(filter?.ageGroupId ? { ageGroupId: filter.ageGroupId } : {}),
    },
    orderBy: [{ club: { name: "asc" } }, { name: "asc" }],
    include: TEAM_INCLUDE,
  });
}

export async function getTeamById(id: string) {
  const team = await prisma.team.findUnique({
    where: { id },
    include: TEAM_INCLUDE,
  });

  if (!team) {
    throw new NotFoundError("Team not found", "TEAM_NOT_FOUND");
  }

  return team;
}

export async function updateTeam(id: string, input: UpdateTeamInput) {
  await getTeamById(id);

  const data: Record<string, unknown> = {
    name: input.name,
    shortName: input.shortName,
    logoUrl: input.logoUrl,
    status: input.status,
  };

  // Strip undefined (don't touch) but keep null (explicitly clear).
  const cleaned = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );

  if (Object.keys(cleaned).length === 0) {
    throw new BusinessRuleError("No changes provided", "NO_CHANGES");
  }

  return prisma.team.update({
    where: { id },
    data: cleaned,
    include: TEAM_INCLUDE,
  });
}

// ---------------------------------------------------------------------------
// Manager operations (club-scoped, read-only)
// ---------------------------------------------------------------------------

export async function listClubTeams(clubId: string) {
  return prisma.team.findMany({
    where: { clubId },
    orderBy: [{ ageGroup: { name: "asc" } }],
    include: TEAM_INCLUDE,
  });
}

export async function getClubTeam(clubId: string, teamId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: TEAM_INCLUDE,
  });

  if (!team) {
    throw new NotFoundError("Team not found", "TEAM_NOT_FOUND");
  }

  // Club-scoped: a manager may only see teams in their own club.
  // Returning 404 (not 403) avoids leaking that the team exists.
  if (team.clubId !== clubId) {
    throw new NotFoundError("Team not found", "TEAM_NOT_FOUND");
  }

  return team;
}