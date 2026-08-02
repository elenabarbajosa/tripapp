import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";

import {
  expenseKeys,
  settlementKeys,
  useCreateTripExpenseMutation,
  useDeleteTripExpenseMutation,
  useDeleteTripSettlementMutation,
  useRecordTripSettlementMutation,
  useTripExpenseQuery,
  useTripExpensesQuery,
  useTripSettlementsQuery,
  useUpdateTripExpenseMutation,
} from "@/features/expenses/hooks";
import type { TripExpense, TripExpenseSettlement } from "@/types/models";

const tripId = "11111111-1111-4111-8111-111111111111";
const expenseId = "22222222-2222-4222-8222-222222222222";
const settlementId = "66666666-6666-4666-8666-666666666666";

function mockMakeExpense(overrides: Partial<TripExpense> = {}): TripExpense {
  return {
    id: expenseId,
    tripId,
    createdBy: "33333333-3333-4333-8333-333333333333",
    paidBy: "33333333-3333-4333-8333-333333333333",
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

function mockMakeSettlement(overrides: Partial<TripExpenseSettlement> = {}): TripExpenseSettlement {
  return {
    id: settlementId,
    tripId,
    createdBy: "33333333-3333-4333-8333-333333333333",
    payerId: "33333333-3333-4333-8333-333333333333",
    payeeId: "44444444-4444-4444-8444-444444444444",
    amountMinor: 1500,
    currencyCode: "USD",
    settlementDate: "2026-09-02",
    notes: null,
    createdAt: "2026-08-01T10:00:00Z",
    updatedAt: "2026-08-01T10:00:00Z",
    ...overrides,
  };
}

jest.mock("@/features/expenses/api", () => ({
  getTripExpenses: jest.fn(async () => []),
  getTripExpenseById: jest.fn(async () => mockMakeExpense()),
  createTripExpense: jest.fn(),
  updateTripExpense: jest.fn(),
  deleteTripExpense: jest.fn(async () => undefined),
  getTripSettlements: jest.fn(async () => []),
  recordTripSettlement: jest.fn(),
  deleteTripSettlement: jest.fn(async () => undefined),
}));

const api = jest.requireMock("@/features/expenses/api") as {
  getTripExpenses: jest.Mock;
  getTripExpenseById: jest.Mock;
  createTripExpense: jest.Mock;
  updateTripExpense: jest.Mock;
  deleteTripExpense: jest.Mock;
  getTripSettlements: jest.Mock;
  recordTripSettlement: jest.Mock;
  deleteTripSettlement: jest.Mock;
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return { Wrapper, queryClient };
}

describe("expenses hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.createTripExpense.mockImplementation(async (input: { tripId: string }) =>
      mockMakeExpense({ tripId: input.tripId }),
    );
    api.updateTripExpense.mockImplementation(
      async (input: { tripId: string; expenseId: string }) =>
        mockMakeExpense({ tripId: input.tripId, id: input.expenseId }),
    );
    api.getTripExpenseById.mockImplementation(async () => mockMakeExpense());
    api.recordTripSettlement.mockImplementation(async (input: { tripId: string }) =>
      mockMakeSettlement({ tripId: input.tripId }),
    );
  });

  it("disables the expenses query without a valid tripId", () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useTripExpensesQuery("undefined", true), {
      wrapper: Wrapper,
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(api.getTripExpenses).not.toHaveBeenCalled();
  });

  it("disables expense detail without a valid expenseId", () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useTripExpenseQuery(tripId, "bad", true), {
      wrapper: Wrapper,
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(api.getTripExpenseById).not.toHaveBeenCalled();
  });

  it("disables the settlements query without a valid tripId", () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useTripSettlementsQuery("bad", true), {
      wrapper: Wrapper,
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(api.getTripSettlements).not.toHaveBeenCalled();
  });

  it("invalidates expense queries after create", async () => {
    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateTripExpenseMutation(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        tripId,
        title: "Dinner",
        category: "food",
        amountMinor: 3000,
        currencyCode: "USD",
        expenseDate: "2026-09-01",
        paidBy: "33333333-3333-4333-8333-333333333333",
        splitMethod: "equal",
        participants: [{ userId: "33333333-3333-4333-8333-333333333333" }],
      });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: expenseKeys.trip(tripId) });
    });
  });

  it("invalidates expense detail after update", async () => {
    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateTripExpenseMutation(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        tripId,
        expenseId,
        title: "Updated",
        category: "food",
        amountMinor: 3000,
        currencyCode: "USD",
        expenseDate: "2026-09-01",
        paidBy: "33333333-3333-4333-8333-333333333333",
        splitMethod: "equal",
        participants: [{ userId: "33333333-3333-4333-8333-333333333333" }],
      });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: expenseKeys.expense(tripId, expenseId),
      });
    });
  });

  it("invalidates expenses after delete", async () => {
    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useDeleteTripExpenseMutation(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({ tripId, expenseId });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: expenseKeys.trip(tripId) });
    });
  });

  it("invalidates settlements after recording one", async () => {
    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useRecordTripSettlementMutation(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        tripId,
        payerId: "33333333-3333-4333-8333-333333333333",
        payeeId: "44444444-4444-4444-8444-444444444444",
        amountMinor: 1500,
        currencyCode: "USD",
        settlementDate: "2026-09-02",
      });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: settlementKeys.trip(tripId) });
    });
  });

  it("invalidates settlements after delete", async () => {
    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useDeleteTripSettlementMutation(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({ tripId, settlementId });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: settlementKeys.trip(tripId) });
    });
  });
});
