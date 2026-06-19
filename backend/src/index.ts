import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./lib/prisma.js";
import { env } from "./lib/env.js";
import { logger } from "./lib/logger.js";

async function main() {
  await connectDatabase();

  const app = createApp();

  const server = serve(
    {
      fetch: app.fetch,
      port: env.PORT,
      hostname: env.HOST,
    },
    (info) => {
      logger.info(
        { port: info.port, env: env.NODE_ENV },
        `🚀 Vessify API running on http://${env.HOST}:${info.port}`
      );
    }
  );

  // ─── Graceful Shutdown ────────────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutting down gracefully...");
    server.close(async () => {
      await disconnectDatabase();
      logger.info("Server closed");
      process.exit(0);
    });
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("uncaughtException", (err) => {
    logger.fatal({ err }, "Uncaught exception");
    process.exit(1);
  });
  process.on("unhandledRejection", (reason) => {
    logger.fatal({ reason }, "Unhandled rejection");
    process.exit(1);
  });
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
