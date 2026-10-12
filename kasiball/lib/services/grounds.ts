import { prisma } from "@/lib/prisma";
import { NotFoundError, BusinessRuleError } from "@/lib/errors";
import type {
  CreateGroundInput,
  UpdateGroundInput,
} from "@/lib/validations/ground";

export async function listGrounds(filter?: { isActive?: boolean }) {
  return prisma.ground.findMany({
    where:
      filter?.isActive !== undefined
        ? { isActive: filter.isActive }
        : undefined,
    orderBy: { name: "asc" },
  });
}

export async function getGroundById(id: string) {
  const ground = await prisma.ground.findUnique({ where: { id } });

  if (!ground) {
    throw new NotFoundError("Ground not found", "GROUND_NOT_FOUND");
  }

  return ground;
}

export async function createGround(input: CreateGroundInput) {
  return prisma.ground.create({
    data: {
      name: input.name,
      location: input.location ?? null,
      address: input.address ?? null,
      capacity: input.capacity ?? null,
    },
  });
}

export async function updateGround(id: string, input: UpdateGroundInput) {
  await getGroundById(id);

  const data: Record<string, unknown> = {
    name: input.name,
    location: input.location,
    address: input.address,
    capacity: input.capacity,
    isActive: input.isActive,
  };

  const cleaned = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );

  if (Object.keys(cleaned).length === 0) {
    throw new BusinessRuleError("No changes provided", "NO_CHANGES");
  }

  return prisma.ground.update({
    where: { id },
    data: cleaned,
  });
}