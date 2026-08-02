import {
  createActivitySchema,
  tripActivityFormSchema,
} from "@/validation/activitySchemas";

const validDayId = "11111111-1111-4111-8111-111111111111";
const validDestinationId = "22222222-2222-4222-8222-222222222222";

function baseValues(overrides: Record<string, unknown> = {}) {
  return {
    title: "Visit the market",
    category: "food",
    tripDayId: validDayId,
    destinationId: validDestinationId,
    isAllDay: false,
    startTime: "10:00",
    endTime: "11:30",
    locationName: "Central Market",
    address: "1 Main St",
    description: "Try local pastries",
    notes: "",
    ...overrides,
  };
}

describe("activitySchemas", () => {
  it("accepts a valid timed activity", () => {
    const result = tripActivityFormSchema.safeParse(baseValues());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.startTime).toBe("10:00");
      expect(result.data.endTime).toBe("11:30");
      expect(result.data.notes).toBeNull();
    }
  });

  it("rejects a blank title", () => {
    const result = createActivitySchema.safeParse(baseValues({ title: "   " }));
    expect(result.success).toBe(false);
  });

  it("accepts a valid all-day activity and clears times", () => {
    const result = tripActivityFormSchema.safeParse(
      baseValues({ isAllDay: true, startTime: "09:00", endTime: "10:00" }),
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isAllDay).toBe(true);
      expect(result.data.startTime).toBeNull();
      expect(result.data.endTime).toBeNull();
    }
  });

  it("accepts a start time without an end time", () => {
    const result = tripActivityFormSchema.safeParse(
      baseValues({ endTime: "" }),
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.startTime).toBe("10:00");
      expect(result.data.endTime).toBeNull();
    }
  });

  it("rejects end time before start time", () => {
    const result = tripActivityFormSchema.safeParse(
      baseValues({ startTime: "14:00", endTime: "13:00" }),
    );
    expect(result.success).toBe(false);
  });

  it("allows equal start and end times", () => {
    const result = tripActivityFormSchema.safeParse(
      baseValues({ startTime: "12:00", endTime: "12:00" }),
    );
    expect(result.success).toBe(true);
  });

  it("rejects invalid HH:mm values", () => {
    const result = tripActivityFormSchema.safeParse(
      baseValues({ startTime: "9:00" }),
    );
    expect(result.success).toBe(false);
  });

  it("maps empty destinationId to null", () => {
    const result = tripActivityFormSchema.safeParse(
      baseValues({ destinationId: "" }),
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.destinationId).toBeNull();
    }
  });

  it("enforces maximum lengths for optional text fields", () => {
    const result = tripActivityFormSchema.safeParse(
      baseValues({ locationName: "x".repeat(161) }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects an invalid category", () => {
    const result = tripActivityFormSchema.safeParse(
      baseValues({ category: "restaurant" }),
    );
    expect(result.success).toBe(false);
  });
});
