import { z } from "zod";

export const createTeamApplicationSchema = z.object({
  ageGroupId: z
    .string()
    .uuid("Invalid age group identifier"),

  teamName: z
    .string()
    .trim()
    .min(2, "Team name is too short")
    .max(150, "Team name is too long"),

  clubName: z
    .string()
    .trim()
    .min(2, "Club name is too short")
    .max(150, "Club name is too long"),

  kitDescription: z
    .string()
    .trim()
    .max(500, "Kit description is too long")
    .optional(),

  notes: z
    .string()
    .trim()
    .max(1000, "Notes are too long")
    .optional(),
});

export const reviewTeamApplicationSchema = z
  .object({
    status: z.enum(["UNDER_REVIEW", "CHANGES_REQUESTED", "REJECTED"]),
    reviewNotes: z
      .string()
      .trim()
      .max(1000, "Review notes are too long")
      .optional(),
  })
  .refine(
    (data) =>
      data.status !== "REJECTED" || !!data.reviewNotes,
    {
      message: "A reason is required when rejecting an application",
      path: ["reviewNotes"],
    }
  );

export type ReviewTeamApplicationInput = z.infer<
  typeof reviewTeamApplicationSchema
>;

export type CreateTeamApplicationInput = z.infer<
  typeof createTeamApplicationSchema
>;