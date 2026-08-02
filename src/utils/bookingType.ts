import type { TripBookingType } from "@/types/models";
import { colors } from "@/theme/colors";

const bookingTypeLabels: Record<TripBookingType, string> = {
  accommodation: "Accommodation",
  flight: "Flight",
  train: "Train",
  bus: "Bus",
  car_rental: "Car rental",
  restaurant: "Restaurant",
  activity: "Activity",
  other: "Other",
};

const bookingTypeColors: Record<TripBookingType, string> = {
  accommodation: colors.accommodation,
  flight: colors.flight,
  train: colors.train,
  bus: colors.bus,
  car_rental: colors.carRental,
  restaurant: colors.restaurant,
  activity: colors.activity,
  other: colors.other,
};

export const TRIP_BOOKING_TYPES: TripBookingType[] = [
  "accommodation",
  "flight",
  "train",
  "bus",
  "car_rental",
  "restaurant",
  "activity",
  "other",
];

export function getTripBookingTypeLabel(bookingType: TripBookingType): string {
  return bookingTypeLabels[bookingType];
}

export function getTripBookingTypeColor(bookingType: TripBookingType): string {
  return bookingTypeColors[bookingType];
}

const PLACE_FIELD_TYPES: readonly TripBookingType[] = [
  "accommodation",
  "restaurant",
  "activity",
  "other",
];

/** Booking types that use a searchable place (accommodation, restaurant, activity, other). */
export function usesPlaceFields(bookingType: TripBookingType): boolean {
  return PLACE_FIELD_TYPES.includes(bookingType);
}

/** Booking types that use departure/arrival + carrier text fields (flight, train, bus, car rental). */
export function usesTransitFields(bookingType: TripBookingType): boolean {
  return !usesPlaceFields(bookingType);
}

/** Only flights show terminal/gate fields. */
export function showsTerminalGate(bookingType: TripBookingType): boolean {
  return bookingType === "flight";
}

/** Only accommodations show check-in/check-out time fields. */
export function showsCheckInOut(bookingType: TripBookingType): boolean {
  return bookingType === "accommodation";
}
