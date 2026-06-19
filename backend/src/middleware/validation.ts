import { zValidator } from "@hono/zod-validator";
import type { ZodSchema } from "zod";

/**
 * Creates a Zod validator middleware for JSON bodies.
 * Returns 422 with structured errors on validation failure.
 */
export function validateBody<T extends ZodSchema>(schema: T) {
  return zValidator("json", schema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: "Validation failed",
          details: result.error.flatten().fieldErrors,
        },
        422
      );
    }
  });
}

/**
 * Creates a Zod validator middleware for query parameters.
 */
export function validateQuery<T extends ZodSchema>(schema: T) {
  return zValidator("query", schema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: "Invalid query parameters",
          details: result.error.flatten().fieldErrors,
        },
        422
      );
    }
  });
}
