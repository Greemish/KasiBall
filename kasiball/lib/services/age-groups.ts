import { prisma } from "@/lib/prisma";
import { NotFoundError, BusinessRuleError } from "@/lib/errors";
import type {
  CreateAgeGroupInput,
  UpdateAgeGroupInput,
} from "@/lib/validations/age-group";

export async function listAgeGroups(seasonId: string) {
  // Ensure the season exists so we return 404, not an empty list.
  const season = await prisma.season.findUnique({
    where: { id: seasonId },
  });

  if (!season) {
    throw new NotFoundError("Season not found", "SEASON_NOT_FOUND");
  }

  return prisma.ageGroup.findMany({
    where: { seasonId },
    orderBy: { name: "asc" },
  });
}

export async function getAgeGroupById(id: string) {
  const ageGroup = await prisma.ageGroup.findUnique({
    where: { id },
  });

  if (!ageGroup) {
    throw new NotFoundError("Age group not found", "AGE_GROUP_NOT_FOUND");
  }

  return ageGroup;
}

export async function createAgeGroup(
  seasonId: string,
  input: CreateAgeGroupInput
) {
  // Ensure the season exists before creating under it.
  const season = await prisma.season.findUnique({
    where: { id: seasonId },
  });

  if (!season) {
    throw new NotFoundError("Season not found", "SEASON_NOT_FOUND");
  }

  // Unique constraint [seasonId, name] is enforced by the DB;
  // a duplicate throws P2002, which handleRouteError maps to 409.
  return prisma.ageGroup.create({
    data: {
      seasonId,
      name: input.name,
      maxAge: input.maxAge,
      minAge: input.minAge ?? null,
    },
  });
}

export async function updateAgeGroup(
  id: string,
  input: UpdateAgeGroupInput
) {
  await getAgeGroupById(id);

  const data: Record<string, unknown> = {
    name: input.name,
    maxAge: input.maxAge,
    minAge: input.minAge,
  };

  // Strip undefined so untouched fields aren't overwritten.
  // Note: null is preserved intentionally (clears minAge).
  const cleaned = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );

  if (Object.keys(cleaned).length === 0) {
    throw new BusinessRuleError(
      "No changes provided",
      "NO_CHANGES"
    );
  }

  return prisma.ageGroup.update({
    where: { id },
    data: cleaned,
  });
}