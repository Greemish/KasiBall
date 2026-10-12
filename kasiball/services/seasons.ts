import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createSeasonSchema } from "@/lib/validations/season";
import type { Role } from "@/lib/auth";

type CreateSeasonInput = z.infer<typeof createSeasonSchema>;

export async function createSeason(
  input: CreateSeasonInput,
  actor: { id: string; role: Role }
) {
  return prisma.season.create({
    data: {
      name: input.name,
      startDate: input.startDate,
      endDate: input.endDate,
    },
  });
}

export async function listSeasons() {
  return prisma.season.findMany({
    orderBy: { startDate: "desc" },
  });
}