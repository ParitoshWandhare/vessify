/**
 * TransactionExtractionService
 *
 * Parses raw bank statement text into structured transaction data.
 * Handles multiple input formats including:
 * - Structured key-value formats (Date: / Amount: / Balance:)
 * - Inline formats (date amount description balance)
 * - Messy/unstructured formats (txn ids, mixed symbols, etc.)
 *
 * Returns a confidence score based on what fields were successfully extracted.
 */

export interface ParsedTransaction {
  transactionDate: Date;
  description: string;
  amount: number;
  balance: number | null;
  confidence: number;
}

interface ConfidenceTracker {
  dateFound: boolean;
  amountFound: boolean;
  descriptionFound: boolean;
  balanceFound: boolean;
}

export class TransactionExtractionService {
  extract(rawText: string): ParsedTransaction {
    const text = rawText.trim();
    const confidence: ConfidenceTracker = {
      dateFound: false,
      amountFound: false,
      descriptionFound: false,
      balanceFound: false,
    };

    const transactionDate = this.extractDate(text);
    if (transactionDate) confidence.dateFound = true;

    const amount = this.extractAmount(text);
    if (amount !== null) confidence.amountFound = true;

    const balance = this.extractBalance(text);
    if (balance !== null) confidence.balanceFound = true;

    const description = this.extractDescription(text);
    if (description) confidence.descriptionFound = true;

    const confidenceScore = this.calculateConfidence(confidence);

    return {
      transactionDate: transactionDate ?? new Date(),
      description: description ?? "Unknown Transaction",
      amount: amount ?? 0,
      balance,
      confidence: confidenceScore,
    };
  }

  // ─── Date Extraction ──────────────────────────────────────────────────────

