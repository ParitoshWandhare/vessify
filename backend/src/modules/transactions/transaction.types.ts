import type { Decimal } from "@prisma/client/runtime/library";

export interface ExtractedTransaction {
  transactionDate: Date;
  description: string;
  amount: number;
  balance: number | null;
  confidence: number;
  rawText: string;
}

export interface TransactionRecord {
  id: string;
  organizationId: string;
  userId: string;
  transactionDate: Date;
  description: string;
  amount: Decimal;
  balance: Decimal | null;
  confidence: number;
  rawText: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionResponse {
  id: string;
  transactionDate: string;
  description: string;
  amount: string;
  balance: string | null;
  confidence: number;
  rawText: string;
  createdAt: string;
}

export interface PaginatedTransactions {
  data: TransactionResponse[];
  nextCursor: string | null;
  total?: number;
}

export interface CreateTransactionInput {
  userId: string;
  organizationId: string;
  transactionDate: Date;
  description: string;
  amount: number;
  balance: number | null;
  confidence: number;
  rawText: string;
}
