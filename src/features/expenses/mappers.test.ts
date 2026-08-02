import { mapExpenseRow, mapSettlementRow, sortExpenses, sortSettlements } from "@/features/expenses/mappers";
import type { TripExpense, TripExpenseSettlement } from "@/types/models";
import type { TripExpenseRowWithSplits } from "@/features/expenses/mappers";
import type { TripExpenseSettlementRow } from "@/types/database";

function expense(overrides: Partial<TripExpense> = {}): TripExpense {
  return {
    id: "e1",
    tripId: "t1",
    createdBy: "u1",
    paidBy: "u1",
    title: "Dinner",
    category: "food",
    amountMinor: 3000,
    currencyCode: "USD",
    expenseDate: "2026-09-01",
    splitMethod: "equal",
    notes: null,
    splits: [],
    createdAt: "2026-08-01T10:00:00Z",
    updatedAt: "2026-08-01T10:00:00Z",
    ...overrides,
  };
}

function settlement(overrides: Partial<TripExpenseSettlement> = {}): TripExpenseSettlement {
  return {
    id: "s1",
    tripId: "t1",
    createdBy: "u1",
    payerId: "u1",
    payeeId: "u2",
    amountMinor: 1000,
    currencyCode: "USD",
    settlementDate: "2026-09-01",
    notes: null,
    createdAt: "2026-08-01T10:00:00Z",
    updatedAt: "2026-08-01T10:00:00Z",
    ...overrides,
  };
}

function expenseRow(overrides: Partial<TripExpenseRowWithSplits> = {}): TripExpenseRowWithSplits {
  return {
    id: "row-1",
    trip_id: "trip-1",
    created_by: "user-1",
    paid_by: "user-1",
    title: "Hotel",
    category: "accommodation",
    amount_minor: 12000,
    currency_code: "USD",
    expense_date: "2026-09-12",
    split_method: "equal",
    notes: null,
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
    trip_expense_splits: [
      {
        expense_id: "row-1",
        user_id: "user-1",
        share_amount_minor: 6000,
        share_percentage: null,
        created_at: "2026-08-01T00:00:00Z",
      },
      {
        expense_id: "row-1",
        user_id: "user-2",
        share_amount_minor: 6000,
        share_percentage: null,
        created_at: "2026-08-01T00:00:00Z",
      },
    ],
    ...overrides,
  };
}

function settlementRow(overrides: Partial<TripExpenseSettlementRow> = {}): TripExpenseSettlementRow {
  return {
    id: "settle-1",
    trip_id: "trip-1",
    created_by: "user-1",
    payer_id: "user-2",
    payee_id: "user-1",
    amount_minor: 5000,
    currency_code: "USD",
    settlement_date: "2026-09-12",
    notes: null,
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
    ...overrides,
  };
}

describe("expense mappers", () => {
  it("maps an expense row with splits to a domain expense", () => {
    const mapped = mapExpenseRow(expenseRow());
    expect(mapped.id).toBe("row-1");
    expect(mapped.category).toBe("accommodation");
    expect(mapped.amountMinor).toBe(12000);
    expect(mapped.splits).toHaveLength(2);
    expect(mapped.splits[0]).toEqual({
      expenseId: "row-1",
      userId: "user-1",
      shareAmountMinor: 6000,
      sharePercentage: null,
    });
  });

  it("defaults splits to an empty array when null", () => {
    const mapped = mapExpenseRow(expenseRow({ trip_expense_splits: null }));
    expect(mapped.splits).toEqual([]);
  });

  it("maps a settlement row to a domain settlement", () => {
    const mapped = mapSettlementRow(settlementRow());
    expect(mapped.payerId).toBe("user-2");
    expect(mapped.payeeId).toBe("user-1");
    expect(mapped.amountMinor).toBe(5000);
  });

  it("sorts expenses by date descending, then created_at descending", () => {
    const sorted = sortExpenses([
      expense({ id: "old", expenseDate: "2026-09-01", createdAt: "2026-08-01T09:00:00Z" }),
      expense({ id: "newest", expenseDate: "2026-09-03", createdAt: "2026-08-01T09:00:00Z" }),
      expense({ id: "same-day-later", expenseDate: "2026-09-01", createdAt: "2026-08-01T11:00:00Z" }),
    ]);

    expect(sorted.map((item) => item.id)).toEqual(["newest", "same-day-later", "old"]);
  });

  it("sorts settlements by date descending, then created_at descending", () => {
    const sorted = sortSettlements([
      settlement({ id: "old", settlementDate: "2026-09-01", createdAt: "2026-08-01T09:00:00Z" }),
      settlement({ id: "newest", settlementDate: "2026-09-05", createdAt: "2026-08-01T09:00:00Z" }),
    ]);

    expect(sorted.map((item) => item.id)).toEqual(["newest", "old"]);
  });
});
