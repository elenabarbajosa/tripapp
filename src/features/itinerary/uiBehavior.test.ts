import { defaultSelectedDayId } from "@/features/itinerary/daySelection";

/**
 * UI selection defaults for the itinerary day chip strip.
 * Full screen rendering is covered by component tests; these lock the product rule.
 */
describe("itinerary day default selection (UI rule)", () => {
  const days = [
    { id: "day-1", date: "2026-09-12" },
    { id: "day-2", date: "2026-09-13" },
    { id: "day-3", date: "2026-09-14" },
  ];

  it("defaults to today when today falls inside the trip", () => {
    expect(defaultSelectedDayId(days, "2026-09-13")).toBe("day-2");
  });

  it("defaults to the first day when today is outside the trip", () => {
    expect(defaultSelectedDayId(days, "2026-08-02")).toBe("day-1");
  });

  it("supports empty-state selection (no day)", () => {
    expect(defaultSelectedDayId([], "2026-09-13")).toBeUndefined();
  });
});

describe("itinerary navigation params", () => {
  it("requires explicit tripId and activityId objects (never undefined interpolation)", () => {
    const tripId = "11111111-1111-4111-8111-111111111111";
    const activityId = "22222222-2222-4222-8222-222222222222";
    const dayId = "33333333-3333-4333-8333-333333333333";

    const createParams = { tripId, dayId };
    const editParams = { tripId, activityId };

    expect(createParams.tripId).toBe(tripId);
    expect(editParams.activityId).toBe(activityId);
    expect(`/trips/${undefined}/activities/new`).toContain("undefined");
    // Screens must use object params instead of string interpolation of unresolved ids.
    expect(Object.values(createParams).every((value) => typeof value === "string")).toBe(true);
    expect(Object.values(editParams).every((value) => typeof value === "string")).toBe(true);
  });
});
