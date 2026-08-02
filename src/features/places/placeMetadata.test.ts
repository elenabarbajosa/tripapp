import { tripActivityFormSchema } from "@/validation/activitySchemas";

const validDayId = "11111111-1111-4111-8111-111111111111";

function baseValues(overrides: Record<string, unknown> = {}) {
  return {
    title: "Visit the market",
    category: "food",
    tripDayId: validDayId,
    destinationId: null,
    isAllDay: true,
    startTime: null,
    endTime: null,
    locationName: "Central Market",
    address: "1 Main St",
    geoapifyPlaceId: null,
    latitude: null,
    longitude: null,
    description: null,
    notes: null,
    ...overrides,
  };
}

describe("activity place metadata validation", () => {
  it("allows manual location without provider metadata", () => {
    const result = tripActivityFormSchema.safeParse(baseValues());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.geoapifyPlaceId).toBeNull();
      expect(result.data.latitude).toBeNull();
      expect(result.data.longitude).toBeNull();
    }
  });

  it("accepts a confirmed Geoapify selection", () => {
    const result = tripActivityFormSchema.safeParse(
      baseValues({
        geoapifyPlaceId: "geo-123",
        latitude: 41.88,
        longitude: -87.62,
      }),
    );
    expect(result.success).toBe(true);
  });

  it("rejects invalid latitude", () => {
    const result = tripActivityFormSchema.safeParse(
      baseValues({ latitude: 120, longitude: -87 }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects invalid longitude", () => {
    const result = tripActivityFormSchema.safeParse(
      baseValues({ latitude: 41, longitude: -200 }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects only one coordinate present", () => {
    const result = tripActivityFormSchema.safeParse(
      baseValues({ latitude: 41.88, longitude: null }),
    );
    expect(result.success).toBe(false);
  });

  it("clears incomplete provider metadata on transform when coords missing", () => {
    const result = tripActivityFormSchema.safeParse(
      baseValues({
        geoapifyPlaceId: "stale-id",
        latitude: null,
        longitude: null,
      }),
    );
    // Incomplete place id without coords should fail refine, not silently keep id.
    expect(result.success).toBe(false);
  });

  it("restores confirmed vs manual semantics for form defaults", () => {
    const confirmed = tripActivityFormSchema.safeParse(
      baseValues({
        locationName: "Art Institute of Chicago",
        address: "111 S Michigan Ave",
        geoapifyPlaceId: "place-1",
        latitude: 41.8796,
        longitude: -87.6237,
      }),
    );
    expect(confirmed.success).toBe(true);

    const manual = tripActivityFormSchema.safeParse(
      baseValues({
        locationName: "My friend's loft",
        address: "Near the river",
        geoapifyPlaceId: null,
        latitude: null,
        longitude: null,
      }),
    );
    expect(manual.success).toBe(true);
    if (manual.success) {
      expect(manual.data.geoapifyPlaceId).toBeNull();
    }
  });
});
