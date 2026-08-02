import {
  createBookingSchema,
  tripBookingFormSchema,
} from "@/validation/bookingSchemas";

function baseValues(overrides: Record<string, unknown> = {}) {
  return {
    bookingType: "accommodation",
    title: "Hotel Amara",
    providerName: "Amara Hotels",
    confirmationNumber: "CONF123",
    bookingReference: null,
    status: "Confirmed",
    startDate: "12/09/2026",
    startTime: null,
    endDate: "15/09/2026",
    endTime: null,
    locationName: "Hotel Amara",
    address: "1 Main St",
    geoapifyPlaceId: null,
    latitude: null,
    longitude: null,
    departureLocation: null,
    arrivalLocation: null,
    carrierName: null,
    transportNumber: null,
    terminal: null,
    gate: null,
    checkInTime: "15:00",
    checkOutTime: "11:00",
    notes: "",
    ...overrides,
  };
}

describe("bookingSchemas", () => {
  it("accepts a valid accommodation booking and converts dates to ISO", () => {
    const result = tripBookingFormSchema.safeParse(baseValues());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.startDate).toBe("2026-09-12");
      expect(result.data.endDate).toBe("2026-09-15");
      expect(result.data.notes).toBeNull();
    }
  });

  it("rejects a blank title", () => {
    const result = createBookingSchema.safeParse(baseValues({ title: "   " }));
    expect(result.success).toBe(false);
  });

  it("treats blank dates and times as null", () => {
    const result = tripBookingFormSchema.safeParse(
      baseValues({ startDate: "", endDate: "", startTime: "", endTime: "" }),
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.startDate).toBeNull();
      expect(result.data.endDate).toBeNull();
    }
  });

  it("rejects an invalid display date", () => {
    const result = tripBookingFormSchema.safeParse(baseValues({ startDate: "31/02/2026" }));
    expect(result.success).toBe(false);
  });

  it("rejects a malformed display date", () => {
    const result = tripBookingFormSchema.safeParse(baseValues({ startDate: "2026-09-12" }));
    expect(result.success).toBe(false);
  });

  it("rejects end date before start date", () => {
    const result = tripBookingFormSchema.safeParse(
      baseValues({ startDate: "15/09/2026", endDate: "12/09/2026" }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects end time before start time on the same day", () => {
    const result = tripBookingFormSchema.safeParse(
      baseValues({
        startDate: "12/09/2026",
        endDate: "12/09/2026",
        startTime: "14:00",
        endTime: "13:00",
      }),
    );
    expect(result.success).toBe(false);
  });

  it("allows equal start and end times on the same day", () => {
    const result = tripBookingFormSchema.safeParse(
      baseValues({
        startDate: "12/09/2026",
        endDate: "12/09/2026",
        startTime: "12:00",
        endTime: "12:00",
      }),
    );
    expect(result.success).toBe(true);
  });

  it("rejects invalid HH:mm values", () => {
    const result = tripBookingFormSchema.safeParse(baseValues({ startTime: "9:00" }));
    expect(result.success).toBe(false);
  });

  it("validates transit booking fields", () => {
    const result = tripBookingFormSchema.safeParse(
      baseValues({
        bookingType: "flight",
        locationName: null,
        address: null,
        departureLocation: "SFO",
        arrivalLocation: "LIS",
        carrierName: "Air Company",
        transportNumber: "AC123",
        terminal: "2",
        gate: "B12",
        checkInTime: null,
        checkOutTime: null,
      }),
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.departureLocation).toBe("SFO");
      expect(result.data.terminal).toBe("2");
    }
  });

  it("requires latitude and longitude together", () => {
    const result = tripBookingFormSchema.safeParse(baseValues({ latitude: 41.88 }));
    expect(result.success).toBe(false);
  });

  it("accepts a complete place selection and clears place fields without coordinates", () => {
    const withPlace = tripBookingFormSchema.safeParse(
      baseValues({ geoapifyPlaceId: "place-abc", latitude: 41.88, longitude: -87.62 }),
    );
    expect(withPlace.success).toBe(true);
    if (withPlace.success) {
      expect(withPlace.data.geoapifyPlaceId).toBe("place-abc");
    }

    const withoutCoords = tripBookingFormSchema.safeParse(
      baseValues({ geoapifyPlaceId: "place-abc" }),
    );
    expect(withoutCoords.success).toBe(false);
  });

  it("enforces maximum lengths for optional text fields", () => {
    const result = tripBookingFormSchema.safeParse(
      baseValues({ providerName: "x".repeat(161) }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects an invalid booking type", () => {
    const result = tripBookingFormSchema.safeParse(baseValues({ bookingType: "cruise" }));
    expect(result.success).toBe(false);
  });
});
