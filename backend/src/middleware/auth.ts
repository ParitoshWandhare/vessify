import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { auth } from "../auth/better-auth.js";
import { authService } from "../auth/auth-service.js";
import { logger } from "../lib/logger.js";

/**
 * requireAuth middleware:
 * 1. Verifies Better Auth session from cookie or Bearer token
 * 2. Resolves the user's organization (never from client input)
 * 3. Attaches full auth context to Hono context
 *
 * Any route that mounts this middleware is fully protected.
 */
export async function requireAuth(c: Context, next: Next): Promise<Response | void> {
  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session?.user || !session.session) {
      throw new HTTPException(401, {
        message: "Authentication required",
      });
    }

    const authContext = await authService.resolveAuthContext(
      session.user.id,
      session.session.id
    );

    c.set("auth", authContext);

    logger.debug(
      {
        userId: authContext.userId,
        organizationId: authContext.organizationId,
        path: c.req.path,
        method: c.req.method,
      },
      "Authenticated request"
    );

    await next();
  } catch (error) {
    if (error instanceof HTTPException) throw error;

    logger.error({ error }, "Auth middleware error");
    throw new HTTPException(401, {
      message: "Invalid or expired session",
    });
  }
}
