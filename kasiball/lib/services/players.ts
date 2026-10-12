import { prisma } from "@/lib/prisma";
import {
  NotFoundError,
  BusinessRuleError,
  ConflictError,
} from "@/lib/errors";
import type { RegisterPlayerInput } from "@/lib/validations/player";

// ---------------------------------------------------------------------------
// Manager: register a player to one of their club's teams
// ---------------------------------------------------------------------------

export async function registerPlayer(
  clubId: string,
  input: RegisterPlayerInput
) {
  // The team must belong to the manager's club.
  const team = await prisma.team.findUnique({
    where: { id: input.teamId },
    select: { id: true, clubId: true },
  });

  if (!team || team.clubId !== clubId) {
    throw new NotFoundError("Team not found", "TEAM_NOT_FOUND");
  }

  // The season must exist.
  const season = await prisma.season.findUnique({
    where: { id: input.seasonId },
    select: { id: true },
  });

  if (!season) {
    throw new NotFoundError("Season not found", "SEASON_NOT_FOUND");
  }

  // Find or create the Player by SA ID.
  let player = await prisma.player.findUnique({
    where: { saIdNumber: input.saIdNumber },
  });

  if (!player) {
    player = await prisma.player.create({
      data: {
        saIdNumber: input.saIdNumber,
        firstName: input.firstName,
        lastName: input.lastName,
        dateOfBirth: input.dateOfBirth,
      },
    });
  }

  // One team per player per season.
  const existingRegistration = await prisma.playerRegistration.findFirst({
    where: {
      playerId: player.id,
      seasonId: input.seasonId,
    },
    select: { id: true, teamId: true },
  });

  if (existingRegistration) {
    if (existingRegistration.teamId === input.teamId) {
      throw new ConflictError(
        "This player is already registered to your team for this season",
        "PLAYER_ALREADY_REGISTERED"
      );
    }
    throw new BusinessRuleError(
      "This player is already registered to another team this season",
      "PLAYER_REGISTERED_ELSEWHERE"
    );
  }

  return prisma.playerRegistration.create({
    data: {
      playerId: player.id,
      teamId: input.teamId,
      seasonId: input.seasonId,
      shirtNumber: input.shirtNumber ?? null,
      registrationStatus: "PENDING",
    },
    include: {
      player: true,
      team: { select: { id: true, name: true } },
      season: { select: { id: true, name: true } },
    },
  });
}

export async function listClubPlayerRegistrations(clubId: string) {
  return prisma.playerRegistration.findMany({
    where: { team: { clubId } },
    orderBy: { createdAt: "desc" },
    include: {
      player: true,
      team: { select: { id: true, name: true } },
      season: { select: { id: true, name: true } },
    },
  });
}

export async function getClubPlayerRegistration(
  clubId: string,
  registrationId: string
) {
  const reg = await prisma.playerRegistration.findUnique({
    where: { id: registrationId },
    include: {
      player: true,
      team: { select: { id: true, name: true, clubId: true } },
      season: { select: { id: true, name: true } },
    },
  });

  if (!reg || reg.team.clubId !== clubId) {
    throw new NotFoundError(
      "Player registration not found",
      "PLAYER_REGISTRATION_NOT_FOUND"
    );
  }

  return reg;
}

// ---------------------------------------------------------------------------
// Admin: view all registrations
// ---------------------------------------------------------------------------

