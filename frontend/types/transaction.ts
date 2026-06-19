export interface Transaction {
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
  data: Transaction[];
  nextCursor: string | null;
}

export interface ExtractTransactionResponse {
  data: Transaction;
}
