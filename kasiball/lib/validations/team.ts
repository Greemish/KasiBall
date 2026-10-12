import { z } from "zod";

export const updateTeamSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Team name is too short")
      .max(150, "Team name is too long")
      .optional(),

    shortName: z
      .string()
      .trim()
      .max(50, "Short name is too long")
      .nullable()
      .optional(),

    logoUrl: z
      .string()
      .trim()
      .url("Logo URL must be a valid URL")
      .max(255)
      .nullable()
      .optional(),

    status: z
      .enum([
        "PENDING",
        "UNDER_REVIEW",
        "CHANGES_REQUESTED",
        "APPROVED",
        "REJECTED",
        "INACTIVE",
      ])
      .optional(),
  });

export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;