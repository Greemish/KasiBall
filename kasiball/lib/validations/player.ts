import { z } from "zod";
import { saIdNumberSchema } from "@/lib/validations/sa-id";

export const registerPlayerSchema = z.object({
  // The player identity
  saIdNumber: saIdNumberSchema,
  firstName: z.string().trim().min(2).max(100),
  lastName: z.string().trim().min(2).max(100),
  dateOfBirth: z.coerce.date(),

  // The registration
  teamId: z.string().uuid("Invalid team identifier"),
  seasonId: z.string().uuid("Invalid season identifier"),
  shirtNumber: z
    .number()
    .int()
    .min(1)
    .max(99)
    .nullable()
    .optional(),
});

export type RegisterPlayerInput = z.infer<typeof registerPlayerSchema>;

export const reviewPlayerRegistrationSchema = z.object({
  reviewNotes: z
    .string()
    .trim()
    .min(3, "A reason is required")
    .max(1000, "Reason is too long"),
});

export const resubmitPlayerRegistrationSchema = z.object({
  firstName: z.string().trim().min(2).max(100).optional(),
  lastName: z.string().trim().min(2).max(100).optional(),
  dateOfBirth: z.coerce.date().optional(),
  shirtNumber: z.number().int().min(1).max(99).nullable().optional(),
});

export type ReviewPlayerRegistrationInput = z.infer<
  typeof reviewPlayerRegistrationSchema
>;
export type ResubmitPlayerRegistrationInput = z.infer<
  typeof resubmitPlayerRegistrationSchema
>;