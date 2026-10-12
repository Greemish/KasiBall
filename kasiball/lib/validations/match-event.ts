import { z } from "zod";

export const recordEventSchema = z.object({
  teamId: z.string().uuid("Invalid team id"),
  playerRegistrationId: z
    .string()
    .uuid("Invalid player registration id")
    .nullable()
    .optional(),
  assistPlayerRegistrationId: z
    .string()
    .uuid("Invalid assist player registration id")
    .nullable()
    .optional(),
  eventType: z.enum(["GOAL", "YELLOW_CARD", "RED_CARD", "OWN_GOAL"]),
  minute: z.number().int().min(0).max(200).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
});

export type RecordEventInput = z.infer<typeof recordEventSchema>;