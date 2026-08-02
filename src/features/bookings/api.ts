import { requireSupabaseClient } from "@/services/supabase";
import type { Database, TripBookingType } from "@/types/database";
import type { TripBooking } from "@/types/models";
import { isValidUuid } from "@/utils/routeParams";
import { formatTimeHHmm } from "@/utils/time";
import { mapBookingError, getBookingErrorDebug } from "./errors";
import { mapBookingRow, sortBookings } from "./mappers";

type TripBookingUpdate = Database["public"]["Tables"]["trip_bookings"]["Update"];

const BOOKING_SELECT = `
  id,
  trip_id,
  created_by,
  booking_type,
  title,
  provider_name,
  confirmation_number,
  booking_reference,
  status,
  start_date,
  start_time,
  end_date,
  end_time,
  location_name,
  address,
  geoapify_place_id,
  latitude,
  longitude,
  departure_location,
  arrival_location,
  carrier_name,
  transport_number,
  terminal,
  gate,
  check_in_time,
  check_out_time,
  notes,
  created_at,
  updated_at
`;

export interface CreateTripBookingInput {
  tripId: string;
  bookingType: TripBookingType;
  title: string;
  providerName?: string | null;
  confirmationNumber?: string | null;
  bookingReference?: string | null;
  status?: string | null;
  startDate?: string | null;
  startTime?: string | null;
  endDate?: string | null;
  endTime?: string | null;
  locationName?: string | null;
  address?: string | null;
  geoapifyPlaceId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  departureLocation?: string | null;
  arrivalLocation?: string | null;
  carrierName?: string | null;
  transportNumber?: string | null;
  terminal?: string | null;
  gate?: string | null;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  notes?: string | null;
}

export interface UpdateTripBookingInput {
  tripId: string;
  bookingId: string;
  bookingType?: TripBookingType;
  title?: string;
  providerName?: string | null;
  confirmationNumber?: string | null;
  bookingReference?: string | null;
  status?: string | null;
  startDate?: string | null;
  startTime?: string | null;
  endDate?: string | null;
  endTime?: string | null;
  locationName?: string | null;
  address?: string | null;
  geoapifyPlaceId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  departureLocation?: string | null;
  arrivalLocation?: string | null;
  carrierName?: string | null;
  transportNumber?: string | null;
  terminal?: string | null;
  gate?: string | null;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  notes?: string | null;
}

export interface DeleteTripBookingInput {
  tripId: string;
  bookingId: string;
}

function assertUuid(value: string | undefined | null, label: string): string {
  if (!isValidUuid(value)) {
    throw new Error(`${label} is required.`);
  }
  return value.trim();
}

function toDbTime(value: string | null | undefined): string | null {
  if (value == null || value === "") {
    return null;
  }
  return formatTimeHHmm(value);
}

function toDbDate(value: string | null | undefined): string | null {
  if (value == null || value === "") {
    return null;
  }
  return value;
}

function logBookingError(context: string, error: unknown): void {
  if (!__DEV__) {
    return;
  }
  console.warn(`[bookings:${context}]`, getBookingErrorDebug(error));
}

export async function getTripBookings(tripId: string): Promise<TripBooking[]> {
  const resolvedTripId = assertUuid(tripId, "Trip id");
  const client = requireSupabaseClient();

  const { data, error } = await client
    .from("trip_bookings")
    .select(BOOKING_SELECT)
    .eq("trip_id", resolvedTripId);

  if (error) {
    logBookingError("getTripBookings", error);
    throw mapBookingError(error);
  }

  return sortBookings((data ?? []).map((row) => mapBookingRow(row)));
}

export async function getTripBookingById(
  tripId: string,
  bookingId: string,
): Promise<TripBooking | null> {
  const resolvedTripId = assertUuid(tripId, "Trip id");
  const resolvedBookingId = assertUuid(bookingId, "Booking id");
  const client = requireSupabaseClient();

  const { data, error } = await client
    .from("trip_bookings")
    .select(BOOKING_SELECT)
    .eq("trip_id", resolvedTripId)
    .eq("id", resolvedBookingId)
    .maybeSingle();

  if (error) {
    logBookingError("getTripBookingById", error);
    throw mapBookingError(error);
  }

  if (!data) {
    return null;
  }

  return mapBookingRow(data);
}

