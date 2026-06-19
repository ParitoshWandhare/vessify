import { Hono } from "hono";
import { requireAuth } from "../../middleware/auth.js";
import { rateLimit } from "../../middleware/rate-limit.js";
import { validateBody, validateQuery } from "../../middleware/validation.js";
import {
  extractTransactionSchema,
  listTransactionsSchema,
} from "./transaction.schema.js";
import { transactionController } from "./transaction.controller.js";

const transactionRoutes = new Hono();

// Apply auth to all transaction routes
transactionRoutes.use("/*", requireAuth);

/**
 * POST /api/transactions/extract
 * Rate limited to 30 extractions per minute per user.
 */
transactionRoutes.post(
  "/extract",
  rateLimit({ max: 30, windowMs: 60_000 }),
  validateBody(extractTransactionSchema),
  (c) => transactionController.extract(c)
);

/**
 * GET /api/transactions
 * Rate limited to 60 reads per minute per user.
 */
transactionRoutes.get(
  "/",
  rateLimit({ max: 60, windowMs: 60_000 }),
  validateQuery(listTransactionsSchema),
  (c) => transactionController.list(c)
);

export { transactionRoutes };
