import { z } from "zod";

export const generateFixturesSchema = z.object({
  doubleRoundRobin: z.boolean(),
  balancedHomeAway: z.boolean(),
});

export type GenerateFixturesInput = z.infer<typeof generateFixturesSchema>;