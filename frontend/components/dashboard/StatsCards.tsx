"use client";

import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, Receipt, Target } from "lucide-react";

interface StatsCardsProps {
  totalTransactions: number;
  totalDebits: number;
  totalCredits: number;
  avgConfidence: number;
  isLoading: boolean;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);

export function StatsCards({
  totalTransactions,
  totalDebits,
  totalCredits,
  avgConfidence,
  isLoading,
}: StatsCardsProps) {
  const cards = [
    {
      label: "Total Transactions",
      value: isLoading ? null : String(totalTransactions),
      icon: Receipt,
      accent: "text-purple-400",
      bg: "bg-purple-600/10",
      border: "border-purple-500/20",
    },
    {
      label: "Total Debits",
      value: isLoading ? null : formatCurrency(totalDebits),
      icon: TrendingDown,
      accent: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
    },
    {
      label: "Total Credits",
      value: isLoading ? null : formatCurrency(totalCredits),
      icon: TrendingUp,
      accent: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: "Avg. Confidence",
      value: isLoading ? null : `${Math.round(avgConfidence * 100)}%`,
      icon: Target,
      accent: "text-violet-400",
      bg: "bg-violet-600/10",
      border: "border-violet-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.06 }}
          whileHover={{ y: -2 }}
          className="glass rounded-xl p-5 hover:border-white/15 transition-all duration-200 hover:shadow-glass-hover"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              {card.label}
            </span>
            <div
              className={`w-8 h-8 rounded-lg ${card.bg} border ${card.border} flex items-center justify-center`}
            >
              <card.icon className={`w-4 h-4 ${card.accent}`} />
            </div>
          </div>

          {card.value === null ? (
            <div className="h-7 w-24 bg-white/5 rounded-md animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-white tabular-nums">
              {card.value}
            </p>
          )}
        </motion.div>
      ))}
    </div>
  );
}
