import { z } from "zod";

export const squadPlayerSchema = z.object({
  playerRegistrationId: z.string().uuid("Invalid player registration id"),
  starting: z.boolean(),
  substitute: z.boolean(),
  goalkeeper: z.boolean(),
  shirtNumber: z
    .number()
    .int()
    .min(1)
    .max(99)
    .nullable()
    .optional(),
});

export const setSquadSchema = z
  .object({
    players: z.array(squadPlayerSchema).max(25, "Squad cannot exceed 25 players"),
  })
  .refine(
    (data) => data.players.filter((p) => p.starting).length <= 11,
    { message: "At most 11 players can start", path: ["players"] }
  )
  .refine(
    (data) => data.players.filter((p) => p.substitute).length <= 7,
    { message: "At most 7 substitutes allowed", path: ["players"] }
  )
  .refine(
    (data) => data.players.filter((p) => p.goalkeeper).length <= 1,
    { message: "At most 1 goalkeeper allowed", path: ["players"] }
  )
  .refine(
    (data) => data.players.every((p) => p.starting !== p.substitute),
    {
      message: "A player cannot be both starting and a substitute",
      path: ["players"],
    }
  );

export type SetSquadInput = z.infer<typeof setSquadSchema>;