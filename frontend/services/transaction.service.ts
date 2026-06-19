import { api } from "../lib/api";
import type {
  ExtractTransactionResponse,
  PaginatedTransactions,
} from "../types/transaction";

export const transactionService = {
  async extract(text: string): Promise<ExtractTransactionResponse> {
    return api.post<ExtractTransactionResponse>("/api/transactions/extract", {
      text,
    });
  },

  async list(cursor?: string, limit = 20): Promise<PaginatedTransactions> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set("cursor", cursor);
    return api.get<PaginatedTransactions>(`/api/transactions?${params}`);
  },
};
