import type { TripExpenseCategory, TripExpenseSplitMethod } from "@/types/models";
import { colors } from "@/theme/colors";

const expenseCategoryLabels: Record<TripExpenseCategory, string> = {
  accommodation: "Accommodation",
  transport: "Transport",
  food: "Food",
  activities: "Activities",
  shopping: "Shopping",
  other: "Other",
};

const expenseCategoryColors: Record<TripExpenseCategory, string> = {
  accommodation: colors.expenseAccommodation,
  transport: colors.expenseTransport,
  food: colors.expenseFood,
  activities: colors.expenseActivities,
  shopping: colors.expenseShopping,
  other: colors.expenseOther,
};

export const TRIP_EXPENSE_CATEGORIES: TripExpenseCategory[] = [
  "accommodation",
  "transport",
  "food",
  "activities",
  "shopping",
  "other",
];

export function getTripExpenseCategoryLabel(category: TripExpenseCategory): string {
  return expenseCategoryLabels[category];
}

export function getTripExpenseCategoryColor(category: TripExpenseCategory): string {
  return expenseCategoryColors[category];
}

const splitMethodLabels: Record<TripExpenseSplitMethod, string> = {
  equal: "Split equally",
  exact: "Exact amounts",
  percentage: "Percentages",
};

export const TRIP_EXPENSE_SPLIT_METHODS: TripExpenseSplitMethod[] = [
  "equal",
  "exact",
  "percentage",
];

export function getSplitMethodLabel(method: TripExpenseSplitMethod): string {
  return splitMethodLabels[method];
}
