import {
  filterIdeasByCategory,
  filterIdeasByStatus,
  rankActiveIdeas,
  rankIdeas,
} from "@/features/ideas/ranking";
import type { TripIdea } from "@/types/models";

function idea(overrides: Partial<TripIdea> = {}): TripIdea {
  return {
    id: "1",
    tripId: "t1",
    destinationId: null,
    createdBy: "u1",
    title: "Idea",
    description: null,
    category: "activity",
    status: "proposed",
    locationName: null,
    address: null,
    geoapifyPlaceId: null,
    latitude: null,
    longitude: null,
    promotedActivityId: null,
    voteCount: 0,
    userHasVoted: false,
    createdAt: "2026-08-01T00:00:00Z",
    updatedAt: "2026-08-01T00:00:00Z",
    ...overrides,
  };
}

describe("idea ranking", () => {
  it("ranks by vote count descending", () => {
    const ranked = rankIdeas([
      idea({ id: "a", voteCount: 1 }),
      idea({ id: "b", voteCount: 3 }),
      idea({ id: "c", voteCount: 2 }),
    ]);
    expect(ranked.map((i) => i.id)).toEqual(["b", "c", "a"]);
  });

  it("breaks ties by created_at ascending", () => {
    const ranked = rankIdeas([
      idea({ id: "newer", voteCount: 2, createdAt: "2026-08-02T00:00:00Z" }),
      idea({ id: "older", voteCount: 2, createdAt: "2026-08-01T00:00:00Z" }),
    ]);
    expect(ranked.map((i) => i.id)).toEqual(["older", "newer"]);
  });

  it("filters by status", () => {
    const ideas = [
      idea({ id: "a", status: "proposed" }),
      idea({ id: "b", status: "archived" }),
      idea({ id: "c", status: "added_to_itinerary" }),
    ];
    expect(filterIdeasByStatus(ideas, "proposed").map((i) => i.id)).toEqual(["a"]);
    expect(filterIdeasByStatus(ideas, "all")).toHaveLength(3);
  });

  it("filters by category", () => {
    const ideas = [
      idea({ id: "a", category: "food" }),
      idea({ id: "b", category: "activity" }),
    ];
    expect(filterIdeasByCategory(ideas, "food").map((i) => i.id)).toEqual(["a"]);
    expect(filterIdeasByCategory(ideas, "all")).toHaveLength(2);
  });

  it("ranks only proposed ideas for the active leaderboard", () => {
    const ideas = [
      idea({ id: "a", status: "proposed", voteCount: 1 }),
      idea({ id: "b", status: "archived", voteCount: 5 }),
      idea({ id: "c", status: "proposed", voteCount: 3 }),
    ];
    expect(rankActiveIdeas(ideas).map((i) => i.id)).toEqual(["c", "a"]);
  });
});
