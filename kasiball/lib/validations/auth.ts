import { z } from "zod";


export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(255),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long"),

  firstName: z
    .string()
    .trim()
    .min(2)
    .max(100),

  lastName: z
    .string()
    .trim()
    .min(2)
    .max(100),

  phone: z
    .string()
    .trim()
    .max(30)
    .optional(),

  address: z
    .string()
    .trim()
    .max(500)
    .optional(),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(255),

  password: z
    .string()
    .min(1)
    .max(100),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;