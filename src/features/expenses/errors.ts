/**
 * Maps Supabase / PostgREST expense and settlement failures to readable Errors.
 * Never includes tokens or secrets.
 */
export function mapExpenseError(error: unknown): Error {
  if (!error || typeof error !== "object") {
    return new Error("Unable to load expenses. Please try again.");
  }

  const message =
    "message" in error && typeof error.message === "string" ? error.message : "";
  const code = "code" in error && error.code != null ? String(error.code) : "";
  const details =
    "details" in error && typeof error.details === "string" ? error.details : "";
  const hint = "hint" in error && typeof error.hint === "string" ? error.hint : "";

  const normalized = message
    .replace(/^.*ERROR:\s*/i, "")
    .replace(/\s+CONTEXT:[\s\S]*$/i, "")
    .trim();
  const lower = `${normalized} ${details} ${hint}`.toLowerCase();

  if (lower.includes("not authenticated") || code === "PGRST301") {
    return new Error("Sign in to view expenses.");
  }

  if (code === "42501" || lower.includes("permission denied")) {
    return new Error("You do not have permission to change this expense.");
  }

  if (code === "23514" || lower.includes("check constraint") || lower.includes("violates check")) {
    if (lower.includes("trip_expenses_title")) {
      return new Error("Enter a valid expense title.");
    }
    if (lower.includes("trip_expenses_amount_positive") || lower.includes("trip_settlements_amount_positive")) {
      return new Error("Amount must be positive.");
    }
    if (lower.includes("trip_expenses_currency_code") || lower.includes("trip_settlements_currency_code")) {
      return new Error("Currency code must be ISO 4217.");
    }
    if (lower.includes("trip_expenses_notes_length") || lower.includes("trip_settlements_notes_length")) {
      return new Error("Notes must be 2000 characters or fewer.");
    }
    if (lower.includes("trip_expense_splits_amount_non_negative")) {
      return new Error("Share amounts cannot be negative.");
    }
    if (lower.includes("trip_expense_splits_percentage_range")) {
      return new Error("Percentages must be between 0 and 100.");
    }
    if (lower.includes("trip_settlements_different_parties")) {
      return new Error("Payer and payee must be different.");
    }
    return new Error("That expense could not be saved. Check the details and try again.");
  }

  if (code === "23503" || lower.includes("foreign key")) {
    return new Error("That trip is no longer available.");
  }

  if (code === "PGRST116" || lower.includes("0 rows") || lower.includes("contains 0 rows")) {
    return new Error("Expense not found.");
  }

  if (normalized.length > 0 && normalized.length < 200) {
    return new Error(normalized);
  }

  return new Error("Unable to update expenses. Please try again.");
}

export type ExpenseErrorDebug = {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
};

export function getExpenseErrorDebug(error: unknown): ExpenseErrorDebug | null {
  if (!error || typeof error !== "object") {
    return null;
  }
  return {
    message: "message" in error && typeof error.message === "string" ? error.message : "Unknown",
    code: "code" in error && error.code != null ? String(error.code) : undefined,
    details: "details" in error && typeof error.details === "string" ? error.details : undefined,
    hint: "hint" in error && typeof error.hint === "string" ? error.hint : undefined,
  };
}
