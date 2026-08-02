import { mapIdeaRow } from "@/features/ideas/mappers";
import type { TripIdeaRowWithVotes } from "@/features/ideas/mappers";

function row(overrides: Partial<TripIdeaRowWithVotes> = {}): TripIdeaRowWithVotes {
  return {
    id: "row-1",
    trip_id: "trip-1",
    destination_id: null,
    created_by: "user-1",
    title: "Night market",
    description: null,
    category: "food",
    status: "proposed",
    location_name: null,
    address: null,
    geoapify_place_id: null,
    latitude: null,
    longitude: null,
    promoted_activity_id: null,
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
    trip_idea_votes: [],
    ...overrides,
  };
}

describe("idea mappers", () => {
  it("maps an idea row to a domain idea", () => {
    const mapped = mapIdeaRow(row(), "user-1");
    expect(mapped.id).toBe("row-1");
    expect(mapped.category).toBe("food");
    expect(mapped.status).toBe("proposed");
    expect(mapped.voteCount).toBe(0);
    expect(mapped.userHasVoted).toBe(false);
  });

  it("counts votes and detects the current user's vote", () => {
    const mapped = mapIdeaRow(
      row({
        trip_idea_votes: [{ user_id: "user-1" }, { user_id: "user-2" }],
      }),
      "user-1",
    );
    expect(mapped.voteCount).toBe(2);
    expect(mapped.userHasVoted).toBe(true);
  });

  it("reports userHasVoted false when the current user has not voted", () => {
    const mapped = mapIdeaRow(
      row({ trip_idea_votes: [{ user_id: "user-2" }] }),
      "user-1",
    );
    expect(mapped.userHasVoted).toBe(false);
  });

  it("defaults votes to an empty array when null", () => {
    const mapped = mapIdeaRow(row({ trip_idea_votes: null }), "user-1");
    expect(mapped.voteCount).toBe(0);
  });

  it("handles a missing current user id", () => {
    const mapped = mapIdeaRow(
      row({ trip_idea_votes: [{ user_id: "user-1" }] }),
      undefined,
    );
    expect(mapped.userHasVoted).toBe(false);
  });
});
