import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { logger as honoLogger } from "hono/logger";
import { requestId } from "hono/request-id";
import { authRoutes } from "./auth/auth-routes.js";
import { transactionRoutes } from "./modules/transactions/transaction.routes.js";
import { errorHandler } from "./middleware/error-handler.js";
import { rateLimit } from "./middleware/rate-limit.js";
import { env } from "./lib/env.js";
import { logger } from "./lib/logger.js";

export function createApp(): Hono {
  const app = new Hono();

  // ─── Request ID ──────────────────────────────────────────────────────────
  app.use("*", requestId());

  // ─── Request Logging ─────────────────────────────────────────────────────
  app.use("*", honoLogger((message, ...rest) => {
    logger.info({ message, rest });
  }));

  // ─── Security Headers ────────────────────────────────────────────────────
  app.use(
    "*",
    secureHeaders({
      contentSecurityPolicy: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
      xFrameOptions: "DENY",
      xContentTypeOptions: "nosniff",
      referrerPolicy: "strict-origin-when-cross-origin",
      strictTransportSecurity:
        env.NODE_ENV === "production"
          ? "max-age=31536000; includeSubDomains"
          : false,
    })
  );

  // ─── CORS ────────────────────────────────────────────────────────────────
  app.use(
    "*",
    cors({
      origin: env.FRONTEND_URL,
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: [
        "Content-Type",
        "Authorization",
        "Cookie",
        "X-Request-ID",
      ],
      exposeHeaders: [
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining",
        "X-RateLimit-Reset",
      ],
      credentials: true,
      maxAge: 86_400,
    })
  );

  // ─── Global Rate Limit ────────────────────────────────────────────────────
  app.use("*", rateLimit());

  // ─── Health Check ────────────────────────────────────────────────────────
  app.get("/health", (c) =>
    c.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "vessify-backend",
    })
  );

  // ─── Routes ───────────────────────────────────────────────────────────────
  app.route("/api/auth", authRoutes);
  app.route("/api/transactions", transactionRoutes);

  // ─── 404 Handler ─────────────────────────────────────────────────────────
  app.notFound((c) =>
    c.json({ error: "NOT_FOUND", message: "Route not found" }, 404)
  );

  // ─── Error Handler ────────────────────────────────────────────────────────
  app.onError(errorHandler);

  return app;
}
