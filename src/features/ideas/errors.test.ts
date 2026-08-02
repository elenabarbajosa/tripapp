import { getIdeaErrorDebug, mapIdeaError } from "@/features/ideas/errors";

describe("mapIdeaError", () => {
  it("maps auth failures to a sign-in prompt", () => {
    expect(mapIdeaError({ message: "Not authenticated" }).message).toBe(
      "Sign in to view ideas.",
    );
    expect(mapIdeaError({ code: "PGRST301", message: "" }).message).toBe(
      "Sign in to view ideas.",
    );
  });

  it("maps permission errors", () => {
    expect(
      mapIdeaError({ code: "42501", message: "permission denied for table trip_ideas" }).message,
    ).toBe("You do not have permission to change this idea.");
  });

  it("maps check constraint violations", () => {
    expect(
      mapIdeaError({
        code: "23514",
        message: 'violates check constraint "trip_ideas_title_length"',
      }).message,
    ).toBe("Enter a valid idea title.");
    expect(
      mapIdeaError({
        code: "23514",
        message: 'violates check constraint "trip_ideas_description_length"',
      }).message,
    ).toBe("Description must be 2000 characters or fewer.");
    expect(
      mapIdeaError({
        code: "23514",
        message: 'violates check constraint "trip_ideas_lat_lng_pair"',
      }).message,
    ).toBe("Selected location is invalid. Try searching again.");
  });

  it("maps foreign key violations", () => {
    expect(
      mapIdeaError({ code: "23503", message: "violates foreign key constraint" }).message,
    ).toBe("That trip is no longer available.");
  });

  it("maps duplicate vote violations", () => {
    expect(
      mapIdeaError({ code: "23505", message: "duplicate key value violates unique constraint" })
        .message,
    ).toBe("You have already voted for this idea.");
  });

  it("maps missing rows", () => {
    expect(mapIdeaError({ code: "PGRST116", message: "contains 0 rows" }).message).toBe(
      "Idea not found.",
    );
  });

  it("passes through short custom RPC exception messages", () => {
    expect(
      mapIdeaError({ message: "Only owners and editors can add ideas to the itinerary" }).message,
    ).toBe("Only owners and editors can add ideas to the itinerary");
    expect(mapIdeaError({ message: "Archived ideas cannot be promoted" }).message).toBe(
      "Archived ideas cannot be promoted",
    );
    expect(
      mapIdeaError({ message: "Idea has already been added to the itinerary" }).message,
    ).toBe("Idea has already been added to the itinerary");
  });

  it("falls back to a generic message for unknown errors", () => {
    expect(mapIdeaError(null).message).toBe("Unable to load ideas. Please try again.");
    expect(mapIdeaError("oops").message).toBe("Unable to load ideas. Please try again.");
  });

  it("extracts debug info without leaking when absent", () => {
    expect(getIdeaErrorDebug(null)).toBeNull();
    expect(getIdeaErrorDebug({ message: "boom", code: "500" })).toEqual({
      message: "boom",
      code: "500",
      details: undefined,
      hint: undefined,
    });
  });
});
