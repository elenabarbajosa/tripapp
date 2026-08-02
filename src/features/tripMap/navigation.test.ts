import { isValidUuid } from "@/utils/routeParams";

describe("map navigation params", () => {
  it("never builds /trips/undefined paths when ids are missing", () => {
    const tripId: string | undefined = undefined;
    const bookingId: string | undefined = undefined;
    expect(isValidUuid(tripId)).toBe(false);
    expect(isValidUuid(bookingId)).toBe(false);

    const safePush = (params: { tripId?: string; bookingId?: string }) => {
      if (!isValidUuid(params.tripId) || !isValidUuid(params.bookingId)) {
        return null;
      }
      return {
        pathname: "/trips/[tripId]/bookings/[bookingId]",
        params: { tripId: params.tripId, bookingId: params.bookingId },
      };
    };

    expect(safePush({ tripId, bookingId })).toBeNull();
    expect(
      safePush({
        tripId: "11111111-1111-4111-8111-111111111111",
        bookingId: "22222222-2222-4222-8222-222222222222",
      }),
    ).toEqual({
      pathname: "/trips/[tripId]/bookings/[bookingId]",
      params: {
        tripId: "11111111-1111-4111-8111-111111111111",
        bookingId: "22222222-2222-4222-8222-222222222222",
      },
    });
  });
});
