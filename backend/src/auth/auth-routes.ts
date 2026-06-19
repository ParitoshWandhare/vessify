import { Hono } from "hono";
import { auth } from "./better-auth.js";

const authRoutes = new Hono();

/**
 * Mount Better Auth's built-in handler on all /api/auth/* routes.
 * Better Auth handles: register, login, logout, session, organization ops, etc.
 */
authRoutes.on(["GET", "POST"], "/*", async (c) => {
  return auth.handler(c.req.raw);
});

export { authRoutes };
