import { tripSettlementFormSchema } from "@/validation/settlementSchemas";

const userA = "11111111-1111-4111-8111-111111111111";
const userB = "22222222-2222-4222-8222-222222222222";

function baseInput(overrides: Record<string, unknown> = {}) {
  return {
    payerId: userA,
    payeeId: userB,
    amount: "15.00",
    currencyCode: "usd",
    settlementDate: "02/09/2026",
    notes: null,
    ...overrides,
  };
}

describe("tripSettlementFormSchema", () => {
  it("converts amount to minor units and uppercases currency", () => {
    const result = tripSettlementFormSchema.parse(baseInput());
    expect(result.amountMinor).toBe(1500);
    expect(result.currencyCode).toBe("USD");
    expect(result.settlementDate).toBe("2026-09-02");
  });

  it("rejects when payer and payee are the same", () => {
    expect(
      tripSettlementFormSchema.safeParse(baseInput({ payeeId: userA })).success,
    ).toBe(false);
  });

  it("rejects a non-positive amount", () => {
    expect(tripSettlementFormSchema.safeParse(baseInput({ amount: "0" })).success).toBe(false);
    expect(tripSettlementFormSchema.safeParse(baseInput({ amount: "-1" })).success).toBe(false);
  });

  it("rejects an invalid currency code", () => {
    expect(
      tripSettlementFormSchema.safeParse(baseInput({ currencyCode: "dollars" })).success,
    ).toBe(false);
  });

  it("rejects an invalid date", () => {
    expect(
      tripSettlementFormSchema.safeParse(baseInput({ settlementDate: "31/13/2026" })).success,
    ).toBe(false);
  });

  it("rejects an invalid payer or payee id", () => {
    expect(tripSettlementFormSchema.safeParse(baseInput({ payerId: "bad" })).success).toBe(
      false,
    );
    expect(tripSettlementFormSchema.safeParse(baseInput({ payeeId: "bad" })).success).toBe(
      false,
    );
  });

  it("treats notes as optional", () => {
    const result = tripSettlementFormSchema.parse(baseInput({ notes: undefined }));
    expect(result.notes).toBeNull();
  });
});
