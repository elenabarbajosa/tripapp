import {
  createTripIdea,
  deleteTripIdea,
  getTripIdeaById,
  getTripIdeas,
  promoteTripIdeaToActivity,
  unvoteIdea,
  updateTripIdea,
  voteForIdea,
} from "@/features/ideas/api";

const tripId = "11111111-1111-4111-8111-111111111111";
const ideaId = "22222222-2222-4222-8222-222222222222";

describe("ideas api uuid guards", () => {
  it("rejects invalid trip ids before querying ideas", async () => {
    await expect(getTripIdeas("undefined", undefined)).rejects.toThrow("Trip id is required.");
    await expect(getTripIdeas("", undefined)).rejects.toThrow("Trip id is required.");
    await expect(getTripIdeas("not-a-uuid", undefined)).rejects.toThrow("Trip id is required.");
  });

  it("rejects invalid idea ids before querying", async () => {
    await expect(getTripIdeaById(tripId, "bad", undefined)).rejects.toThrow(
      "Idea id is required.",
    );
  });

  it("rejects invalid trip id on create", async () => {
    await expect(
      createTripIdea({ tripId: "bad", title: "Night market", category: "food" }),
    ).rejects.toThrow("Trip id is required.");
  });

  it("rejects an invalid destination id on create", async () => {
    await expect(
      createTripIdea({
        tripId,
        title: "Night market",
        category: "food",
        destinationId: "bad",
      }),
    ).rejects.toThrow("Destination id is required.");
  });

  it("rejects invalid ids on update and delete", async () => {
    await expect(
      updateTripIdea(
        { tripId, ideaId: "bad", title: "Updated", category: "food" },
        undefined,
      ),
    ).rejects.toThrow("Idea id is required.");

    await expect(deleteTripIdea({ tripId, ideaId: "bad" })).rejects.toThrow(
      "Idea id is required.",
    );
  });

  it("rejects invalid ids for voting", async () => {
    await expect(voteForIdea({ tripId, ideaId: "bad" })).rejects.toThrow(
      "Idea id is required.",
    );
    await expect(unvoteIdea({ tripId, ideaId: "bad" })).rejects.toThrow(
      "Idea id is required.",
    );
  });

  it("rejects invalid ids for promotion", async () => {
    await expect(
      promoteTripIdeaToActivity({
        tripId,
        ideaId: "bad",
        tripDayId: tripId,
        isAllDay: true,
      }),
    ).rejects.toThrow("Idea id is required.");

    await expect(
      promoteTripIdeaToActivity({
        tripId,
        ideaId,
        tripDayId: "bad",
        isAllDay: true,
      }),
    ).rejects.toThrow("Trip day id is required.");
  });
});
