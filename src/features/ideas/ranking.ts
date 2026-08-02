import type { TripIdea, TripIdeaCategory, TripIdeaStatus } from "@/types/models";

export type IdeaStatusFilter = "all" | TripIdeaStatus;
export type IdeaCategoryFilter = "all" | TripIdeaCategory;

export type IdeaSortMode = "top" | "newest";

/**
 * ORDERING RULE (top): vote count descending, then created_at ascending
 * (earliest-proposed ideas win ties so a fresh idea must out-vote the queue).
 */
export function rankIdeas(ideas: TripIdea[]): TripIdea[] {
  return [...ideas].sort((a, b) => {
    if (a.voteCount !== b.voteCount) {
      return b.voteCount - a.voteCount;
    }
    if (a.createdAt !== b.createdAt) {
      return a.createdAt < b.createdAt ? -1 : 1;
    }
    return 0;
  });
}

/** Newest first by created_at, then vote count descending as a tie-breaker. */
export function sortIdeasNewest(ideas: TripIdea[]): TripIdea[] {
  return [...ideas].sort((a, b) => {
    if (a.createdAt !== b.createdAt) {
      return a.createdAt > b.createdAt ? -1 : 1;
    }
    if (a.voteCount !== b.voteCount) {
      return b.voteCount - a.voteCount;
    }
    return 0;
  });
}

export function sortIdeas(ideas: TripIdea[], mode: IdeaSortMode): TripIdea[] {
  return mode === "newest" ? sortIdeasNewest(ideas) : rankIdeas(ideas);
}

export function filterIdeasByStatus(
  ideas: TripIdea[],
  filter: IdeaStatusFilter,
): TripIdea[] {
  if (filter === "all") {
    return ideas;
  }
  return ideas.filter((idea) => idea.status === filter);
}

export function filterIdeasByCategory(
  ideas: TripIdea[],
  filter: IdeaCategoryFilter,
): TripIdea[] {
  if (filter === "all") {
    return ideas;
  }
  return ideas.filter((idea) => idea.category === filter);
}

/** Ranks proposed ideas by votes; keeps promoted/archived ideas out of the running list. */
export function rankActiveIdeas(ideas: TripIdea[]): TripIdea[] {
  return rankIdeas(filterIdeasByStatus(ideas, "proposed"));
}
