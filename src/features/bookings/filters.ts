import type { TripBooking, TripBookingType } from "@/types/models";
import { compareISODates } from "@/utils/dateOnly";

export type BookingTypeFilter = TripBookingType | "all";

export function filterBookingsByType(
  bookings: TripBooking[],
  filter: BookingTypeFilter,
): TripBooking[] {
  if (filter === "all") {
    return bookings;
  }
  return bookings.filter((booking) => booking.bookingType === filter);
}

/**
 * A booking is "past" once its end date (or start date when no end date is set)
 * is strictly before today. Undated bookings are always treated as upcoming.
 */
export function isBookingPast(booking: TripBooking, todayISO: string): boolean {
  const referenceDate = booking.endDate ?? booking.startDate;
  if (!referenceDate) {
    return false;
  }
  return compareISODates(referenceDate, todayISO) < 0;
}

export interface SplitBookings {
  upcoming: TripBooking[];
  past: TripBooking[];
}

/** Splits a pre-sorted booking list into upcoming and past groups. */
export function splitUpcomingPastBookings(
  bookings: TripBooking[],
  todayISO: string,
): SplitBookings {
  const upcoming: TripBooking[] = [];
  const past: TripBooking[] = [];
  for (const booking of bookings) {
    if (isBookingPast(booking, todayISO)) {
      past.push(booking);
    } else {
      upcoming.push(booking);
    }
  }
  return { upcoming, past };
}
