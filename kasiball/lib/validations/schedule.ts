import { z } from "zod";

export const scheduleFixtureSchema = z.object({
  scheduledDate: z.coerce.date(),
  kickoffTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Kickoff time must be HH:MM")
    .refine((t) => {
      const [h, m] = t.split(":").map(Number);
      return h >= 0 && h <= 23 && m >= 0 && m <= 59;
    }, "Invalid kickoff time"),
  groundId: z.string().uuid("Invalid ground identifier"),
  refereeId: z.string().uuid("Invalid referee identifier").nullable().optional(),
});

export type ScheduleFixtureInput = z.infer<typeof scheduleFixtureSchema>;