import {
  filterBookingsByType,
  isBookingPast,
  splitUpcomingPastBookings,
} from "@/features/bookings/filters";
import type { TripBooking } from "@/types/models";

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

describe("bookings filters", () => {
  it("filters bookings by type", () => {
    const bookings = [
      booking({ id: "a", bookingType: "flight" }),
      booking({ id: "b", bookingType: "accommodation" }),
    ];
    expect(filterBookingsByType(bookings, "all")).toHaveLength(2);
    expect(filterBookingsByType(bookings, "flight").map((b) => b.id)).toEqual(["a"]);
    expect(filterBookingsByType(bookings, "restaurant")).toEqual([]);
  });

  it("treats undated bookings as never past", () => {
    expect(isBookingPast(booking({ startDate: null, endDate: null }), "2026-09-01")).toBe(
      false,
    );
  });

  it("uses end date when present, otherwise start date", () => {
    expect(
      isBookingPast(
        booking({ startDate: "2026-09-01", endDate: "2026-09-05" }),
        "2026-09-03",
      ),
    ).toBe(false);
    expect(
      isBookingPast(
        booking({ startDate: "2026-09-01", endDate: "2026-09-05" }),
        "2026-09-06",
      ),
    ).toBe(true);
    expect(isBookingPast(booking({ startDate: "2026-09-01", endDate: null }), "2026-09-02")).toBe(
      true,
    );
  });

  it("splits bookings into upcoming and past groups", () => {
    const bookings = [
      booking({ id: "past", startDate: "2026-08-01" }),
      booking({ id: "future", startDate: "2026-09-01" }),
      booking({ id: "undated", startDate: null }),
    ];
    const { upcoming, past } = splitUpcomingPastBookings(bookings, "2026-08-15");
    expect(past.map((b) => b.id)).toEqual(["past"]);
    expect(upcoming.map((b) => b.id)).toEqual(["future", "undated"]);
  });
});
