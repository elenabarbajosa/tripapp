import { balancesForUser, calculateTripBalances, isBalanceSettled } from "@/features/expenses/balances";
import type { TripExpense, TripExpenseSettlement } from "@/types/models";

const tripId = "trip-1";

function expense(overrides: Partial<TripExpense> = {}): TripExpense {
  return {
    id: "e1",
    tripId,
    createdBy: "alice",
    paidBy: "alice",
    title: "Dinner",
    category: "food",
    amountMinor: 3000,
    currencyCode: "USD",
    expenseDate: "2026-09-01",
    splitMethod: "equal",
    notes: null,
    splits: [],
    createdAt: "2026-09-01T00:00:00Z",
    updatedAt: "2026-09-01T00:00:00Z",
    ...overrides,
  };
}

function settlement(overrides: Partial<TripExpenseSettlement> = {}): TripExpenseSettlement {
  return {
    id: "s1",
    tripId,
    createdBy: "alice",
    payerId: "bob",
    payeeId: "alice",
    amountMinor: 1000,
    currencyCode: "USD",
    settlementDate: "2026-09-02",
    notes: null,
    createdAt: "2026-09-02T00:00:00Z",
    updatedAt: "2026-09-02T00:00:00Z",
    ...overrides,
  };
}

describe("calculateTripBalances", () => {
  it("computes paid minus owed for a simple equal split", () => {
    const expenses = [
      expense({
        paidBy: "alice",
        amountMinor: 3000,
        splits: [
          { expenseId: "e1", userId: "alice", shareAmountMinor: 1500, sharePercentage: null },
          { expenseId: "e1", userId: "bob", shareAmountMinor: 1500, sharePercentage: null },
        ],
      }),
    ];

    const balances = calculateTripBalances(expenses, []);

    const alice = balances.find((b) => b.userId === "alice");
    const bob = balances.find((b) => b.userId === "bob");

    expect(alice).toMatchObject({
      paidMinor: 3000,
      owedMinor: 1500,
      settlementsSentMinor: 0,
      settlementsReceivedMinor: 0,
      netMinor: 1500,
    });
    expect(bob).toMatchObject({
      paidMinor: 0,
      owedMinor: 1500,
      settlementsSentMinor: 0,
      settlementsReceivedMinor: 0,
      netMinor: -1500,
    });
  });

  it("applies settlements sent and received to net balance", () => {
    const expenses = [
      expense({
        paidBy: "alice",
        amountMinor: 3000,
        splits: [
          { expenseId: "e1", userId: "alice", shareAmountMinor: 1500, sharePercentage: null },
          { expenseId: "e1", userId: "bob", shareAmountMinor: 1500, sharePercentage: null },
        ],
      }),
    ];
    const settlements = [settlement({ payerId: "bob", payeeId: "alice", amountMinor: 1500 })];

    const balances = calculateTripBalances(expenses, settlements);
    const alice = balances.find((b) => b.userId === "alice");
    const bob = balances.find((b) => b.userId === "bob");

    // alice: paid 3000 - owed 1500 + sent 0 - received 1500 = 0
    expect(alice?.netMinor).toBe(0);
    // bob: paid 0 - owed 1500 + sent 1500 - received 0 = 0
    expect(bob?.netMinor).toBe(0);
    expect(alice ? isBalanceSettled(alice) : false).toBe(true);
    expect(bob ? isBalanceSettled(bob) : false).toBe(true);
  });

  it("keeps separate balances per currency and never converts", () => {
    const expenses = [
      expense({
        paidBy: "alice",
        currencyCode: "USD",
        amountMinor: 2000,
        splits: [
          { expenseId: "e1", userId: "alice", shareAmountMinor: 1000, sharePercentage: null },
          { expenseId: "e1", userId: "bob", shareAmountMinor: 1000, sharePercentage: null },
        ],
      }),
      expense({
        id: "e2",
        paidBy: "alice",
        currencyCode: "EUR",
        amountMinor: 4000,
        splits: [
          { expenseId: "e2", userId: "alice", shareAmountMinor: 2000, sharePercentage: null },
          { expenseId: "e2", userId: "bob", shareAmountMinor: 2000, sharePercentage: null },
        ],
      }),
    ];

    const balances = calculateTripBalances(expenses, []);
    const aliceBalances = balancesForUser(balances, "alice");

    expect(aliceBalances).toHaveLength(2);
    const usd = aliceBalances.find((b) => b.currencyCode === "USD");
    const eur = aliceBalances.find((b) => b.currencyCode === "EUR");
    expect(usd?.netMinor).toBe(1000);
    expect(eur?.netMinor).toBe(2000);
  });

  it("returns an empty array for no activity", () => {
    expect(calculateTripBalances([], [])).toEqual([]);
  });

  it("sorts by currency, then descending net balance, then userId", () => {
    const expenses = [
      expense({
        paidBy: "alice",
        amountMinor: 3000,
        splits: [
          { expenseId: "e1", userId: "alice", shareAmountMinor: 1000, sharePercentage: null },
          { expenseId: "e1", userId: "bob", shareAmountMinor: 1000, sharePercentage: null },
          { expenseId: "e1", userId: "carol", shareAmountMinor: 1000, sharePercentage: null },
        ],
      }),
    ];

    const balances = calculateTripBalances(expenses, []);
    expect(balances.map((b) => b.userId)).toEqual(["alice", "bob", "carol"]);
  });

  it("treats a user with only settlement activity as a valid balance row", () => {
    const settlements = [settlement({ payerId: "bob", payeeId: "carol", amountMinor: 500 })];
    const balances = calculateTripBalances([], settlements);

    expect(balances.find((b) => b.userId === "bob")).toMatchObject({ netMinor: 500 });
    expect(balances.find((b) => b.userId === "carol")).toMatchObject({ netMinor: -500 });
  });
});
