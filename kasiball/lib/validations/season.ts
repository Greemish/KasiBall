import { z } from "zod";

export const createSeasonSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Season name is too short")
      .max(100, "Season name is too long"),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  });

export const updateSeasonSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    status: z
      .enum(["PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"])
      .optional(),
    cancellationReason: z.string().trim().min(3).max(500).optional(),
  })
  .refine(
    (data) => data.status !== "CANCELLED" || !!data.cancellationReason,
    {
      message: "A reason is required when cancelling a season",
      path: ["cancellationReason"],
    }
  );

export type CreateSeasonInput = z.infer<typeof createSeasonSchema>;
export type UpdateSeasonInput = z.infer<typeof updateSeasonSchema>;