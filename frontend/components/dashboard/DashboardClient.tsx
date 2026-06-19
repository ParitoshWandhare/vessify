"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "../../lib/auth";
import { TopNav } from "./TopNav";
import { StatsCards } from "./StatsCards";
import { ExtractPanel } from "./ExtractPanel";
import { TransactionsTable } from "./TransactionsTable";
import { transactionService } from "../../services/transaction.service";
import type { Transaction, PaginatedTransactions } from "../../types/transaction";

export function DashboardClient() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalExtracted, setTotalExtracted] = useState(0);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/login");
    }
  }, [session, isPending, router]);

  // Load initial transactions
  useEffect(() => {
    if (!session) return;
    void loadTransactions();
  }, [session]);

  async function loadTransactions() {
    setIsLoadingTransactions(true);
    try {
      const data = await transactionService.list();
      setTransactions(data.data);
      setNextCursor(data.nextCursor);
      setTotalExtracted(data.data.length);
    } catch (err) {
      console.error("Failed to load transactions:", err);
    } finally {
      setIsLoadingTransactions(false);
    }
  }

  async function loadMore() {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const data = await transactionService.list(nextCursor);
      setTransactions((prev) => [...prev, ...data.data]);
      setNextCursor(data.nextCursor);
    } catch (err) {
      console.error("Failed to load more transactions:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }

  function onTransactionExtracted(tx: Transaction) {
    setTransactions((prev) => [tx, ...prev]);
    setTotalExtracted((n) => n + 1);
  }

  if (isPending || !session) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  // Calculate stats from transactions
  const totalDebits = transactions
    .filter((t) => parseFloat(t.amount) < 0)
    .reduce((acc, t) => acc + Math.abs(parseFloat(t.amount)), 0);

  const totalCredits = transactions
    .filter((t) => parseFloat(t.amount) > 0)
    .reduce((acc, t) => acc + parseFloat(t.amount), 0);

  const avgConfidence =
    transactions.length > 0
      ? transactions.reduce((acc, t) => acc + t.confidence, 0) / transactions.length
      : 0;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-purple-600/5 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-violet-700/5 blur-[100px]" />
      </div>

      <TopNav user={session.user} />

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Welcome header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl font-bold text-white">
            Good day,{" "}
            <span className="text-gradient">{session.user.name?.split(" ")[0]}</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Here's your financial overview
          </p>
        </motion.div>

        {/* Stats */}
        <StatsCards
          totalTransactions={totalExtracted}
          totalDebits={totalDebits}
          totalCredits={totalCredits}
          avgConfidence={avgConfidence}
          isLoading={isLoadingTransactions}
        />

        {/* Extract panel */}
        <ExtractPanel onExtracted={onTransactionExtracted} />

        {/* Transactions table */}
        <TransactionsTable
          transactions={transactions}
          isLoading={isLoadingTransactions}
          isLoadingMore={isLoadingMore}
          hasMore={Boolean(nextCursor)}
          onLoadMore={loadMore}
        />
      </main>
    </div>
  );
}
