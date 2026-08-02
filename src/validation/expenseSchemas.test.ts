import { tripExpenseFormSchema } from "@/validation/expenseSchemas";

const userA = "11111111-1111-4111-8111-111111111111";
const userB = "22222222-2222-4222-8222-222222222222";
const userC = "33333333-3333-4333-8333-333333333333";

function baseInput(overrides: Record<string, unknown> = {}) {
  return {
    title: "Dinner",
    category: "food",
    amount: "30.00",
    currencyCode: "usd",
    expenseDate: "01/09/2026",
    paidBy: userA,
    splitMethod: "equal",
    participants: [{ userId: userA }, { userId: userB }],
    notes: null,
    ...overrides,
  };
}

describe("tripExpenseFormSchema", () => {
  it("computes an equal split in minor units", () => {
    const result = tripExpenseFormSchema.parse(baseInput());
    expect(result.amountMinor).toBe(3000);
    expect(result.currencyCode).toBe("USD");
    expect(result.expenseDate).toBe("2026-09-01");
    expect(result.participants).toEqual([
      { userId: userA, shareAmountMinor: 1500, sharePercentage: null },
      { userId: userB, shareAmountMinor: 1500, sharePercentage: null },
    ]);
  });

  it("distributes remainder to earlier participants for equal splits", () => {
    const result = tripExpenseFormSchema.parse(
      baseInput({
        amount: "10.00",
        participants: [{ userId: userA }, { userId: userB }, { userId: userC }],
      }),
    );
    // 1000 minor / 3 participants -> 334, 333, 333
    const shares = result.participants.map((p) => p.shareAmountMinor);
    expect(shares.reduce((a, b) => (a ?? 0) + (b ?? 0), 0)).toBe(1000);
    expect(shares).toEqual([334, 333, 333]);
  });

  it("validates exact splits sum to the total", () => {
    const valid = tripExpenseFormSchema.safeParse(
      baseInput({
        splitMethod: "exact",
        participants: [
          { userId: userA, shareAmount: "20.00" },
          { userId: userB, shareAmount: "10.00" },
        ],
      }),
    );
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.participants).toEqual([
        { userId: userA, shareAmountMinor: 2000, sharePercentage: null },
        { userId: userB, shareAmountMinor: 1000, sharePercentage: null },
      ]);
    }

    const invalid = tripExpenseFormSchema.safeParse(
      baseInput({
        splitMethod: "exact",
        participants: [
          { userId: userA, shareAmount: "20.00" },
          { userId: userB, shareAmount: "5.00" },
        ],
      }),
    );
    expect(invalid.success).toBe(false);
  });

  it("validates percentage splits sum to 100", () => {
    const valid = tripExpenseFormSchema.safeParse(
      baseInput({
        splitMethod: "percentage",
        participants: [
          { userId: userA, sharePercentage: "60" },
          { userId: userB, sharePercentage: "40" },
        ],
      }),
    );
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.participants).toEqual([
        { userId: userA, shareAmountMinor: null, sharePercentage: 60 },
        { userId: userB, shareAmountMinor: null, sharePercentage: 40 },
      ]);
    }

    const invalid = tripExpenseFormSchema.safeParse(
      baseInput({
        splitMethod: "percentage",
        participants: [
          { userId: userA, sharePercentage: "60" },
          { userId: userB, sharePercentage: "30" },
        ],
      }),
    );
    expect(invalid.success).toBe(false);
  });

  it("rejects a non-positive amount", () => {
    expect(tripExpenseFormSchema.safeParse(baseInput({ amount: "0" })).success).toBe(false);
    expect(tripExpenseFormSchema.safeParse(baseInput({ amount: "-5" })).success).toBe(false);
    expect(tripExpenseFormSchema.safeParse(baseInput({ amount: "abc" })).success).toBe(false);
  });

  it("rejects an invalid currency code", () => {
    expect(tripExpenseFormSchema.safeParse(baseInput({ currencyCode: "US" })).success).toBe(
      false,
    );
  });

  it("rejects an empty title", () => {
    expect(tripExpenseFormSchema.safeParse(baseInput({ title: "" })).success).toBe(false);
  });

  it("rejects an invalid date", () => {
    expect(tripExpenseFormSchema.safeParse(baseInput({ expenseDate: "31/13/2026" })).success).toBe(
      false,
    );
  });

  it("rejects duplicate participants", () => {
    expect(
      tripExpenseFormSchema.safeParse(
        baseInput({ participants: [{ userId: userA }, { userId: userA }] }),
      ).success,
    ).toBe(false);
  });

  it("rejects an empty participant list", () => {
    expect(tripExpenseFormSchema.safeParse(baseInput({ participants: [] })).success).toBe(
      false,
    );
  });

  it("rejects an invalid payer id", () => {
    expect(tripExpenseFormSchema.safeParse(baseInput({ paidBy: "not-a-uuid" })).success).toBe(
      false,
    );
  });
});
