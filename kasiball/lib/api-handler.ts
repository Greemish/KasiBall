import { ZodError } from "zod";
import { errorResponse } from "@/lib/api-response";
import { AuthError } from "@/lib/auth";
import { BusinessError } from "@/lib/errors";
import { Prisma } from "@/lib/generated/prisma/client";

/**
 * Converts known errors thrown in route handlers into consistent
 * HTTP responses. Unknown errors become 500s.
 */
export function handleRouteError(error: unknown) {
  // Auth / authorization errors (401, 403)
  if (error instanceof AuthError) {
    return errorResponse(error.message, error.status, undefined, error.code);
  }

  // Business-rule errors (404, 409, 400...)
  if (error instanceof BusinessError) {
    return errorResponse(error.message, error.status, undefined, error.code);
  }

  // Validation errors (Zod) → 400
  if (error instanceof ZodError) {
    return errorResponse(
      "Validation failed",
      400,
      error.flatten(),
      "VALIDATION_ERROR"
    );
  }

  // Prisma known errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2025: record not found
    if (error.code === "P2025") {
      return errorResponse("Resource not found", 404, undefined, "NOT_FOUND");
    }

    // P2002: unique constraint violation
    if (error.code === "P2002") {
      return errorResponse(
        "Resource already exists",
        409,
        undefined,
        "CONFLICT"
      );
    }

    // P2007 / P2023: malformed input (e.g. invalid UUID) → bad request
    if (error.code === "P2007" || error.code === "P2023") {
      return errorResponse(
        "Invalid identifier or input",
        400,
        undefined,
        "INVALID_INPUT"
      );
    }

    // P2003: foreign key constraint violation
    if (error.code === "P2003") {
      return errorResponse(
        "Invalid reference",
        400,
        undefined,
        "INVALID_REFERENCE"
      );
    }
  }

  // Prisma validation errors → 400
 if (error instanceof Prisma.PrismaClientValidationError) {
  console.error("Prisma validation error:", error.message);   // ← add this
  return errorResponse("Invalid request data", 400, undefined, "INVALID_DATA");
}

  // Anything else → 500, log it
  console.error("Unhandled route error:", error);

  return errorResponse(
    "Internal server error",
    500,
    undefined,
    "INTERNAL_ERROR"
  );
}