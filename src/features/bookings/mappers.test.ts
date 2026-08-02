import { mapBookingRow, sortBookings } from "@/features/bookings/mappers";
import type { TripBooking } from "@/types/models";
import type { TripBookingRow } from "@/types/database";

function booking(overrides: Partial<TripBooking>): TripBooking {
  return {
    id: "b1",
    tripId: "t1",
    createdBy: "u1",
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

function row(overrides: Partial<TripBookingRow> = {}): TripBookingRow {
  return {
    id: "row-1",
    trip_id: "trip-1",
    created_by: "user-1",
    booking_type: "flight",
    title: "SFO to LIS",
    provider_name: "Air Company",
    confirmation_number: "CONF123",
    booking_reference: null,
    status: "confirmed",
    start_date: "2026-09-12",
    start_time: "09:30:00",
    end_date: "2026-09-12",
    end_time: "17:45:00",
    location_name: null,
    address: null,
    geoapify_place_id: null,
    latitude: null,
    longitude: null,
    departure_location: "SFO",
    arrival_location: "LIS",
    carrier_name: "Air Company",
    transport_number: "AC123",
    terminal: "2",
    gate: "B12",
    check_in_time: null,
    check_out_time: null,
    notes: null,
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
    ...overrides,
  };
}

describe("bookings mappers", () => {
  it("maps a booking row to a domain booking", () => {
    const mapped = mapBookingRow(row());
    expect(mapped.id).toBe("row-1");
    expect(mapped.bookingType).toBe("flight");
    expect(mapped.startTime).toBe("09:30");
    expect(mapped.endTime).toBe("17:45");
    expect(mapped.departureLocation).toBe("SFO");
    expect(mapped.arrivalLocation).toBe("LIS");
    expect(mapped.terminal).toBe("2");
    expect(mapped.gate).toBe("B12");
  });

  it("normalizes null time fields", () => {
    const mapped = mapBookingRow(
      row({ start_time: null, end_time: null, check_in_time: "15:00:00" }),
    );
    expect(mapped.startTime).toBeNull();
    expect(mapped.endTime).toBeNull();
    expect(mapped.checkInTime).toBe("15:00");
  });

  it("sorts by start date (nulls last), then start time (nulls last), then created_at", () => {
    const sorted = sortBookings([
      booking({ id: "undated", startDate: null, createdAt: "2026-08-01T09:00:00Z" }),
      booking({
        id: "day2-notime",
        startDate: "2026-09-13",
        startTime: null,
        createdAt: "2026-08-01T08:00:00Z",
      }),
      booking({
        id: "day1-late",
        startDate: "2026-09-12",
        startTime: "15:00",
        createdAt: "2026-08-01T07:00:00Z",
      }),
      booking({
        id: "day1-early",
        startDate: "2026-09-12",
        startTime: "09:00",
        createdAt: "2026-08-01T06:00:00Z",
      }),
      booking({
        id: "day1-early-later-created",
        startDate: "2026-09-12",
        startTime: "09:00",
        createdAt: "2026-08-01T10:00:00Z",
      }),
    ]);

    expect(sorted.map((item) => item.id)).toEqual([
      "day1-early",
      "day1-early-later-created",
      "day1-late",
      "day2-notime",
      "undated",
    ]);
  });
});
