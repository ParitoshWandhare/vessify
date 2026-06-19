import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { env } from "../lib/env.js";
import { logger } from "../lib/logger.js";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store — swap for Redis in production for multi-instance deployments
const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitOptions {
  max?: number;
  windowMs?: number;
  keyFn?: (c: Context) => string;
}

/**
 * Rate limiter middleware.
 * Defaults to env-configured limits.
 * Key is per-IP or per-userId when authenticated.
 */
export function rateLimit(options: RateLimitOptions = {}) {
  const max = options.max ?? env.RATE_LIMIT_MAX;
  const windowMs = options.windowMs ?? env.RATE_LIMIT_WINDOW_MS;

  return async (c: Context, next: Next): Promise<Response | void> => {
    const key = options.keyFn
      ? options.keyFn(c)
      : getDefaultKey(c);

    const now = Date.now();
    const existing = store.get(key);

    if (!existing || existing.resetAt < now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      setHeaders(c, max, max - 1, Math.ceil(windowMs / 1000));
      return next();
    }

    existing.count++;

    if (existing.count > max) {
      const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
      logger.warn({ key, count: existing.count }, "Rate limit exceeded");

      c.header("Retry-After", String(retryAfter));
      throw new HTTPException(429, {
        message: `Rate limit exceeded. Retry after ${retryAfter}s`,
      });
    }

    store.set(key, existing);
    setHeaders(c, max, max - existing.count, Math.ceil((existing.resetAt - now) / 1000));
    return next();
  };
}

function getDefaultKey(c: Context): string {
  // Prefer userId from auth context if available
  try {
    const auth = c.get("auth");
    if (auth?.userId) return `user:${auth.userId}`;
  } catch {
    // auth not set yet
  }

  // Fall back to IP
  const ip =
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    c.req.header("x-real-ip") ||
    "unknown";

  return `ip:${ip}`;
}

function setHeaders(c: Context, limit: number, remaining: number, reset: number): void {
  c.header("X-RateLimit-Limit", String(limit));
  c.header("X-RateLimit-Remaining", String(Math.max(0, remaining)));
  c.header("X-RateLimit-Reset", String(reset));
}
