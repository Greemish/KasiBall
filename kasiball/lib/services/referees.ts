import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  NotFoundError,
  BusinessRuleError,
  ConflictError,
} from "@/lib/errors";
import type {
  CreateRefereeInput,
  UpdateRefereeInput,
} from "@/lib/validations/referee";

const REFEREE_INCLUDE = {
  user: { select: { id: true, email: true, isActive: true } },
} as const;

export async function listReferees(filter?: { isActive?: boolean }) {
  return prisma.referee.findMany({
    where:
      filter?.isActive !== undefined ? { isActive: filter.isActive } : undefined,
    orderBy: { lastName: "asc" },
    include: REFEREE_INCLUDE,
  });
}

export async function getRefereeById(id: string) {
  const referee = await prisma.referee.findUnique({
    where: { id },
    include: REFEREE_INCLUDE,
  });

  if (!referee) {
    throw new NotFoundError("Referee not found", "REFEREE_NOT_FOUND");
  }

  return referee;
}

export async function createReferee(input: CreateRefereeInput) {
  const email = input.email.toLowerCase();

  // Email must be unique (a User with it must not already exist).
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ConflictError(
      "A user with this email already exists",
      "EMAIL_IN_USE"
    );
  }

  const passwordHash = await hash(input.password, 10);

  // Create the User + Referee atomically.
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        role: "REFEREE",
        isActive: true,
      },
    });

    return tx.referee.create({
      data: {
        userId: user.id,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone ?? null,
        licenseNumber: input.licenseNumber ?? null,
        isActive: true,
      },
      include: REFEREE_INCLUDE,
    });
  });
}

export async function updateReferee(id: string, input: UpdateRefereeInput) {
  await getRefereeById(id);

  const data: Record<string, unknown> = {
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone,
    licenseNumber: input.licenseNumber,
    isActive: input.isActive,
  };

  const cleaned = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );

  if (Object.keys(cleaned).length === 0) {
    throw new BusinessRuleError("No changes provided", "NO_CHANGES");
  }

  return prisma.referee.update({
    where: { id },
    data: cleaned,
    include: REFEREE_INCLUDE,
  });
}