export async function listAllPlayerRegistrations(filter?: {
  seasonId?: string;
  teamId?: string;
  status?: "PENDING" | "VERIFIED" | "REJECTED";
}) {
  return prisma.playerRegistration.findMany({
    where: {
      ...(filter?.seasonId ? { seasonId: filter.seasonId } : {}),
      ...(filter?.teamId ? { teamId: filter.teamId } : {}),
      ...(filter?.status ? { registrationStatus: filter.status } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      player: true,
      team: {
        select: {
          id: true,
          name: true,
          club: { select: { id: true, name: true } },
        },
      },
      season: { select: { id: true, name: true } },
    },
  });
}

export async function getPlayerRegistrationById(id: string) {
  const reg = await prisma.playerRegistration.findUnique({
    where: { id },
    include: {
      player: true,
      team: {
        select: {
          id: true,
          name: true,
          club: { select: { id: true, name: true } },
        },
      },
      season: { select: { id: true, name: true } },
    },
  });

  if (!reg) {
    throw new NotFoundError(
      "Player registration not found",
      "PLAYER_REGISTRATION_NOT_FOUND"
    );
  }

  return reg;
}

// ---------------------------------------------------------------------------
// Admin: verification workflow
// ---------------------------------------------------------------------------

export async function verifyRegistration(
  id: string,
  reviewerId: string
) {
  const reg = await getPlayerRegistrationById(id);

  if (reg.registrationStatus === "VERIFIED") {
    throw new BusinessRuleError(
      "This registration is already verified",
      "REGISTRATION_ALREADY_VERIFIED"
    );
  }

  if (reg.registrationStatus === "REJECTED") {
    throw new BusinessRuleError(
      "A rejected registration cannot be verified",
      "REGISTRATION_REJECTED"
    );
  }

  return prisma.playerRegistration.update({
    where: { id },
    data: {
      registrationStatus: "VERIFIED",
      reviewNotes: null,
      verifiedBy: reviewerId,
      verifiedAt: new Date(),
    },
    include: {
      player: true,
      team: { select: { id: true, name: true } },
      season: { select: { id: true, name: true } },
    },
  });
}

export async function requestRegistrationChanges(
  id: string,
  reviewerId: string,
  reviewNotes: string
) {
  const reg = await getPlayerRegistrationById(id);

  if (
    reg.registrationStatus === "VERIFIED" ||
    reg.registrationStatus === "REJECTED"
  ) {
    throw new BusinessRuleError(
      `A ${reg.registrationStatus.toLowerCase()} registration can no longer be changed`,
      "REGISTRATION_LOCKED"
    );
  }

  return prisma.playerRegistration.update({
    where: { id },
    data: {
      registrationStatus: "CHANGES_REQUESTED",
      reviewNotes,
      verifiedBy: reviewerId,
      verifiedAt: new Date(),
    },
    include: {
      player: true,
      team: { select: { id: true, name: true } },
      season: { select: { id: true, name: true } },
    },
  });
}

export async function rejectRegistration(
  id: string,
  reviewerId: string,
  reviewNotes: string
) {
  const reg = await getPlayerRegistrationById(id);

  if (reg.registrationStatus === "VERIFIED") {
    throw new BusinessRuleError(
      "A verified registration cannot be rejected",
      "REGISTRATION_LOCKED"
    );
  }

  if (reg.registrationStatus === "REJECTED") {
    throw new BusinessRuleError(
      "This registration is already rejected",
      "REGISTRATION_ALREADY_REJECTED"
    );
  }

  return prisma.playerRegistration.update({
    where: { id },
    data: {
      registrationStatus: "REJECTED",
      reviewNotes,
      verifiedBy: reviewerId,
      verifiedAt: new Date(),
    },
    include: {
      player: true,
      team: { select: { id: true, name: true } },
      season: { select: { id: true, name: true } },
    },
  });
}

// ---------------------------------------------------------------------------
// Manager: resubmit a CHANGES_REQUESTED registration
// ---------------------------------------------------------------------------

export async function resubmitRegistration(
  clubId: string,
  registrationId: string,
  input: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: Date;
    shirtNumber?: number | null;
  }
) {
  const reg = await getClubPlayerRegistration(clubId, registrationId);

  if (reg.registrationStatus !== "CHANGES_REQUESTED") {
    throw new BusinessRuleError(
      "Only registrations with requested changes can be resubmitted",
      "REGISTRATION_NOT_EDITABLE"
    );
  }

  // Update player fields if provided
  const playerData: Record<string, unknown> = {
    firstName: input.firstName,
    lastName: input.lastName,
    dateOfBirth: input.dateOfBirth,
  };
  const cleanedPlayer = Object.fromEntries(
    Object.entries(playerData).filter(([, v]) => v !== undefined)
  );

  if (Object.keys(cleanedPlayer).length > 0) {
    await prisma.player.update({
      where: { id: reg.playerId },
      data: cleanedPlayer,
    });
  }

  // Reset the registration to PENDING
  return prisma.playerRegistration.update({
    where: { id: registrationId },
    data: {
      registrationStatus: "PENDING",
      reviewNotes: null,
      shirtNumber:
        input.shirtNumber !== undefined ? input.shirtNumber : undefined,
    },
    include: {
      player: true,
      team: { select: { id: true, name: true } },
      season: { select: { id: true, name: true } },
    },
  });
}