import {
  createTripExpense,
  deleteTripExpense,
  deleteTripSettlement,
  getTripExpenseById,
  getTripExpenses,
  getTripSettlements,
  recordTripSettlement,
  updateTripExpense,
} from "@/features/expenses/api";

const tripId = "11111111-1111-4111-8111-111111111111";
const userId = "33333333-3333-4333-8333-333333333333";

describe("expenses api uuid guards", () => {
  it("rejects invalid trip ids before querying expenses", async () => {
    await expect(getTripExpenses("undefined")).rejects.toThrow("Trip id is required.");
    await expect(getTripExpenses("")).rejects.toThrow("Trip id is required.");
    await expect(getTripExpenses("not-a-uuid")).rejects.toThrow("Trip id is required.");
  });

  it("rejects invalid expense ids before querying", async () => {
    await expect(getTripExpenseById(tripId, "bad")).rejects.toThrow(
      "Expense id is required.",
    );
  });

  it("rejects invalid trip id on create", async () => {
    await expect(
      createTripExpense({
        tripId: "bad",
        title: "Dinner",
        category: "food",
        amountMinor: 1000,
        currencyCode: "USD",
        expenseDate: "2026-09-01",
        paidBy: userId,
        splitMethod: "equal",
        participants: [{ userId }],
      }),
    ).rejects.toThrow("Trip id is required.");
  });

  it("rejects an invalid payer id on create", async () => {
    await expect(
      createTripExpense({
        tripId,
        title: "Dinner",
        category: "food",
        amountMinor: 1000,
        currencyCode: "USD",
        expenseDate: "2026-09-01",
        paidBy: "bad",
        splitMethod: "equal",
        participants: [{ userId }],
      }),
    ).rejects.toThrow("Payer is required.");
  });

  it("rejects missing participants on create", async () => {
    await expect(
      createTripExpense({
        tripId,
        title: "Dinner",
        category: "food",
        amountMinor: 1000,
        currencyCode: "USD",
        expenseDate: "2026-09-01",
        paidBy: userId,
        splitMethod: "equal",
        participants: [],
      }),
    ).rejects.toThrow("At least one participant is required.");
  });

  it("rejects an invalid participant id on create", async () => {
    await expect(
      createTripExpense({
        tripId,
        title: "Dinner",
        category: "food",
        amountMinor: 1000,
        currencyCode: "USD",
        expenseDate: "2026-09-01",
        paidBy: userId,
        splitMethod: "equal",
        participants: [{ userId: "not-a-uuid" }],
      }),
    ).rejects.toThrow("Participant id is required.");
  });

  it("rejects invalid ids on update and delete", async () => {
    await expect(
      updateTripExpense({
        tripId,
        expenseId: "bad",
        title: "Dinner",
        category: "food",
        amountMinor: 1000,
        currencyCode: "USD",
        expenseDate: "2026-09-01",
        paidBy: userId,
        splitMethod: "equal",
        participants: [{ userId }],
      }),
    ).rejects.toThrow("Expense id is required.");

    await expect(deleteTripExpense({ tripId, expenseId: "bad" })).rejects.toThrow(
      "Expense id is required.",
    );
  });

  it("rejects invalid ids for settlements", async () => {
    await expect(getTripSettlements("bad")).rejects.toThrow("Trip id is required.");

    await expect(
      recordTripSettlement({
        tripId,
        payerId: "bad",
        payeeId: userId,
        amountMinor: 1000,
        currencyCode: "USD",
        settlementDate: "2026-09-01",
      }),
    ).rejects.toThrow("Payer is required.");

    await expect(
      recordTripSettlement({
        tripId,
        payerId: userId,
        payeeId: "bad",
        amountMinor: 1000,
        currencyCode: "USD",
        settlementDate: "2026-09-01",
      }),
    ).rejects.toThrow("Payee is required.");

    await expect(deleteTripSettlement({ tripId, settlementId: "bad" })).rejects.toThrow(
      "Settlement id is required.",
    );
  });
});
