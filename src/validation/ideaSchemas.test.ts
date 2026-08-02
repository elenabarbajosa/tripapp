import { ideaFormSchema, promoteIdeaSchema } from "@/validation/ideaSchemas";

function baseIdeaValues(overrides: Record<string, unknown> = {}) {
  return {
    title: "Night market",
    description: "Street food and live music",
    category: "food",
    destinationId: null,
    locationName: "Night Market",
    address: "1 Market St",
    geoapifyPlaceId: null,
    latitude: null,
    longitude: null,
    ...overrides,
  };
}

describe("ideaFormSchema", () => {
  it("accepts a valid idea", () => {
    const result = ideaFormSchema.safeParse(baseIdeaValues());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Night market");
      expect(result.data.category).toBe("food");
    }
  });

  it("rejects a blank title", () => {
    const result = ideaFormSchema.safeParse(baseIdeaValues({ title: "   " }));
    expect(result.success).toBe(false);
  });

  it("rejects an invalid category", () => {
    const result = ideaFormSchema.safeParse(baseIdeaValues({ category: "cruise" }));
    expect(result.success).toBe(false);
  });

  it("rejects an invalid destination id", () => {
    const result = ideaFormSchema.safeParse(baseIdeaValues({ destinationId: "bad" }));
    expect(result.success).toBe(false);
  });

  it("requires latitude and longitude together", () => {
    const result = ideaFormSchema.safeParse(baseIdeaValues({ latitude: 41.88 }));
    expect(result.success).toBe(false);
  });

  it("accepts a complete place selection and clears place fields without coordinates", () => {
    const withPlace = ideaFormSchema.safeParse(
      baseIdeaValues({ geoapifyPlaceId: "place-abc", latitude: 41.88, longitude: -87.62 }),
    );
    expect(withPlace.success).toBe(true);
    if (withPlace.success) {
      expect(withPlace.data.geoapifyPlaceId).toBe("place-abc");
    }

    const withoutCoords = ideaFormSchema.safeParse(
      baseIdeaValues({ geoapifyPlaceId: "place-abc" }),
    );
    expect(withoutCoords.success).toBe(false);
  });

  it("enforces maximum lengths for optional text fields", () => {
    const result = ideaFormSchema.safeParse(baseIdeaValues({ description: "x".repeat(2001) }));
    expect(result.success).toBe(false);
  });

  it("treats blank optional text as null", () => {
    const result = ideaFormSchema.safeParse(baseIdeaValues({ description: "" }));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeNull();
    }
  });
});

function basePromoteValues(overrides: Record<string, unknown> = {}) {
  return {
    tripDayId: "11111111-1111-4111-8111-111111111111",
    destinationId: null,
    isAllDay: true,
    startTime: null,
    endTime: null,
    notes: null,
    ...overrides,
  };
}

describe("promoteIdeaSchema", () => {
  it("accepts a valid all-day promotion", () => {
    const result = promoteIdeaSchema.safeParse(basePromoteValues());
    expect(result.success).toBe(true);
  });

  it("requires a valid trip day id", () => {
    const result = promoteIdeaSchema.safeParse(basePromoteValues({ tripDayId: "bad" }));
    expect(result.success).toBe(false);
  });

  it("rejects end time before start time when not all day", () => {
    const result = promoteIdeaSchema.safeParse(
      basePromoteValues({ isAllDay: false, startTime: "14:00", endTime: "13:00" }),
    );
    expect(result.success).toBe(false);
  });

  it("clears times when all day is true", () => {
    const result = promoteIdeaSchema.safeParse(
      basePromoteValues({ isAllDay: true, startTime: "14:00", endTime: "15:00" }),
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.startTime).toBeNull();
      expect(result.data.endTime).toBeNull();
    }
  });

  it("accepts a valid timed promotion", () => {
    const result = promoteIdeaSchema.safeParse(
      basePromoteValues({ isAllDay: false, startTime: "09:00", endTime: "11:00" }),
    );
    expect(result.success).toBe(true);
  });

  it("rejects invalid HH:mm values", () => {
    const result = promoteIdeaSchema.safeParse(
      basePromoteValues({ isAllDay: false, startTime: "9:00" }),
    );
    expect(result.success).toBe(false);
  });
});
