import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";

import {
  itineraryKeys,
  useCreateTripActivityMutation,
  useDeleteTripActivityMutation,
  useReorderTripActivitiesMutation,
  useTripActivityQuery,
  useTripItineraryQuery,
  useUpdateTripActivityMutation,
} from "@/features/itinerary/hooks";
import type { TripActivity } from "@/types/models";

const tripId = "11111111-1111-4111-8111-111111111111";
const activityId = "22222222-2222-4222-8222-222222222222";
const dayId = "33333333-3333-4333-8333-333333333333";

function mockMakeActivity(overrides: Partial<TripActivity> = {}): TripActivity {
  return {
    id: activityId,
    tripId,
    tripDayId: dayId,
    destinationId: null,
    createdBy: "44444444-4444-4444-8444-444444444444",
    title: "Walk",
    description: null,
    category: "activity",
    isAllDay: true,
    startTime: null,
    endTime: null,
    locationName: null,
    address: null,
    geoapifyPlaceId: null,
    latitude: null,
    longitude: null,
    notes: null,
    position: 0,
    createdAt: "2026-08-01T10:00:00Z",
    updatedAt: "2026-08-01T10:00:00Z",
    ...overrides,
  };
}

jest.mock("@/features/itinerary/api", () => ({
  getTripDaysWithActivities: jest.fn(async () => []),
  getTripActivityById: jest.fn(async () => mockMakeActivity()),
  createTripActivity: jest.fn(),
  updateTripActivity: jest.fn(),
  deleteTripActivity: jest.fn(async () => undefined),
  reorderTripActivities: jest.fn(async () => undefined),
}));

const api = jest.requireMock("@/features/itinerary/api") as {
  getTripDaysWithActivities: jest.Mock;
  getTripActivityById: jest.Mock;
  createTripActivity: jest.Mock;
  updateTripActivity: jest.Mock;
  deleteTripActivity: jest.Mock;
  reorderTripActivities: jest.Mock;
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

describe("itinerary hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.createTripActivity.mockImplementation(async (input: { tripId: string }) =>
      mockMakeActivity({ tripId: input.tripId }),
    );
    api.updateTripActivity.mockImplementation(
      async (input: { tripId: string; activityId: string }) =>
        mockMakeActivity({ tripId: input.tripId, id: input.activityId }),
    );
    api.getTripActivityById.mockImplementation(async () => mockMakeActivity());
  });

  it("disables the itinerary query without a valid tripId", () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useTripItineraryQuery("undefined", true), {
      wrapper: Wrapper,
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(api.getTripDaysWithActivities).not.toHaveBeenCalled();
  });

  it("disables the itinerary query when enabled is false (no session/auth ready)", () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useTripItineraryQuery(tripId, false), {
      wrapper: Wrapper,
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(api.getTripDaysWithActivities).not.toHaveBeenCalled();
  });

  it("disables activity detail without a valid activityId", () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useTripActivityQuery(tripId, "bad", true), {
      wrapper: Wrapper,
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(api.getTripActivityById).not.toHaveBeenCalled();
  });

  it("invalidates itinerary queries after create", async () => {
    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateTripActivityMutation(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        tripId,
        tripDayId: dayId,
        title: "Walk",
        category: "activity",
        isAllDay: true,
      });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: itineraryKeys.trip(tripId),
      });
    });
  });

  it("invalidates activity detail after update", async () => {
    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateTripActivityMutation(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        tripId,
        activityId,
        title: "Updated",
      });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: itineraryKeys.activity(tripId, activityId),
      });
    });
  });

  it("exposes pending state so UI can prevent duplicate submissions", async () => {
    let resolveCreate: ((value: TripActivity) => void) | undefined;
    api.createTripActivity.mockImplementation(
      () =>
        new Promise<TripActivity>((resolve) => {
          resolveCreate = resolve;
        }),
    );

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateTripActivityMutation(), {
      wrapper: Wrapper,
    });

    let first: Promise<TripActivity> | undefined;
    act(() => {
      first = result.current.mutateAsync({
        tripId,
        tripDayId: dayId,
        title: "Walk",
        category: "activity",
        isAllDay: true,
      });
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    expect(api.createTripActivity).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveCreate?.(mockMakeActivity());
      await first;
    });
  });

  it("invalidates itinerary after delete and reorder", async () => {
    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const deleteHook = renderHook(() => useDeleteTripActivityMutation(), {
      wrapper: Wrapper,
    });
    await act(async () => {
      await deleteHook.result.current.mutateAsync({ tripId, activityId });
    });

    const reorderHook = renderHook(() => useReorderTripActivitiesMutation(), {
      wrapper: Wrapper,
    });
    await act(async () => {
      await reorderHook.result.current.mutateAsync({
        tripId,
        tripDayId: dayId,
        activityIds: [activityId],
      });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: itineraryKeys.trip(tripId),
      });
    });
  });
});
