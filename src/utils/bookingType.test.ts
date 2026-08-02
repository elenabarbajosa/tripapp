import {
  getTripBookingTypeColor,
  getTripBookingTypeLabel,
  showsCheckInOut,
  showsTerminalGate,
  TRIP_BOOKING_TYPES,
  usesPlaceFields,
  usesTransitFields,
} from "@/utils/bookingType";

describe("bookingType utils", () => {
  it("lists all booking types", () => {
    expect(TRIP_BOOKING_TYPES).toEqual([
      "accommodation",
      "flight",
      "train",
      "bus",
      "car_rental",
      "restaurant",
      "activity",
      "other",
    ]);
  });

  it("provides a label and color for every booking type", () => {
    for (const type of TRIP_BOOKING_TYPES) {
      expect(getTripBookingTypeLabel(type).length).toBeGreaterThan(0);
      expect(getTripBookingTypeColor(type)).toMatch(/^#/);
    }
  });

  it("uses place fields for accommodation, restaurant, activity, and other", () => {
    expect(usesPlaceFields("accommodation")).toBe(true);
    expect(usesPlaceFields("restaurant")).toBe(true);
    expect(usesPlaceFields("activity")).toBe(true);
    expect(usesPlaceFields("other")).toBe(true);
    expect(usesPlaceFields("flight")).toBe(false);
  });

  it("uses transit fields for flight, train, bus, and car rental", () => {
    expect(usesTransitFields("flight")).toBe(true);
    expect(usesTransitFields("train")).toBe(true);
    expect(usesTransitFields("bus")).toBe(true);
    expect(usesTransitFields("car_rental")).toBe(true);
    expect(usesTransitFields("accommodation")).toBe(false);
  });

  it("only shows terminal/gate for flights", () => {
    expect(showsTerminalGate("flight")).toBe(true);
    expect(showsTerminalGate("train")).toBe(false);
  });

  it("only shows check-in/check-out for accommodation", () => {
    expect(showsCheckInOut("accommodation")).toBe(true);
    expect(showsCheckInOut("flight")).toBe(false);
  });
});