  private extractDate(text: string): Date | null {
    const patterns: RegExp[] = [
      // "Date: 11 Dec 2025" or "Date: 2025-12-11"
      /Date:\s*(\d{1,2}\s+\w+\s+\d{4})/i,
      /Date:\s*(\d{4}-\d{2}-\d{2})/i,
      /Date:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,

      // ISO: 2025-12-10
      /\b(\d{4}-\d{2}-\d{2})\b/,

      // DD/MM/YYYY or MM/DD/YYYY
      /\b(\d{1,2}\/\d{1,2}\/\d{4})\b/,

      // "11 Dec 2025" or "11 December 2025"
      /\b(\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4})\b/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match?.[1]) {
        const parsed = this.parseDate(match[1]);
        if (parsed) return parsed;
      }
    }

    return null;
  }

  private parseDate(dateStr: string): Date | null {
    // Try direct ISO parse
    const direct = new Date(dateStr);
    if (!isNaN(direct.getTime())) return direct;

    // Handle DD/MM/YYYY (Indian format common in bank statements)
    const ddmmyyyy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyy) {
      const [, day, month, year] = ddmmyyyy;
      if (!day || !month || !year) return null;
      // Try DD/MM/YYYY first (most common in India)
      const asDate = new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`);
      if (!isNaN(asDate.getTime())) return asDate;
    }

    return null;
  }

  // ─── Amount Extraction ────────────────────────────────────────────────────

  private extractAmount(text: string): number | null {
    // Check for debit keywords to determine sign
    const isDebit = this.isDebitTransaction(text);

    const patterns: RegExp[] = [
      // "Amount: -420.00" or "Amount: 420.00"
      /Amount:\s*([+-]?[\d,]+(?:\.\d{2})?)/i,

      // "₹1,250.00 debited" — with debit keyword
      /₹\s*([\d,]+(?:\.\d{2})?)\s+debited/i,

      // "₹2,999.00 Dr" — Dr = debit
      /₹\s*([\d,]+(?:\.\d{2})?)\s+Dr\b/i,

      // Standalone rupee amount (not balance)
      /₹\s*([\d,]+(?:\.\d{2})?)/,

      // Plain number that looks like an amount (at least 2 digits, optional decimal)
      /\b([\d,]+\.\d{2})\b/,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match?.[1]) {
        const raw = match[1].replace(/,/g, "");
        const value = parseFloat(raw);
        if (!isNaN(value) && value > 0) {
          // Apply debit/credit sign
          return isDebit ? -Math.abs(value) : Math.abs(value);
        }
      }
    }

    return null;
  }

  private isDebitTransaction(text: string): boolean {
    const debitKeywords = [
      /\bdebited\b/i,
      /\bdr\b/i,
      /\bdebit\b/i,
      /Amount:\s*-/i,
      /\bpaid\b/i,
      /\bpurchase\b/i,
    ];
    return debitKeywords.some((pattern) => pattern.test(text));
  }

  // ─── Balance Extraction ───────────────────────────────────────────────────

  private extractBalance(text: string): number | null {
    const patterns: RegExp[] = [
      // "Balance after transaction: 18,420.50"
      /Balance after transaction:\s*([+-]?[\d,]+(?:\.\d{2})?)/i,

      // "Available Balance ₹17,170.50" or "Available Balance → ₹17,170.50"
      /Available Balance\s*(?:→\s*)?₹?\s*([\d,]+(?:\.\d{2})?)/i,

      // "Bal 14171.50" or "Bal: 14171.50"
      /\bBal\s*:?\s*([\d,]+(?:\.\d{2})?)/i,

      // "Balance: 18420.50"
      /\bBalance:\s*([\d,]+(?:\.\d{2})?)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match?.[1]) {
        const raw = match[1].replace(/,/g, "");
        const value = parseFloat(raw);
        if (!isNaN(value)) return value;
      }
    }

    return null;
  }

  // ─── Description Extraction ───────────────────────────────────────────────

  private extractDescription(text: string): string | null {
    // Try labeled description first
    const labeledMatch = text.match(/Description:\s*(.+?)(?:\n|$)/i);
    if (labeledMatch?.[1]) {
      return this.cleanDescription(labeledMatch[1]);
    }

    // For inline formats, extract the merchant/description part
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

    // Look for lines that don't contain dates, amounts, or balance keywords
    const skipPatterns = [
      /\bBalance\b/i,
      /\bAmount\b/i,
      /\bDate:\b/i,
      /\bBal\b/i,
      /\bdebited\b/i,
      /₹\s*[\d,]+\.\d{2}/,
      /\b\d{4}-\d{2}-\d{2}\b/,
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/,
      /^txn\w*/i,
    ];

    for (const line of lines) {
      if (!skipPatterns.some((p) => p.test(line))) {
        const cleaned = this.cleanDescription(line);
        if (cleaned.length > 2) return cleaned;
      }
    }

    // Last resort: extract recognizable merchant/service names
    const merchantPatterns = [
      /(STARBUCKS[^₹\n]*)/i,
      /(Uber\s+\w+[^₹\n]*)/i,
      /(Amazon\.in\s+Order)/i,
      /([A-Z][A-Z\s]+(?:COFFEE|RIDE|ORDER|PAYMENT|TRANSFER)[^₹\n]*)/i,
    ];

    for (const pattern of merchantPatterns) {
      const match = text.match(pattern);
      if (match?.[1]) {
        return this.cleanDescription(match[1]);
      }
    }

    return null;
  }

  private cleanDescription(raw: string): string {
    return raw
      .replace(/[*→#]/g, " ")        // Remove special chars
      .replace(/\s+/g, " ")           // Normalize whitespace
      .replace(/#[\w-]+/g, "")        // Remove order IDs like #403-...
      .replace(/txn\w+\s*/gi, "")     // Remove transaction IDs
      .replace(/\b\d{4}-\d{2}-\d{2}\b/g, "") // Remove dates
      .replace(/₹[\d,.]+/g, "")       // Remove amounts
      .replace(/\bDr\b/gi, "")        // Remove Dr
      .replace(/\bShopping\b/gi, "")  // Remove generic category tags
      .trim()
      .replace(/\s+/g, " ");
  }

  // ─── Confidence Scoring ───────────────────────────────────────────────────

  private calculateConfidence(tracker: ConfidenceTracker): number {
    let score = 0;

    if (tracker.dateFound) score += 0.3;
    if (tracker.amountFound) score += 0.3;
    if (tracker.descriptionFound) score += 0.3;
    if (tracker.balanceFound) score += 0.1;

    // Clamp to [0, 1]
    return Math.min(1, Math.max(0, Math.round(score * 100) / 100));
  }
}

export const transactionExtractionService = new TransactionExtractionService();
