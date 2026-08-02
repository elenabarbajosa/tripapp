import {
  createTripActivity,
  deleteTripActivity,
  getTripActivityById,
  getTripDaysWithActivities,
  reorderTripActivities,
  updateTripActivity,
} from "@/features/itinerary/api";

describe("itinerary api uuid guards", () => {
  it("rejects invalid trip ids before querying", async () => {
    await expect(getTripDaysWithActivities("undefined")).rejects.toThrow(
      "Trip id is required.",
    );
    await expect(getTripDaysWithActivities("")).rejects.toThrow("Trip id is required.");
    await expect(getTripDaysWithActivities("not-a-uuid")).rejects.toThrow(
      "Trip id is required.",
    );
  });

  it("rejects invalid activity ids before querying", async () => {
    const tripId = "11111111-1111-4111-8111-111111111111";
    await expect(getTripActivityById(tripId, "bad")).rejects.toThrow(
      "Activity id is required.",
    );
    await expect(
      updateTripActivity({ tripId, activityId: "null", title: "X" }),
    ).rejects.toThrow("Activity id is required.");
    await expect(
      deleteTripActivity({ tripId, activityId: "" }),
    ).rejects.toThrow("Activity id is required.");
  });

  it("rejects invalid ids for getTripActivities", async () => {
    const { getTripActivities } = await import("@/features/itinerary/api");
    await expect(getTripActivities("bad")).rejects.toThrow("Trip id is required.");
  });

  it("rejects invalid ids on create and reorder", async () => {
    await expect(
      createTripActivity({
        tripId: "bad",
        tripDayId: "11111111-1111-4111-8111-111111111111",
        title: "Walk",
        category: "activity",
        isAllDay: true,
      }),
    ).rejects.toThrow("Trip id is required.");

    await expect(
      reorderTripActivities({
        tripId: "11111111-1111-4111-8111-111111111111",
        tripDayId: "22222222-2222-4222-8222-222222222222",
        activityIds: ["not-valid"],
      }),
    ).rejects.toThrow("Activity id is required.");

    await expect(
      reorderTripActivities({
        tripId: "11111111-1111-4111-8111-111111111111",
        tripDayId: "22222222-2222-4222-8222-222222222222",
        activityIds: [],
      }),
    ).rejects.toThrow("Activity list is required.");
  });
});
