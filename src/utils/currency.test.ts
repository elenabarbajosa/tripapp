import { calculateBudgetSummary, formatCurrency } from "@/utils/currency";

describe("currency utilities", () => {
  it("calculates remaining budget and percent used", () => {
    expect(calculateBudgetSummary(4800, 2140, "USD")).toEqual({
      totalBudget: 4800,
      amountSpent: 2140,
      remaining: 2660,
      currency: "USD",
      percentUsed: 45,
    });
  });

  it("clamps percent used at 100", () => {
    expect(calculateBudgetSummary(100, 150, "USD").percentUsed).toBe(100);
  });

  it("formats currency amounts", () => {
    expect(formatCurrency(2140, "USD")).toContain("2,140");
  });
});
