import { BudgetSummary } from "@/types/models";

export function calculateBudgetSummary(
  totalBudget: number,
  amountSpent: number,
  currency: string,
): BudgetSummary {
  const remaining = totalBudget - amountSpent;
  const percentUsed =
    totalBudget <= 0 ? 0 : Math.min(100, Math.round((amountSpent / totalBudget) * 100));

  return {
    totalBudget,
    amountSpent,
    remaining,
    currency,
    percentUsed,
  };
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}
