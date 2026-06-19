import { z } from "zod";

export const extractTransactionSchema = z.object({
  text: z
    .string()
    .min(1, "Text is required")
    .max(10_000, "Text too long (max 10,000 characters)")
    .trim(),
});

export const listTransactionsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20),
});

export type ExtractTransactionInput = z.infer<typeof extractTransactionSchema>;
export type ListTransactionsQuery = z.infer<typeof listTransactionsSchema>;
