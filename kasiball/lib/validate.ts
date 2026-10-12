import { z } from "zod";
import { ZodError } from "zod";

/**
 * Parses input with a Zod schema. On success returns the typed data.
 * On failure throws a ZodError, which handleRouteError turns into a 400.
 *
 * Usage:
 *   const data = parseBody(createSeasonSchema, await request.json());
 */
export function parseBody<T extends z.ZodTypeAny>(
  schema: T,
  input: unknown
): z.infer<T> {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw result.error; // ZodError → handleRouteError → 400
  }

  return result.data;
}