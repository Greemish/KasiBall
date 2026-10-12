import { z } from "zod";

export const createAgeGroupSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Age group name is required")
      .max(20, "Age group name is too long"),

    maxAge: z
      .number()
      .int("Max age must be a whole number")
      .min(1, "Max age must be at least 1")
      .max(99, "Max age is too high"),

    minAge: z
      .number()
      .int("Min age must be a whole number")
      .min(1, "Min age must be at least 1")
      .max(99, "Min age is too high")
      .optional(),
  })
  .refine(
    (data) => data.minAge === undefined || data.minAge < data.maxAge,
    {
      message: "Min age must be less than max age",
      path: ["minAge"],
    }
  );

export const updateAgeGroupSchema = z
  .object({
    name: z.string().trim().min(1).max(20).optional(),
    maxAge: z.number().int().min(1).max(99).optional(),
    minAge: z.number().int().min(1).max(99).nullable().optional(),
  })
  .refine(
    (data) =>
      data.minAge === undefined ||
      data.minAge === null ||
      data.maxAge === undefined ||
      data.minAge < data.maxAge,
    {
      message: "Min age must be less than max age",
      path: ["minAge"],
    }
  );

export type CreateAgeGroupInput = z.infer<typeof createAgeGroupSchema>;
export type UpdateAgeGroupInput = z.infer<typeof updateAgeGroupSchema>;