import { prisma } from "@/lib/prisma";
import { NotFoundError, BusinessRuleError } from "@/lib/errors";
import type {
  CreateSeasonInput,
  UpdateSeasonInput,
} from "@/lib/validations/season";

const TERMINAL_STATUSES = ["COMPLETED", "CANCELLED"] as const;

export async function listSeasons() {
  return prisma.season.findMany({
    orderBy: { startDate: "desc" },
  });
}

export async function getSeasonById(id: string) {
  const season = await prisma.season.findUnique({
    where: { id },
  });

  if (!season) {
    throw new NotFoundError("Season not found", "SEASON_NOT_FOUND");
  }

  return season;
}

export async function createSeason(input: CreateSeasonInput) {
  return prisma.season.create({
    data: {
      name: input.name,
      startDate: input.startDate,
      endDate: input.endDate,
    },
  });
}

export async function updateSeason(id: string, input: UpdateSeasonInput) {
  const season = await getSeasonById(id);

  // Terminal states cannot be changed at all.
  if (
    TERMINAL_STATUSES.includes(
      season.status as (typeof TERMINAL_STATUSES)[number]
    )
  ) {
    throw new BusinessRuleError(
      `A ${season.status.toLowerCase()} season can no longer be changed`,
      "SEASON_LOCKED"
    );
  }

  const data: Record<string, unknown> = {
    name: input.name,
    startDate: input.startDate,
    endDate: input.endDate,
    status: input.status,
  };

  if (input.status === "CANCELLED") {
    data.cancelledAt = new Date();
    data.cancellationReason = input.cancellationReason;
  }

  // Strip undefined so untouched fields aren't overwritten.
  const cleaned = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );

  return prisma.season.update({
    where: { id },
    data: cleaned,
  });
}