import { getBookingErrorDebug, mapBookingError } from "@/features/bookings/errors";

describe("mapBookingError", () => {
  it("maps auth failures to a sign-in prompt", () => {
    expect(mapBookingError({ message: "JWT expired: not authenticated" }).message).toBe(
      "Sign in to view bookings.",
    );
    expect(mapBookingError({ code: "PGRST301", message: "" }).message).toBe(
      "Sign in to view bookings.",
    );
  });

  it("maps permission errors", () => {
    expect(
      mapBookingError({ code: "42501", message: "permission denied for table trip_bookings" })
        .message,
    ).toBe("You do not have permission to change this booking.");
  });

  it("maps date and time order check constraint violations", () => {
    expect(
      mapBookingError({
        code: "23514",
        message: "violates check constraint \"trip_bookings_date_order\"",
      }).message,
    ).toBe("End date must be on or after the start date.");
    expect(
      mapBookingError({
        code: "23514",
        message: "violates check constraint \"trip_bookings_time_order\"",
      }).message,
    ).toBe("End time must be on or after start time.");
  });

  it("maps lat/lng constraint violations", () => {
    expect(
      mapBookingError({
        code: "23514",
        message: "violates check constraint \"trip_bookings_lat_lng_pair\"",
      }).message,
    ).toBe("Selected location is invalid. Try searching again.");
  });

  it("maps foreign key violations", () => {
    expect(
      mapBookingError({ code: "23503", message: "violates foreign key constraint" }).message,
    ).toBe("That trip is no longer available.");
  });

  it("maps missing rows", () => {
    expect(mapBookingError({ code: "PGRST116", message: "contains 0 rows" }).message).toBe(
      "Booking not found.",
    );
  });

  it("falls back to a generic message for unknown errors", () => {
    expect(mapBookingError(null).message).toBe("Unable to load bookings. Please try again.");
    expect(mapBookingError("oops").message).toBe("Unable to load bookings. Please try again.");
  });

  it("extracts debug info without leaking when absent", () => {
    expect(getBookingErrorDebug(null)).toBeNull();
    expect(getBookingErrorDebug({ message: "boom", code: "500" })).toEqual({
      message: "boom",
      code: "500",
      details: undefined,
      hint: undefined,
    });
  });
});
