import { z } from "zod";

export const createRefereeSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),

  firstName: z.string().trim().min(2).max(100),
  lastName: z.string().trim().min(2).max(100),
  phone: z.string().trim().max(30).optional(),
  licenseNumber: z.string().trim().max(100).optional(),
});

export const updateRefereeSchema = z.object({
  firstName: z.string().trim().min(2).max(100).optional(),
  lastName: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  licenseNumber: z.string().trim().max(100).nullable().optional(),
  isActive: z.boolean().optional(),
});

export type CreateRefereeInput = z.infer<typeof createRefereeSchema>;
export type UpdateRefereeInput = z.infer<typeof updateRefereeSchema>;