export async function createTripBooking(
  input: CreateTripBookingInput,
): Promise<TripBooking> {
  const tripId = assertUuid(input.tripId, "Trip id");

  const client = requireSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();

  if (authError) {
    logBookingError("createTripBooking.auth", authError);
    throw mapBookingError(authError);
  }
  if (!user) {
    throw new Error("Sign in to add a booking.");
  }

  const hasPlace = input.latitude != null && input.longitude != null;

  const { data, error } = await client
    .from("trip_bookings")
    .insert({
      trip_id: tripId,
      created_by: user.id,
      booking_type: input.bookingType,
      title: input.title.trim(),
      provider_name: input.providerName?.trim() || null,
      confirmation_number: input.confirmationNumber?.trim() || null,
      booking_reference: input.bookingReference?.trim() || null,
      status: input.status?.trim() || null,
      start_date: toDbDate(input.startDate),
      start_time: toDbTime(input.startTime),
      end_date: toDbDate(input.endDate),
      end_time: toDbTime(input.endTime),
      location_name: input.locationName?.trim() || null,
      address: input.address?.trim() || null,
      geoapify_place_id: hasPlace ? input.geoapifyPlaceId?.trim() || null : null,
      latitude: hasPlace ? input.latitude : null,
      longitude: hasPlace ? input.longitude : null,
      departure_location: input.departureLocation?.trim() || null,
      arrival_location: input.arrivalLocation?.trim() || null,
      carrier_name: input.carrierName?.trim() || null,
      transport_number: input.transportNumber?.trim() || null,
      terminal: input.terminal?.trim() || null,
      gate: input.gate?.trim() || null,
      check_in_time: toDbTime(input.checkInTime),
      check_out_time: toDbTime(input.checkOutTime),
      notes: input.notes?.trim() || null,
    })
    .select(BOOKING_SELECT)
    .single();

  if (error) {
    logBookingError("createTripBooking", error);
    throw mapBookingError(error);
  }

  return mapBookingRow(data);
}

export async function updateTripBooking(
  input: UpdateTripBookingInput,
): Promise<TripBooking> {
  const tripId = assertUuid(input.tripId, "Trip id");
  const bookingId = assertUuid(input.bookingId, "Booking id");

  const patch: TripBookingUpdate = {};

  if (input.bookingType !== undefined) {
    patch.booking_type = input.bookingType;
  }
  if (input.title !== undefined) {
    patch.title = input.title.trim();
  }
  if (input.providerName !== undefined) {
    patch.provider_name = input.providerName?.trim() || null;
  }
  if (input.confirmationNumber !== undefined) {
    patch.confirmation_number = input.confirmationNumber?.trim() || null;
  }
  if (input.bookingReference !== undefined) {
    patch.booking_reference = input.bookingReference?.trim() || null;
  }
  if (input.status !== undefined) {
    patch.status = input.status?.trim() || null;
  }
  if (input.startDate !== undefined) {
    patch.start_date = toDbDate(input.startDate);
  }
  if (input.startTime !== undefined) {
    patch.start_time = toDbTime(input.startTime);
  }
  if (input.endDate !== undefined) {
    patch.end_date = toDbDate(input.endDate);
  }
  if (input.endTime !== undefined) {
    patch.end_time = toDbTime(input.endTime);
  }
  if (input.locationName !== undefined) {
    patch.location_name = input.locationName?.trim() || null;
  }
  if (input.address !== undefined) {
    patch.address = input.address?.trim() || null;
  }
  if (input.latitude !== undefined || input.longitude !== undefined) {
    const nextLat = input.latitude !== undefined ? input.latitude : null;
    const nextLng = input.longitude !== undefined ? input.longitude : null;
    const hasPair = nextLat != null && nextLng != null;
    patch.latitude = hasPair ? nextLat : null;
    patch.longitude = hasPair ? nextLng : null;
    if (!hasPair) {
      patch.geoapify_place_id = null;
    } else if (input.geoapifyPlaceId !== undefined) {
      patch.geoapify_place_id = input.geoapifyPlaceId?.trim() || null;
    }
  } else if (input.geoapifyPlaceId !== undefined) {
    patch.geoapify_place_id = input.geoapifyPlaceId?.trim() || null;
  }
  if (input.departureLocation !== undefined) {
    patch.departure_location = input.departureLocation?.trim() || null;
  }
  if (input.arrivalLocation !== undefined) {
    patch.arrival_location = input.arrivalLocation?.trim() || null;
  }
  if (input.carrierName !== undefined) {
    patch.carrier_name = input.carrierName?.trim() || null;
  }
  if (input.transportNumber !== undefined) {
    patch.transport_number = input.transportNumber?.trim() || null;
  }
  if (input.terminal !== undefined) {
    patch.terminal = input.terminal?.trim() || null;
  }
  if (input.gate !== undefined) {
    patch.gate = input.gate?.trim() || null;
  }
  if (input.checkInTime !== undefined) {
    patch.check_in_time = toDbTime(input.checkInTime);
  }
  if (input.checkOutTime !== undefined) {
    patch.check_out_time = toDbTime(input.checkOutTime);
  }
  if (input.notes !== undefined) {
    patch.notes = input.notes?.trim() || null;
  }

  const client = requireSupabaseClient();
  const { data, error } = await client
    .from("trip_bookings")
    .update(patch)
    .eq("trip_id", tripId)
    .eq("id", bookingId)
    .select(BOOKING_SELECT)
    .single();

  if (error) {
    logBookingError("updateTripBooking", error);
    throw mapBookingError(error);
  }

  return mapBookingRow(data);
}

export async function deleteTripBooking(input: DeleteTripBookingInput): Promise<void> {
  const tripId = assertUuid(input.tripId, "Trip id");
  const bookingId = assertUuid(input.bookingId, "Booking id");
  const client = requireSupabaseClient();

  const { error } = await client
    .from("trip_bookings")
    .delete()
    .eq("trip_id", tripId)
    .eq("id", bookingId);

  if (error) {
    logBookingError("deleteTripBooking", error);
    throw mapBookingError(error);
  }
}
