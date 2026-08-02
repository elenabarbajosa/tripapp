import {
  createTripBooking,
  deleteTripBooking,
  getTripBookingById,
  getTripBookings,
  updateTripBooking,
} from "@/features/bookings/api";

describe("bookings api uuid guards", () => {
  it("rejects invalid trip ids before querying", async () => {
    await expect(getTripBookings("undefined")).rejects.toThrow("Trip id is required.");
    await expect(getTripBookings("")).rejects.toThrow("Trip id is required.");
    await expect(getTripBookings("not-a-uuid")).rejects.toThrow("Trip id is required.");
  });

  it("rejects invalid booking ids before querying", async () => {
    const tripId = "11111111-1111-4111-8111-111111111111";
    await expect(getTripBookingById(tripId, "bad")).rejects.toThrow(
      "Booking id is required.",
    );
    await expect(
      updateTripBooking({ tripId, bookingId: "null", title: "X" }),
    ).rejects.toThrow("Booking id is required.");
    await expect(deleteTripBooking({ tripId, bookingId: "" })).rejects.toThrow(
      "Booking id is required.",
    );
  });

  it("rejects invalid trip id on create", async () => {
    await expect(
      createTripBooking({
        tripId: "bad",
        bookingType: "accommodation",
        title: "Hotel",
      }),
    ).rejects.toThrow("Trip id is required.");
  });
});
