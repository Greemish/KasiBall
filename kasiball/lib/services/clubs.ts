import { prisma } from "@/lib/prisma";
import { BusinessRuleError, NotFoundError } from "@/lib/errors";
import type {
  CreateClubInput,
  UpdateClubInput,
} from "@/lib/validations/club";

export async function listClubs() {
  return prisma.club.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { teams: true, managers: true },
      },
    },
  });
}

export async function getClubById(id: string) {
  const club = await prisma.club.findUnique({
    where: { id },
    include: {
      _count: {
        select: { teams: true, managers: true },
      },
    },
  });

  if (!club) {
    throw new NotFoundError("Club not found", "CLUB_NOT_FOUND");
  }

  return club;
}

export async function createClub(input: CreateClubInput) {
  // Duplicate name → P2002 → 409 (handled centrally)
  return prisma.club.create({
    data: {
      name: input.name,
      shortName: input.shortName ?? null,
      logoUrl: input.logoUrl ?? null,
    },
  });
}

export async function updateClub(id: string, input: UpdateClubInput) {
  await getClubById(id);

  const data: Record<string, unknown> = {
    name: input.name,
    shortName: input.shortName,
    logoUrl: input.logoUrl,
  };

  const cleaned = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );

  if (Object.keys(cleaned).length === 0) {
    throw new BusinessRuleError("No changes provided", "NO_CHANGES");
  }

  return prisma.club.update({
    where: { id },
    data: cleaned,
  });
}