import pino from "pino";
import { env } from "./env.js";

export const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  transport:
    env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        }
      : undefined,
  base: {
    env: env.NODE_ENV,
    service: "vessify-backend",
  },
  redact: {
    paths: ["password", "token", "*.password", "*.token", "headers.cookie"],
    censor: "[REDACTED]",
  },
});

export type Logger = typeof logger;
