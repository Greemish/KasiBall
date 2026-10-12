import { z } from "zod";

function hasValidEmbeddedDate(id: string): boolean {
  const yy = parseInt(id.slice(0, 2), 10);
  const mm = parseInt(id.slice(2, 4), 10);
  const dd = parseInt(id.slice(4, 6), 10);

  if (mm < 1 || mm > 12) return false;
  if (dd < 1 || dd > 31) return false;

  // Assume 2000s — youth players only.
  const year = 2000 + yy;
  const date = new Date(Date.UTC(year, mm - 1, dd));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === mm - 1 &&
    date.getUTCDate() === dd
  );
}

export const saIdNumberSchema = z
  .string()
  .trim()
  .regex(/^\d{13}$/, "SA ID number must be exactly 13 digits")
  .refine(
    hasValidEmbeddedDate,
    "SA ID number contains an invalid date of birth"
  );