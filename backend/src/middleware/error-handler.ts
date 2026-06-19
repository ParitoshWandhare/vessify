import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";
import { logger } from "../lib/logger.js";
import { env } from "../lib/env.js";

interface ErrorResponse {
  error: string;
  message: string;
  details?: unknown;
  requestId?: string;
}

/**
 * Centralized error handler for all Hono routes.
 * Normalizes error types into consistent JSON responses.
 * Hides internal details in production.
 */
export function errorHandler(err: unknown, c: Context): Response {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  // HTTP Exceptions (thrown intentionally)
  if (err instanceof HTTPException) {
    logger.warn(
      { status: err.status, message: err.message, requestId },
      "HTTP exception"
    );

    return c.json<ErrorResponse>(
      {
        error: getErrorCode(err.status),
        message: err.message,
        requestId,
      },
      err.status as 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500
    );
  }

  // Zod validation errors (should be caught by middleware, but just in case)
  if (err instanceof ZodError) {
    logger.warn({ errors: err.flatten(), requestId }, "Validation error");

    return c.json<ErrorResponse>(
      {
        error: "VALIDATION_ERROR",
        message: "Invalid request data",
        details: err.flatten().fieldErrors,
        requestId,
      },
      422
    );
  }

  // Prisma errors
  if (isPrismaError(err)) {
    return handlePrismaError(err, c, requestId);
  }

  // Unknown errors
  logger.error({ err, requestId, path: c.req.path }, "Unhandled error");

  return c.json<ErrorResponse>(
    {
      error: "INTERNAL_SERVER_ERROR",
      message:
        env.NODE_ENV === "production"
          ? "An unexpected error occurred"
          : (err instanceof Error ? err.message : "Unknown error"),
      requestId,
    },
    500
  );
}

function getErrorCode(status: number): string {
  const codes: Record<number, string> = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    422: "UNPROCESSABLE_ENTITY",
    429: "TOO_MANY_REQUESTS",
    500: "INTERNAL_SERVER_ERROR",
  };
  return codes[status] ?? "ERROR";
}

interface PrismaError extends Error {
  code?: string;
  meta?: Record<string, unknown>;
}

function isPrismaError(err: unknown): err is PrismaError {
  return (
    err instanceof Error &&
    (err.constructor.name === "PrismaClientKnownRequestError" ||
      err.constructor.name === "PrismaClientValidationError" ||
      err.constructor.name === "PrismaClientUnknownRequestError")
  );
}

function handlePrismaError(err: PrismaError, c: Context, requestId: string): Response {
  logger.error({ code: err.code, meta: err.meta, requestId }, "Prisma error");

  switch (err.code) {
    case "P2002":
      return c.json<ErrorResponse>(
        { error: "CONFLICT", message: "A record with this data already exists", requestId },
        409
      );
    case "P2025":
      return c.json<ErrorResponse>(
        { error: "NOT_FOUND", message: "Record not found", requestId },
        404
      );
    default:
      return c.json<ErrorResponse>(
        { error: "DATABASE_ERROR", message: "Database operation failed", requestId },
        500
      );
  }
}
