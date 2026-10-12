import { z } from "zod";

export const createGroundSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Ground name is too short")
    .max(150, "Ground name is too long"),

  location: z
    .string()
    .trim()
    .max(255, "Location is too long")
    .optional(),

  address: z
    .string()
    .trim()
    .max(500, "Address is too long")
    .optional(),

  capacity: z
    .number()
    .int()
    .min(0, "Capacity cannot be negative")
    .max(100000, "Capacity is too high")
    .optional(),
});

export const updateGroundSchema = createGroundSchema
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  });

export type CreateGroundInput = z.infer<typeof createGroundSchema>;
export type UpdateGroundInput = z.infer<typeof updateGroundSchema>;