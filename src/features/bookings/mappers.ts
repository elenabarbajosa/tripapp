import type { TripBookingRow } from "@/types/database";
import type { TripBooking } from "@/types/models";
import { parseTimeToHHmm } from "@/utils/time";

export function mapBookingRow(row: TripBookingRow): TripBooking {
  return {
    id: row.id,
    tripId: row.trip_id,
    createdBy: row.created_by,
    bookingType: row.booking_type,
    title: row.title,
    providerName: row.provider_name,
    confirmationNumber: row.confirmation_number,
    bookingReference: row.booking_reference,
    status: row.status,
    startDate: row.start_date,
    startTime: parseTimeToHHmm(row.start_time),
    endDate: row.end_date,
    endTime: parseTimeToHHmm(row.end_time),
    locationName: row.location_name,
    address: row.address,
    geoapifyPlaceId: row.geoapify_place_id,
    latitude: row.latitude,
    longitude: row.longitude,
    departureLocation: row.departure_location,
    arrivalLocation: row.arrival_location,
    carrierName: row.carrier_name,
    transportNumber: row.transport_number,
    terminal: row.terminal,
    gate: row.gate,
    checkInTime: parseTimeToHHmm(row.check_in_time),
    checkOutTime: parseTimeToHHmm(row.check_out_time),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * ORDERING RULE: start_date ascending (nulls last), then start_time ascending
 * (nulls last among dated bookings), then created_at ascending.
 */
export function sortBookings(bookings: TripBooking[]): TripBooking[] {
  return [...bookings].sort((a, b) => {
    if (a.startDate !== b.startDate) {
      if (a.startDate == null) {
        return 1;
      }
      if (b.startDate == null) {
        return -1;
      }
      return a.startDate < b.startDate ? -1 : 1;
    }

    if (a.startTime !== b.startTime) {
      if (a.startTime == null) {
        return 1;
      }
      if (b.startTime == null) {
        return -1;
      }
      return a.startTime < b.startTime ? -1 : 1;
    }

    if (a.createdAt < b.createdAt) {
      return -1;
    }
    if (a.createdAt > b.createdAt) {
      return 1;
    }
    return 0;
  });
}
