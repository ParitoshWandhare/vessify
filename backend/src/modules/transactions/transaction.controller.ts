import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { transactionService } from "./transaction.service.js";
import { logger } from "../../lib/logger.js";

export class TransactionController {
  /**
   * POST /api/transactions/extract
   *
   * Parses raw bank statement text, saves the transaction,
   * and returns the structured result.
   *
   * organizationId is derived from the auth context set by requireAuth middleware.
   * Client cannot inject their own organizationId.
   */
  async extract(c: Context): Promise<Response> {
    const auth = c.get("auth");
    const { text } = await c.req.json<{ text: string }>();

    const transaction = await transactionService.extractAndSave(text, auth);

    logger.info(
      { transactionId: transaction.id, userId: auth.userId },
      "Transaction extracted"
    );

    return c.json({ data: transaction }, 201);
  }

  /**
   * GET /api/transactions
   *
   * Returns cursor-paginated transactions for the authenticated organization.
   * All data is scoped — no cross-org data leakage possible.
   */
  async list(c: Context): Promise<Response> {
    const auth = c.get("auth");
    const cursor = c.req.query("cursor");
    const limit = Math.min(
      parseInt(c.req.query("limit") ?? "20", 10),
      100
    );

    if (isNaN(limit) || limit < 1) {
      throw new HTTPException(400, { message: "Invalid limit parameter" });
    }

    const result = await transactionService.listTransactions(
      auth,
      limit,
      cursor
    );

    return c.json(result);
  }
}

export const transactionController = new TransactionController();
