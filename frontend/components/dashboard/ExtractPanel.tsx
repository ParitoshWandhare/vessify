"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { transactionService } from "../../services/transaction.service";
import { extractTransactionSchema } from "../../lib/validations";
import type { Transaction } from "../../types/transaction";

interface ExtractPanelProps {
  onExtracted: (tx: Transaction) => void;
}

const SAMPLE_TEXTS = [
  {
    label: "Structured",
    text: `Date: 11 Dec 2025
Description: STARBUCKS COFFEE MUMBAI
Amount: -420.00
Balance after transaction: 18,420.50`,
  },
  {
    label: "Inline",
    text: `Uber Ride * Airport Drop
12/11/2025 → ₹1,250.00 debited
Available Balance → ₹17,170.50`,
  },
  {
    label: "Messy",
    text: `txn123 2025-12-10 Amazon.in Order #403-1234567-8901234 ₹2,999.00 Dr Bal 14171.50 Shopping`,
  },
];

export function ExtractPanel({ onExtracted }: ExtractPanelProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const result = extractTransactionSchema.safeParse({ text });
    if (!result.success) {
      setError(result.error.flatten().fieldErrors.text?.[0] ?? "Invalid input");
      return;
    }

    setIsLoading(true);
    try {
      const response = await transactionService.extract(text);
      onExtracted(response.data);
      toast.success(
        `Transaction extracted with ${Math.round(response.data.confidence * 100)}% confidence`
      );
      setText("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Extraction failed";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="glass rounded-xl p-6"
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-purple-600/15 border border-purple-500/25 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-purple-400" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-white">
            Extract Transaction
          </h2>
          <p className="text-xs text-slate-500">
            Paste raw bank statement text — we'll parse it automatically
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Paste your bank statement text here…&#10;&#10;e.g. Date: 11 Dec 2025&#10;Description: STARBUCKS COFFEE MUMBAI&#10;Amount: -420.00"
          rows={5}
          className="glass-input w-full rounded-lg px-4 py-3 text-white placeholder-slate-500 text-sm font-mono resize-none focus:outline-none"
        />

        {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}

        <div className="flex items-center justify-between mt-3 gap-3 flex-wrap">
          {/* Sample text chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            {SAMPLE_TEXTS.map((sample) => (
              <button
                key={sample.label}
                type="button"
                onClick={() => setText(sample.text)}
                className="text-xs px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/8 transition-colors"
              >
                {sample.label}
              </button>
            ))}
          </div>

          <motion.button
            type="submit"
            disabled={isLoading || !text.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg px-5 py-2 text-sm transition-all duration-200 flex items-center gap-2 purple-glow-sm shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Parsing…
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Parse & Save
              </>
            )}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
}
