import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";

import {
  bookingKeys,
  useCreateTripBookingMutation,
  useDeleteTripBookingMutation,
  useTripBookingQuery,
  useTripBookingsQuery,
  useUpdateTripBookingMutation,
} from "@/features/bookings/hooks";
import type { TripBooking } from "@/types/models";

const tripId = "11111111-1111-4111-8111-111111111111";
const bookingId = "22222222-2222-4222-8222-222222222222";

function mockMakeBooking(overrides: Partial<TripBooking> = {}): TripBooking {
  return {
    id: bookingId,
    tripId,
    createdBy: "33333333-3333-4333-8333-333333333333",
    bookingType: "accommodation",
    title: "Hotel Amara",
    providerName: null,
    confirmationNumber: null,
    bookingReference: null,
    status: null,
    startDate: null,
    startTime: null,
    endDate: null,
    endTime: null,
    locationName: null,
    address: null,
    geoapifyPlaceId: null,
    latitude: null,
    longitude: null,
    departureLocation: null,
    arrivalLocation: null,
    carrierName: null,
    transportNumber: null,
    terminal: null,
    gate: null,
    checkInTime: null,
    checkOutTime: null,
    notes: null,
    createdAt: "2026-08-01T10:00:00Z",
    updatedAt: "2026-08-01T10:00:00Z",
    ...overrides,
  };
}

jest.mock("@/features/bookings/api", () => ({
  getTripBookings: jest.fn(async () => []),
  getTripBookingById: jest.fn(async () => mockMakeBooking()),
  createTripBooking: jest.fn(),
  updateTripBooking: jest.fn(),
  deleteTripBooking: jest.fn(async () => undefined),
}));

const api = jest.requireMock("@/features/bookings/api") as {
  getTripBookings: jest.Mock;
  getTripBookingById: jest.Mock;
  createTripBooking: jest.Mock;
  updateTripBooking: jest.Mock;
  deleteTripBooking: jest.Mock;
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

describe("bookings hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.createTripBooking.mockImplementation(async (input: { tripId: string }) =>
      mockMakeBooking({ tripId: input.tripId }),
    );
    api.updateTripBooking.mockImplementation(
      async (input: { tripId: string; bookingId: string }) =>
        mockMakeBooking({ tripId: input.tripId, id: input.bookingId }),
    );
    api.getTripBookingById.mockImplementation(async () => mockMakeBooking());
  });

  it("disables the bookings query without a valid tripId", () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useTripBookingsQuery("undefined", true), {
      wrapper: Wrapper,
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(api.getTripBookings).not.toHaveBeenCalled();
  });

  it("disables the bookings query when enabled is false", () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useTripBookingsQuery(tripId, false), {
      wrapper: Wrapper,
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(api.getTripBookings).not.toHaveBeenCalled();
  });

  it("disables booking detail without a valid bookingId", () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useTripBookingQuery(tripId, "bad", true), {
      wrapper: Wrapper,
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(api.getTripBookingById).not.toHaveBeenCalled();
  });

  it("invalidates booking queries after create", async () => {
    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateTripBookingMutation(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        tripId,
        bookingType: "accommodation",
        title: "Hotel Amara",
      });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: bookingKeys.trip(tripId),
      });
    });
  });

  it("invalidates booking detail after update", async () => {
    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateTripBookingMutation(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        tripId,
        bookingId,
        title: "Updated",
      });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: bookingKeys.booking(tripId, bookingId),
      });
    });
  });

  it("invalidates bookings after delete", async () => {
    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useDeleteTripBookingMutation(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({ tripId, bookingId });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: bookingKeys.trip(tripId),
      });
    });
  });
});
