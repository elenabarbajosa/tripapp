import type {
  TripExpenseRow,
  TripExpenseSettlementRow,
  TripExpenseSplitRow,
} from "@/types/database";
import type { TripExpense, TripExpenseSettlement, TripExpenseSplit } from "@/types/models";

export type TripExpenseRowWithSplits = TripExpenseRow & {
  trip_expense_splits: TripExpenseSplitRow[] | null;
};

export function mapExpenseSplitRow(row: TripExpenseSplitRow): TripExpenseSplit {
  return {
    expenseId: row.expense_id,
    userId: row.user_id,
    shareAmountMinor: row.share_amount_minor,
    sharePercentage: row.share_percentage,
  };
}

export function mapExpenseRow(row: TripExpenseRowWithSplits): TripExpense {
  return {
    id: row.id,
    tripId: row.trip_id,
    createdBy: row.created_by,
    paidBy: row.paid_by,
    title: row.title,
    category: row.category,
    amountMinor: row.amount_minor,
    currencyCode: row.currency_code,
    expenseDate: row.expense_date,
    splitMethod: row.split_method,
    notes: row.notes,
    splits: (row.trip_expense_splits ?? []).map(mapExpenseSplitRow),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapSettlementRow(row: TripExpenseSettlementRow): TripExpenseSettlement {
  return {
    id: row.id,
    tripId: row.trip_id,
    createdBy: row.created_by,
    payerId: row.payer_id,
    payeeId: row.payee_id,
    amountMinor: row.amount_minor,
    currencyCode: row.currency_code,
    settlementDate: row.settlement_date,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * ORDERING RULE: expense_date descending (most recent first), then created_at descending.
 */
export function sortExpenses(expenses: TripExpense[]): TripExpense[] {
  return [...expenses].sort((a, b) => {
    if (a.expenseDate !== b.expenseDate) {
      return a.expenseDate < b.expenseDate ? 1 : -1;
    }
    if (a.createdAt !== b.createdAt) {
      return a.createdAt < b.createdAt ? 1 : -1;
    }
    return 0;
  });
}

/**
 * ORDERING RULE: settlement_date descending (most recent first), then created_at descending.
 */
export function sortSettlements(
  settlements: TripExpenseSettlement[],
): TripExpenseSettlement[] {
  return [...settlements].sort((a, b) => {
    if (a.settlementDate !== b.settlementDate) {
      return a.settlementDate < b.settlementDate ? 1 : -1;
    }
    if (a.createdAt !== b.createdAt) {
      return a.createdAt < b.createdAt ? 1 : -1;
    }
    return 0;
  });
}
