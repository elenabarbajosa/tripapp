import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { isValidUuid } from "@/utils/routeParams";
import {
  createTripExpense,
  deleteTripExpense,
  deleteTripSettlement,
  getTripExpenseById,
  getTripExpenses,
  getTripSettlements,
  recordTripSettlement,
  updateTripExpense,
  type CreateTripExpenseInput,
  type DeleteTripExpenseInput,
  type DeleteTripSettlementInput,
  type RecordTripSettlementInput,
  type UpdateTripExpenseInput,
} from "./api";

export const expenseKeys = {
  all: ["expenses"] as const,
  trip: (tripId: string) => [...expenseKeys.all, tripId] as const,
  expense: (tripId: string, expenseId: string) =>
    [...expenseKeys.trip(tripId), "expense", expenseId] as const,
};

export const settlementKeys = {
  all: ["settlements"] as const,
  trip: (tripId: string) => [...settlementKeys.all, tripId] as const,
};

async function invalidateTripExpenses(
  queryClient: ReturnType<typeof useQueryClient>,
  tripId: string,
  expenseId?: string,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: expenseKeys.trip(tripId) }),
    expenseId
      ? queryClient.invalidateQueries({
          queryKey: expenseKeys.expense(tripId, expenseId),
        })
      : Promise.resolve(),
  ]);
}

async function invalidateTripSettlements(
  queryClient: ReturnType<typeof useQueryClient>,
  tripId: string,
) {
  await queryClient.invalidateQueries({ queryKey: settlementKeys.trip(tripId) });
}

export function useTripExpensesQuery(tripId: string | undefined, enabled: boolean) {
  const resolvedId = typeof tripId === "string" ? tripId.trim() : "";
  const canQuery = enabled && isValidUuid(resolvedId);

  return useQuery({
    queryKey: expenseKeys.trip(canQuery ? resolvedId : ""),
    queryFn: () => getTripExpenses(resolvedId),
    enabled: canQuery,
    retry: 1,
  });
}

export function useTripExpenseQuery(
  tripId: string | undefined,
  expenseId: string | undefined,
  enabled: boolean,
) {
  const resolvedTripId = typeof tripId === "string" ? tripId.trim() : "";
  const resolvedExpenseId = typeof expenseId === "string" ? expenseId.trim() : "";
  const canQuery =
    enabled && isValidUuid(resolvedTripId) && isValidUuid(resolvedExpenseId);

  return useQuery({
    queryKey: expenseKeys.expense(
      canQuery ? resolvedTripId : "",
      canQuery ? resolvedExpenseId : "",
    ),
    queryFn: () => getTripExpenseById(resolvedTripId, resolvedExpenseId),
    enabled: canQuery,
    retry: 1,
  });
}

export function useTripSettlementsQuery(tripId: string | undefined, enabled: boolean) {
  const resolvedId = typeof tripId === "string" ? tripId.trim() : "";
  const canQuery = enabled && isValidUuid(resolvedId);

  return useQuery({
    queryKey: settlementKeys.trip(canQuery ? resolvedId : ""),
    queryFn: () => getTripSettlements(resolvedId),
    enabled: canQuery,
    retry: 1,
  });
}

export function useCreateTripExpenseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTripExpenseInput) => createTripExpense(input),
    onSuccess: async (expense) => {
      await invalidateTripExpenses(queryClient, expense.tripId, expense.id);
    },
  });
}

export function useUpdateTripExpenseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTripExpenseInput) => updateTripExpense(input),
    onSuccess: async (expense) => {
      await invalidateTripExpenses(queryClient, expense.tripId, expense.id);
    },
  });
}

export function useDeleteTripExpenseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeleteTripExpenseInput) => deleteTripExpense(input),
    onSuccess: async (_data, variables) => {
      await invalidateTripExpenses(queryClient, variables.tripId, variables.expenseId);
    },
  });
}

export function useRecordTripSettlementMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordTripSettlementInput) => recordTripSettlement(input),
    onSuccess: async (settlement) => {
      await invalidateTripSettlements(queryClient, settlement.tripId);
    },
  });
}

export function useDeleteTripSettlementMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeleteTripSettlementInput) => deleteTripSettlement(input),
    onSuccess: async (_data, variables) => {
      await invalidateTripSettlements(queryClient, variables.tripId);
    },
  });
}
