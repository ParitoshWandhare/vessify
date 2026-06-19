import { prisma } from "../../lib/prisma.js";
import type {
  CreateTransactionInput,
  TransactionRecord,
} from "./transaction.types.js";

/**
 * TransactionRepository
 *
 * All queries are scoped to organizationId derived from the auth context.
 * This is the final enforcement layer — no query ever runs without org scope.
 */
export class TransactionRepository {
  /**
   * Creates a new transaction.
   * organizationId is injected from auth context — never from client.
   */
  async create(input: CreateTransactionInput): Promise<TransactionRecord> {
    return prisma.transaction.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId,
        transactionDate: input.transactionDate,
        description: input.description,
        amount: input.amount,
        balance: input.balance,
        confidence: input.confidence,
        rawText: input.rawText,
      },
    });
  }

  /**
   * Cursor-based paginated list of transactions.
   * ALWAYS scoped to organizationId from auth context.
   * Ordered by createdAt DESC for consistent pagination.
   */
  async findManyByOrganization(
    organizationId: string,
    limit: number,
    cursor?: string
  ): Promise<{ transactions: TransactionRecord[]; nextCursor: string | null }> {
    const transactions = await prisma.transaction.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: limit + 1, // Fetch one extra to determine if there's a next page
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1, // Skip the cursor item itself
          }
        : {}),
    });

    let nextCursor: string | null = null;

    if (transactions.length > limit) {
      const nextItem = transactions.pop(); // Remove the extra item
      nextCursor = nextItem?.id ?? null;
    }

    return { transactions, nextCursor };
  }

  /**
   * Finds a single transaction by ID, scoped to organizationId.
   * Returns null if not found or if org doesn't match — prevents enumeration.
   */
  async findByIdAndOrganization(
    id: string,
    organizationId: string
  ): Promise<TransactionRecord | null> {
    return prisma.transaction.findFirst({
      where: { id, organizationId },
    });
  }

  /**
   * Counts transactions for an organization.
   */
  async countByOrganization(organizationId: string): Promise<number> {
    return prisma.transaction.count({
      where: { organizationId },
    });
  }
}

export const transactionRepository = new TransactionRepository();
