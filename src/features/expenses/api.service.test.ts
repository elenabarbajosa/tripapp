import { mapExpenseError } from "@/features/expenses/errors";
import {
  createTripExpense,
  deleteTripExpense,
  getTripExpenses,
  recordTripSettlement,
  updateTripExpense,
} from "@/features/expenses/api";

const tripId = "11111111-1111-4111-8111-111111111111";
const expenseId = "22222222-2222-4222-8222-222222222222";
const userId = "33333333-3333-4333-8333-333333333333";
const otherUserId = "44444444-4444-4444-8444-444444444444";
const settlementId = "55555555-5555-4555-8555-555555555555";

const mockFrom = jest.fn();
const mockRpc = jest.fn();

jest.mock("@/services/supabase", () => ({
  requireSupabaseClient: () => ({
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
  }),
}));

function chain(result: { data?: unknown; error?: unknown | null }) {
  const builder: Record<string, unknown> = {};
  const methods = ["select", "eq", "insert", "update", "delete", "single", "maybeSingle"];
  for (const method of methods) {
    builder[method] = jest.fn(() => builder);
  }
  const promise = Promise.resolve(result);
  builder.then = promise.then.bind(promise);
  builder.catch = promise.catch.bind(promise);
  builder.finally = promise.finally.bind(promise);
  return builder;
}

function expenseRow(overrides: Record<string, unknown> = {}) {
  return {
    id: expenseId,
    trip_id: tripId,
    created_by: userId,
    paid_by: userId,
    title: "Dinner",
    category: "food",
    amount_minor: 3000,
    currency_code: "USD",
    expense_date: "2026-09-01",
    split_method: "equal",
    notes: null,
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
    trip_expense_splits: [
      {
        expense_id: expenseId,
        user_id: userId,
        share_amount_minor: 1500,
        share_percentage: null,
        created_at: "2026-08-01T00:00:00Z",
      },
      {
        expense_id: expenseId,
        user_id: otherUserId,
        share_amount_minor: 1500,
        share_percentage: null,
        created_at: "2026-08-01T00:00:00Z",
      },
    ],
    ...overrides,
  };
}

function settlementRow(overrides: Record<string, unknown> = {}) {
  return {
    id: settlementId,
    trip_id: tripId,
    created_by: userId,
    payer_id: otherUserId,
    payee_id: userId,
    amount_minor: 1500,
    currency_code: "USD",
    settlement_date: "2026-09-02",
    notes: null,
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
    ...overrides,
  };
}

describe("expenses api service behavior", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads and maps trip expenses with splits", async () => {
    mockFrom.mockImplementation(() => chain({ data: [expenseRow()], error: null }));

    const expenses = await getTripExpenses(tripId);
    expect(expenses).toHaveLength(1);
    expect(expenses[0]?.title).toBe("Dinner");
    expect(expenses[0]?.splits).toHaveLength(2);
  });

  it("creates an expense via RPC then loads the full record", async () => {
    mockRpc.mockResolvedValue({ data: expenseId, error: null });
    mockFrom.mockImplementation(() => chain({ data: expenseRow(), error: null }));

    const created = await createTripExpense({
      tripId,
      title: "Dinner",
      category: "food",
      amountMinor: 3000,
      currencyCode: "usd",
      expenseDate: "2026-09-01",
      paidBy: userId,
      splitMethod: "equal",
      participants: [{ userId }, { userId: otherUserId }],
    });

    expect(mockRpc).toHaveBeenCalledWith(
      "create_trip_expense",
      expect.objectContaining({
        p_trip_id: tripId,
        p_currency_code: "USD",
        p_participant_ids: [userId, otherUserId],
      }),
    );
    expect(created.id).toBe(expenseId);
    expect(created.title).toBe("Dinner");
  });

  it("updates an expense via RPC then reloads it", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });
    mockFrom.mockImplementation(() => chain({ data: expenseRow({ title: "Updated" }), error: null }));

    const updated = await updateTripExpense({
      tripId,
      expenseId,
      title: "Updated",
      category: "food",
      amountMinor: 3000,
      currencyCode: "USD",
      expenseDate: "2026-09-01",
      paidBy: userId,
      splitMethod: "equal",
      participants: [{ userId }, { userId: otherUserId }],
    });

    expect(mockRpc).toHaveBeenCalledWith("update_trip_expense", expect.objectContaining({ p_expense_id: expenseId }));
    expect(updated.title).toBe("Updated");
  });

  it("deletes an expense via RPC", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    await deleteTripExpense({ tripId, expenseId });

    expect(mockRpc).toHaveBeenCalledWith("delete_trip_expense", { p_expense_id: expenseId });
  });

  it("maps permission denial from RPC errors", async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { code: "42501", message: "permission denied", details: "", hint: "" },
    });

    await expect(
      updateTripExpense({
        tripId,
        expenseId,
        title: "Dinner",
        category: "food",
        amountMinor: 3000,
        currencyCode: "USD",
        expenseDate: "2026-09-01",
        paidBy: userId,
        splitMethod: "equal",
        participants: [{ userId }],
      }),
    ).rejects.toThrow("You do not have permission to change this expense.");
  });

  it("records a settlement via RPC then loads the full record", async () => {
    mockRpc.mockResolvedValue({ data: settlementId, error: null });
    mockFrom.mockImplementation(() => chain({ data: settlementRow(), error: null }));

    const created = await recordTripSettlement({
      tripId,
      payerId: otherUserId,
      payeeId: userId,
      amountMinor: 1500,
      currencyCode: "USD",
      settlementDate: "2026-09-02",
    });

    expect(mockRpc).toHaveBeenCalledWith(
      "record_trip_settlement",
      expect.objectContaining({ p_trip_id: tripId, p_payer_id: otherUserId, p_payee_id: userId }),
    );
    expect(created.id).toBe(settlementId);
  });

  it("maps unknown errors through mapExpenseError", () => {
    expect(mapExpenseError({ message: "custom failure" }).message).toBe("custom failure");
  });
});
