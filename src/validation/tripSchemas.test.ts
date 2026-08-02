import {
  buildNextDestinationDefaults,
  createTripBasicsSchema,
  createTripDestinationsSchema,
} from "@/validation/tripSchemas";

describe("tripSchemas", () => {
  it("accepts valid basics", () => {
    const result = createTripBasicsSchema.safeParse({
      name: "Midwest Road Trip",
      startDate: "2026-09-12",
      endDate: "2026-09-24",
      coverImageUrl: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects inverted date ranges", () => {
    const result = createTripBasicsSchema.safeParse({
      name: "Bad trip",
      startDate: "2026-09-24",
      endDate: "2026-09-12",
      coverImageUrl: "",
    });
    expect(result.success).toBe(false);
  });

  it("requires at least one destination and valid country selection", () => {
    const empty = createTripDestinationsSchema.safeParse({
      tripStartDate: "2026-09-12",
      tripEndDate: "2026-09-24",
      destinations: [],
    });
    expect(empty.success).toBe(false);

    const withCountry = createTripDestinationsSchema.safeParse({
      tripStartDate: "2026-09-12",
      tripEndDate: "2026-09-24",
      destinations: [
        {
          id: "1",
          city: "Madrid",
          country: "Spain",
          countryCode: "ES",
          currencyCode: "EUR",
          arrivalDate: "2026-09-12",
          departureDate: "2026-09-14",
        },
      ],
    });
    expect(withCountry.success).toBe(true);
  });

  it("rejects destination dates outside the trip range", () => {
    const result = createTripDestinationsSchema.safeParse({
      tripStartDate: "2026-09-12",
      tripEndDate: "2026-09-24",
      destinations: [
        {
          id: "1",
          city: "Madrid",
          country: "Spain",
          countryCode: "ES",
          currencyCode: "EUR",
          arrivalDate: "2026-09-10",
          departureDate: "2026-09-14",
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("allows same-day destination transitions", () => {
    const result = createTripDestinationsSchema.safeParse({
      tripStartDate: "2026-09-12",
      tripEndDate: "2026-09-14",
      destinations: [
        {
          id: "1",
          city: "Chicago",
          country: "United States",
          countryCode: "US",
          currencyCode: "USD",
          arrivalDate: "2026-09-12",
          departureDate: "2026-09-13",
        },
        {
          id: "2",
          city: "Toronto",
          country: "Canada",
          countryCode: "CA",
          currencyCode: "CAD",
          arrivalDate: "2026-09-13",
          departureDate: "2026-09-14",
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("enforces tripStart <= arrival <= departure <= tripEnd", () => {
    const arrivalAfterEnd = createTripDestinationsSchema.safeParse({
      tripStartDate: "2026-09-12",
      tripEndDate: "2026-09-14",
      destinations: [
        {
          id: "1",
          city: "Madrid",
          country: "Spain",
          countryCode: "ES",
          currencyCode: "EUR",
          arrivalDate: "2026-09-15",
          departureDate: "2026-09-15",
        },
      ],
    });
    expect(arrivalAfterEnd.success).toBe(false);

    const departureBeforeArrival = createTripDestinationsSchema.safeParse({
      tripStartDate: "2026-09-12",
      tripEndDate: "2026-09-20",
      destinations: [
        {
          id: "1",
          city: "Madrid",
          country: "Spain",
          countryCode: "ES",
          currencyCode: "EUR",
          arrivalDate: "2026-09-15",
          departureDate: "2026-09-14",
        },
      ],
    });
    expect(departureBeforeArrival.success).toBe(false);
  });

  it("prefills the next destination from the previous departure", () => {
    expect(
      buildNextDestinationDefaults({
        tripStartDate: "2026-09-12",
        tripEndDate: "2026-09-24",
        previous: { departureDate: "2026-09-15" },
      }),
    ).toEqual({
      arrivalDate: "2026-09-15",
      departureDate: "2026-09-24",
    });
  });

  it("does not accept latitude or longitude fields in destination forms", () => {
    const result = createTripDestinationsSchema.safeParse({
      tripStartDate: "2026-09-12",
      tripEndDate: "2026-09-14",
      destinations: [
        {
          id: "1",
          city: "Madrid",
          country: "Spain",
          countryCode: "ES",
          currencyCode: "EUR",
          arrivalDate: "2026-09-12",
          departureDate: "2026-09-14",
          latitude: "40.4",
          longitude: "-3.7",
        },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.destinations[0]).not.toHaveProperty("latitude");
      expect(result.data.destinations[0]).not.toHaveProperty("longitude");
    }
  });
});
