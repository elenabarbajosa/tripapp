import { mapIdeaError } from "@/features/ideas/errors";
import {
  createTripIdea,
  deleteTripIdea,
  getTripIdeas,
  promoteTripIdeaToActivity,
  updateTripIdea,
  voteForIdea,
} from "@/features/ideas/api";

const tripId = "11111111-1111-4111-8111-111111111111";
const ideaId = "22222222-2222-4222-8222-222222222222";
const userId = "33333333-3333-4333-8333-333333333333";
const dayId = "44444444-4444-4444-8444-444444444444";
const activityId = "55555555-5555-4555-8555-555555555555";

const mockFrom = jest.fn();
const mockRpc = jest.fn();
const mockGetUser = jest.fn();

jest.mock("@/services/supabase", () => ({
  requireSupabaseClient: () => ({
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
    auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
  }),
}));

function chain(result: { data?: unknown; error?: unknown | null }) {
  const builder: Record<string, unknown> = {};
  const methods = ["select", "eq", "insert", "update", "delete", "single", "maybeSingle"];
  for (const method of methods) {
    builder[method] = jest.fn(() => builder);
  }
  const promise = Promise.resolve(result);
  builder.then = promise.then.bind(promise);
  builder.catch = promise.catch.bind(promise);
  builder.finally = promise.finally.bind(promise);
  return builder;
}

function ideaRow(overrides: Record<string, unknown> = {}) {
  return {
    id: ideaId,
    trip_id: tripId,
    destination_id: null,
    created_by: userId,
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
    trip_idea_votes: [{ user_id: userId }],
    ...overrides,
  };
}

describe("ideas api service behavior", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: userId } }, error: null });
  });

  it("loads and maps trip ideas with vote counts", async () => {
    mockFrom.mockImplementation(() => chain({ data: [ideaRow()], error: null }));

    const ideas = await getTripIdeas(tripId, userId);
    expect(ideas).toHaveLength(1);
    expect(ideas[0]?.title).toBe("Night market");
    expect(ideas[0]?.voteCount).toBe(1);
    expect(ideas[0]?.userHasVoted).toBe(true);
  });

  it("creates an idea using the authenticated user as creator", async () => {
    mockFrom.mockImplementation(() => chain({ data: ideaRow(), error: null }));

    const created = await createTripIdea({
      tripId,
      title: "Night market",
      category: "food",
    });

    expect(mockGetUser).toHaveBeenCalled();
    expect(created.id).toBe(ideaId);
    expect(created.createdBy).toBe(userId);
  });

  it("rejects create when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(
      createTripIdea({ tripId, title: "Night market", category: "food" }),
    ).rejects.toThrow("Sign in to manage trip ideas.");
  });

  it("updates an idea", async () => {
    mockFrom.mockImplementation(() => chain({ data: ideaRow({ title: "Updated" }), error: null }));

    const updated = await updateTripIdea(
      { tripId, ideaId, title: "Updated", category: "food" },
      userId,
    );

    expect(updated.title).toBe("Updated");
  });

  it("deletes an idea", async () => {
    mockFrom.mockImplementation(() => chain({ data: null, error: null }));

    await deleteTripIdea({ tripId, ideaId });

    expect(mockFrom).toHaveBeenCalledWith("trip_ideas");
  });

  it("votes for an idea as the authenticated user", async () => {
    const insertMock = jest.fn(() => Promise.resolve({ error: null }));
    mockFrom.mockImplementation(() => ({ insert: insertMock }));

    await voteForIdea({ tripId, ideaId });

    expect(insertMock).toHaveBeenCalledWith({ idea_id: ideaId, user_id: userId });
  });

  it("maps permission denial from RPC errors", async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { code: "42501", message: "permission denied", details: "", hint: "" },
    });

    await expect(
      promoteTripIdeaToActivity({
        tripId,
        ideaId,
        tripDayId: dayId,
        isAllDay: true,
      }),
    ).rejects.toThrow("You do not have permission to change this idea.");
  });

  it("promotes an idea via RPC", async () => {
    mockRpc.mockResolvedValue({ data: activityId, error: null });

    const returnedActivityId = await promoteTripIdeaToActivity({
      tripId,
      ideaId,
      tripDayId: dayId,
      isAllDay: false,
      startTime: "09:00",
      endTime: "11:00",
      notes: "Bring cash",
    });

    expect(mockRpc).toHaveBeenCalledWith(
      "promote_trip_idea_to_activity",
      expect.objectContaining({
        p_idea_id: ideaId,
        p_trip_day_id: dayId,
        p_is_all_day: false,
        p_start_time: "09:00",
        p_end_time: "11:00",
        p_notes: "Bring cash",
      }),
    );
    expect(returnedActivityId).toBe(activityId);
  });

  it("maps unknown errors through mapIdeaError", () => {
    expect(mapIdeaError({ message: "custom failure" }).message).toBe("custom failure");
  });
});
