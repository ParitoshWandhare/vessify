import { transactionRepository } from "./transaction.repository.js";
import { transactionExtractionService } from "../../services/transaction-extraction.service.js";
import { logger } from "../../lib/logger.js";
import type { AuthContext } from "../../types/auth.js";
import type {
  TransactionResponse,
  PaginatedTransactions,
} from "./transaction.types.js";

function formatTransaction(tx: {
  id: string;
  transactionDate: Date;
  description: string;
  amount: { toString(): string };
  balance: { toString(): string } | null;
  confidence: number;
  rawText: string;
  createdAt: Date;
}): TransactionResponse {
  return {
    id: tx.id,
    transactionDate: tx.transactionDate.toISOString(),
    description: tx.description,
    amount: tx.amount.toString(),
    balance: tx.balance?.toString() ?? null,
    confidence: tx.confidence,
    rawText: tx.rawText,
    createdAt: tx.createdAt.toISOString(),
  };
}

export class TransactionService {
  /**
   * Extracts and persists a transaction from raw text.
   * auth context (userId, organizationId) is always server-derived.
   */
  async extractAndSave(
    rawText: string,
    auth: AuthContext
  ): Promise<TransactionResponse> {
    logger.info(
      { userId: auth.userId, organizationId: auth.organizationId },
      "Extracting transaction"
    );

    const extracted = transactionExtractionService.extract(rawText);

    const transaction = await transactionRepository.create({
      userId: auth.userId,
      organizationId: auth.organizationId,
      transactionDate: extracted.transactionDate,
      description: extracted.description,
      amount: extracted.amount,
      balance: extracted.balance,
      confidence: extracted.confidence,
      rawText,
    });

    logger.info(
      { transactionId: transaction.id, confidence: extracted.confidence },
      "Transaction saved"
    );

    return formatTransaction(transaction);
  }

  /**
   * Returns paginated transactions for the auth'd organization.
   * organizationId is ALWAYS from auth context — never from client.
   */
  async listTransactions(
    auth: AuthContext,
    limit: number,
    cursor?: string
  ): Promise<PaginatedTransactions> {
    const { transactions, nextCursor } =
      await transactionRepository.findManyByOrganization(
        auth.organizationId,
        limit,
        cursor
      );

    return {
      data: transactions.map(formatTransaction),
      nextCursor,
    };
  }
}

export const transactionService = new TransactionService();
