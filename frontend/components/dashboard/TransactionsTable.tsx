"use client";

import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Loader2, Receipt, ChevronDown } from "lucide-react";
import type { Transaction } from "../../types/transaction";

interface TransactionsTableProps {
  transactions: Transaction[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

const formatCurrency = (value: string) => {
  const num = parseFloat(value);
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Math.abs(num));
  return num < 0 ? `-${formatted}` : `+${formatted}`;
};

function confidenceColor(confidence: number): string {
  if (confidence >= 0.8) return "confidence-high";
  if (confidence >= 0.5) return "confidence-medium";
  return "confidence-low";
}

export function TransactionsTable({
  transactions,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
}: TransactionsTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="glass rounded-xl overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">Transactions</h2>
        <span className="text-xs text-slate-500">
          {transactions.length} loaded
        </span>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : transactions.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#111111]/95 backdrop-blur-sm z-10">
              <tr className="border-b border-white/8">
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Date
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Description
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Amount
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Balance
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Confidence
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {transactions.map((tx, i) => (
                  <motion.tr
                    key={tx.id}
                    initial={{ opacity: 0, backgroundColor: "rgba(139, 92, 246, 0.1)" }}
                    animate={{ opacity: 1, backgroundColor: "transparent" }}
                    transition={{ duration: 0.5 }}
                    className="border-b border-white/5 hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="px-6 py-3.5 text-slate-300 whitespace-nowrap">
                      {format(new Date(tx.transactionDate), "dd MMM yyyy")}
                    </td>
                    <td className="px-6 py-3.5 text-white font-medium max-w-xs truncate">
                      {tx.description}
                    </td>
                    <td
                      className={`px-6 py-3.5 text-right font-medium tabular-nums whitespace-nowrap ${
                        parseFloat(tx.amount) < 0 ? "negative-amount" : "positive-amount"
                      }`}
                    >
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-6 py-3.5 text-right text-slate-400 tabular-nums whitespace-nowrap">
                      {tx.balance
                        ? new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: "INR",
                          }).format(parseFloat(tx.balance))
                        : "—"}
                    </td>
                    <td className="px-6 py-3.5 text-right whitespace-nowrap">
                      <span
                        className={`text-xs font-medium ${confidenceColor(tx.confidence)}`}
                      >
                        {Math.round(tx.confidence * 100)}%
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right text-slate-500 text-xs whitespace-nowrap">
                      {format(new Date(tx.createdAt), "dd MMM, HH:mm")}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}

      {hasMore && !isLoading && (
        <div className="px-6 py-4 border-t border-white/8 flex justify-center">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="flex items-center gap-2 text-sm text-slate-300 hover:text-white px-4 py-2 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading…
              </>
            ) : (
              <>
                Load more
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      )}
    </motion.div>
  );
}

function TableSkeleton() {
  return (
    <div className="p-6 space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 animate-pulse">
          <div className="h-4 w-20 bg-white/5 rounded" />
          <div className="h-4 flex-1 bg-white/5 rounded" />
          <div className="h-4 w-24 bg-white/5 rounded" />
          <div className="h-4 w-24 bg-white/5 rounded" />
          <div className="h-4 w-16 bg-white/5 rounded" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4">
        <Receipt className="w-6 h-6 text-slate-500" />
      </div>
      <h3 className="text-sm font-medium text-white mb-1">No transactions yet</h3>
      <p className="text-xs text-slate-500 max-w-xs">
        Paste a bank statement above to extract your first transaction.
      </p>
    </div>
  );
}
