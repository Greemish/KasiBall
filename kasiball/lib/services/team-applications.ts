import { prisma } from "@/lib/prisma";
import {
  NotFoundError,
  BusinessRuleError,
} from "@/lib/errors";
import type { CreateTeamApplicationInput } from "@/lib/validations/team-application";

const OPEN_STATUSES = ["PENDING", "UNDER_REVIEW", "CHANGES_REQUESTED"] as const;

export async function createTeamApplication(
  managerId: string,
  input: CreateTeamApplicationInput
) {
  // Age group must exist
  const ageGroup = await prisma.ageGroup.findUnique({
    where: { id: input.ageGroupId },
    select: { id: true },
  });

  if (!ageGroup) {
    throw new NotFoundError("Age group not found", "AGE_GROUP_NOT_FOUND");
  }

  // Block a second open application for the same manager + age group
  const existing = await prisma.teamApplication.findFirst({
    where: {
      managerId,
      ageGroupId: input.ageGroupId,
      status: { in: [...OPEN_STATUSES] },
    },
    select: { id: true, status: true },
  });

  if (existing) {
    throw new BusinessRuleError(
      "You already have an open application for this age group",
      "APPLICATION_ALREADY_OPEN"
    );
  }

  return prisma.teamApplication.create({
    data: {
      managerId,
      ageGroupId: input.ageGroupId,
      teamName: input.teamName,
      clubName: input.clubName,
      kitDescription: input.kitDescription ?? null,
      notes: input.notes ?? null,
      status: "PENDING",
    },
  });
}

export async function listOwnApplications(managerId: string) {
  return prisma.teamApplication.findMany({
    where: { managerId },
    orderBy: { submittedAt: "desc" },
    include: {
      ageGroup: {
        select: { id: true, name: true, seasonId: true },
      },
    },
  });
}

export async function getOwnApplication(
  managerId: string,
  applicationId: string
) {
  const application = await prisma.teamApplication.findUnique({
    where: { id: applicationId },
    include: {
      ageGroup: {
        select: { id: true, name: true, seasonId: true },
      },
    },
  });

  if (!application) {
    throw new NotFoundError(
      "Application not found",
      "APPLICATION_NOT_FOUND"
    );
  }

  // Ownership: a manager may only see their own applications.
  if (application.managerId !== managerId) {
    throw new NotFoundError(
      "Application not found",
      "APPLICATION_NOT_FOUND"
    );
  }

  return application;
}

// ---------------------------------------------------------------------------
// Admin-side operations
// ---------------------------------------------------------------------------

export async function listApplications(filter?: {
  status?: "PENDING" | "UNDER_REVIEW" | "CHANGES_REQUESTED" | "APPROVED" | "REJECTED";
}) {
  return prisma.teamApplication.findMany({
    where: filter?.status ? { status: filter.status } : undefined,
    orderBy: { submittedAt: "desc" },
    include: {
      ageGroup: {
        select: {
          id: true,
          name: true,
          season: { select: { id: true, name: true } },
        },
      },
      manager: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
    },
  });
}

export async function getApplicationById(id: string) {
  const application = await prisma.teamApplication.findUnique({
    where: { id },
    include: {
      ageGroup: {
        select: {
          id: true,
          name: true,
          season: { select: { id: true, name: true } },
        },
      },
      manager: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
    },
  });

  if (!application) {
    throw new NotFoundError(
      "Application not found",
      "APPLICATION_NOT_FOUND"
    );
  }

  return application;
}

export async function reviewApplication(
  id: string,
  reviewerId: string,
  input: { status: "UNDER_REVIEW" | "CHANGES_REQUESTED" | "REJECTED"; reviewNotes?: string }
) {
  const application = await getApplicationById(id);

  if (application.status === "APPROVED" || application.status === "REJECTED") {
    throw new BusinessRuleError(
      `A ${application.status.toLowerCase()} application can no longer be reviewed`,
      "APPLICATION_LOCKED"
    );
  }

  return prisma.teamApplication.update({
    where: { id },
    data: {
      status: input.status,
      reviewNotes: input.reviewNotes ?? null,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
    },
  });
}

export async function approveApplication(
  id: string,
  reviewerId: string
) {
  const application = await getApplicationById(id);

  if (application.status === "APPROVED") {
    throw new BusinessRuleError(
      "This application is already approved",
      "APPLICATION_ALREADY_APPROVED"
    );
  }

  if (application.status === "REJECTED") {
    throw new BusinessRuleError(
      "A rejected application cannot be approved",
      "APPLICATION_REJECTED"
    );
  }

  // All of the following runs as one transaction.
  return prisma.$transaction(async (tx) => {
    // 1. Find or create the club by name
    let club = await tx.club.findUnique({
      where: { name: application.clubName! },
    });

    if (!club) {
      club = await tx.club.create({
        data: { name: application.clubName! },
      });
    }

    // 2. Link the applicant manager to the club (if not already in one)
    const manager = await tx.manager.findUnique({
      where: { id: application.managerId },
    });

    if (!manager) {
      throw new BusinessRuleError(
        "Applicant manager not found",
        "MANAGER_NOT_FOUND"
      );
    }

    if (manager.clubId !== club.id) {
      await tx.manager.update({
        where: { id: manager.id },
        data: { clubId: club.id },
      });
    }

    // 3. Guard: one team per club per age group
    const existingTeam = await tx.team.findFirst({
      where: {
        clubId: club.id,
        ageGroupId: application.ageGroupId,
      },
    });

    if (existingTeam) {
      throw new BusinessRuleError(
        "This club already has a team in that age group",
        "TEAM_ALREADY_EXISTS_FOR_AGE_GROUP"
      );
    }

    // 4. Create the team
    const team = await tx.team.create({
      data: {
        name: application.teamName,
        clubId: club.id,
        managerId: application.managerId,
        ageGroupId: application.ageGroupId,
        status: "APPROVED",
      },
    });

    // 5. Mark the application approved and link the team
    const updated = await tx.teamApplication.update({
      where: { id: application.id },
      data: {
        status: "APPROVED",
        approvedTeamId: team.id,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      },
    });

    return { application: updated, team, club };
  });
}