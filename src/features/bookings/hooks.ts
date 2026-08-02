import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { isValidUuid } from "@/utils/routeParams";
import {
  createTripBooking,
  deleteTripBooking,
  getTripBookingById,
  getTripBookings,
  updateTripBooking,
  type CreateTripBookingInput,
  type DeleteTripBookingInput,
  type UpdateTripBookingInput,
} from "./api";

export const bookingKeys = {
  all: ["bookings"] as const,
  trip: (tripId: string) => [...bookingKeys.all, tripId] as const,
  booking: (tripId: string, bookingId: string) =>
    [...bookingKeys.trip(tripId), "booking", bookingId] as const,
};

async function invalidateTripBookings(
  queryClient: ReturnType<typeof useQueryClient>,
  tripId: string,
  bookingId?: string,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: bookingKeys.trip(tripId) }),
    bookingId
      ? queryClient.invalidateQueries({
          queryKey: bookingKeys.booking(tripId, bookingId),
        })
      : Promise.resolve(),
  ]);
}

export function useTripBookingsQuery(tripId: string | undefined, enabled: boolean) {
  const resolvedId = typeof tripId === "string" ? tripId.trim() : "";
  const canQuery = enabled && isValidUuid(resolvedId);

  return useQuery({
    queryKey: bookingKeys.trip(canQuery ? resolvedId : ""),
    queryFn: () => getTripBookings(resolvedId),
    enabled: canQuery,
    retry: 1,
  });
}

export function useTripBookingQuery(
  tripId: string | undefined,
  bookingId: string | undefined,
  enabled: boolean,
) {
  const resolvedTripId = typeof tripId === "string" ? tripId.trim() : "";
  const resolvedBookingId = typeof bookingId === "string" ? bookingId.trim() : "";
  const canQuery =
    enabled && isValidUuid(resolvedTripId) && isValidUuid(resolvedBookingId);

  return useQuery({
    queryKey: bookingKeys.booking(
      canQuery ? resolvedTripId : "",
      canQuery ? resolvedBookingId : "",
    ),
    queryFn: () => getTripBookingById(resolvedTripId, resolvedBookingId),
    enabled: canQuery,
    retry: 1,
  });
}

export function useCreateTripBookingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTripBookingInput) => createTripBooking(input),
    onSuccess: async (booking) => {
      await invalidateTripBookings(queryClient, booking.tripId, booking.id);
    },
  });
}

export function useUpdateTripBookingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTripBookingInput) => updateTripBooking(input),
    onSuccess: async (booking) => {
      await invalidateTripBookings(queryClient, booking.tripId, booking.id);
    },
  });
}

export function useDeleteTripBookingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeleteTripBookingInput) => deleteTripBooking(input),
    onSuccess: async (_data, variables) => {
      await invalidateTripBookings(queryClient, variables.tripId, variables.bookingId);
    },
  });
}
