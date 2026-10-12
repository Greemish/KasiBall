import { z } from "zod";

export const createClubSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Club name is too short")
    .max(150, "Club name is too long"),

  shortName: z
    .string()
    .trim()
    .max(50, "Short name is too long")
    .optional(),

  logoUrl: z
    .string()
    .trim()
    .url("Logo URL must be a valid URL")
    .max(255)
    .optional(),
});

export const updateClubSchema = createClubSchema.partial();

export type CreateClubInput = z.infer<typeof createClubSchema>;
export type UpdateClubInput = z.infer<typeof updateClubSchema>;