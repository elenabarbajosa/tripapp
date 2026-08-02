import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";

import {
  ideaKeys,
  useCreateTripIdeaMutation,
  useDeleteTripIdeaMutation,
  useIdeasRealtime,
  usePromoteTripIdeaMutation,
  useTripIdeaQuery,
  useTripIdeasQuery,
  useUnvoteIdeaMutation,
  useUpdateTripIdeaMutation,
  useVoteForIdeaMutation,
} from "@/features/ideas/hooks";
import { itineraryKeys } from "@/features/itinerary/hooks";
import type { TripIdea } from "@/types/models";

const tripId = "11111111-1111-4111-8111-111111111111";
const ideaId = "22222222-2222-4222-8222-222222222222";
const userId = "33333333-3333-4333-8333-333333333333";
const dayId = "44444444-4444-4444-8444-444444444444";

function mockMakeIdea(overrides: Partial<TripIdea> = {}): TripIdea {
  return {
    id: ideaId,
    tripId,
    destinationId: null,
    createdBy: userId,
    title: "Night market",
    description: null,
    category: "food",
    status: "proposed",
    locationName: null,
    address: null,
    geoapifyPlaceId: null,
    latitude: null,
    longitude: null,
    promotedActivityId: null,
    voteCount: 0,
    userHasVoted: false,
    createdAt: "2026-08-01T10:00:00Z",
    updatedAt: "2026-08-01T10:00:00Z",
    ...overrides,
  };
}

jest.mock("@/features/ideas/api", () => ({
  getTripIdeas: jest.fn(async () => []),
  getTripIdeaById: jest.fn(async () => mockMakeIdea()),
  createTripIdea: jest.fn(),
  updateTripIdea: jest.fn(),
  deleteTripIdea: jest.fn(async () => undefined),
  archiveTripIdea: jest.fn(async () => undefined),
  voteForIdea: jest.fn(async () => undefined),
  unvoteIdea: jest.fn(async () => undefined),
  promoteTripIdeaToActivity: jest.fn(async () => "activity-1"),
}));

interface MockChannel {
  on: jest.Mock<MockChannel, unknown[]>;
  subscribe: jest.Mock<MockChannel, unknown[]>;
}

const mockChannel: MockChannel = {
  on: jest.fn(() => mockChannel),
  subscribe: jest.fn(() => mockChannel),
};
const mockRemoveChannel = jest.fn();
const mockChannelFactory = jest.fn((..._args: unknown[]) => mockChannel);

jest.mock("@/services/supabase", () => ({
  requireSupabaseClient: () => ({
    channel: (...args: unknown[]) => mockChannelFactory(...args),
    removeChannel: (...args: unknown[]) => mockRemoveChannel(...args),
  }),
}));

const api = jest.requireMock("@/features/ideas/api") as {
  getTripIdeas: jest.Mock;
  getTripIdeaById: jest.Mock;
  createTripIdea: jest.Mock;
  updateTripIdea: jest.Mock;
  deleteTripIdea: jest.Mock;
  archiveTripIdea: jest.Mock;
  voteForIdea: jest.Mock;
  unvoteIdea: jest.Mock;
  promoteTripIdeaToActivity: jest.Mock;
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return { Wrapper, queryClient };
}

describe("ideas hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.createTripIdea.mockImplementation(async (input: { tripId: string }) =>
      mockMakeIdea({ tripId: input.tripId }),
    );
    api.updateTripIdea.mockImplementation(async (input: { tripId: string; ideaId: string }) =>
      mockMakeIdea({ tripId: input.tripId, id: input.ideaId }),
    );
    api.getTripIdeaById.mockImplementation(async () => mockMakeIdea());
  });

  it("disables the ideas query without a valid tripId", () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useTripIdeasQuery("undefined", userId, true), {
      wrapper: Wrapper,
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(api.getTripIdeas).not.toHaveBeenCalled();
  });

  it("disables idea detail without a valid ideaId", () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useTripIdeaQuery(tripId, "bad", userId, true), {
      wrapper: Wrapper,
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(api.getTripIdeaById).not.toHaveBeenCalled();
  });

  it("invalidates idea queries after create", async () => {
    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateTripIdeaMutation(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({ tripId, title: "Night market", category: "food" });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: [...ideaKeys.all, tripId],
      });
    });
  });

  it("invalidates idea queries after update", async () => {
    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateTripIdeaMutation(userId), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        tripId,
        ideaId,
        title: "Updated",
        category: "food",
      });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: [...ideaKeys.all, tripId] });
    });
  });

  it("invalidates ideas after delete", async () => {
    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useDeleteTripIdeaMutation(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({ tripId, ideaId });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: [...ideaKeys.all, tripId] });
    });
  });

  it("invalidates ideas after voting and unvoting", async () => {
    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result: vote } = renderHook(() => useVoteForIdeaMutation(), { wrapper: Wrapper });
    await act(async () => {
      await vote.current.mutateAsync({ tripId, ideaId });
    });

    const { result: unvote } = renderHook(() => useUnvoteIdeaMutation(), { wrapper: Wrapper });
    await act(async () => {
      await unvote.current.mutateAsync({ tripId, ideaId });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: [...ideaKeys.all, tripId] });
    });
  });

  it("invalidates ideas and itinerary after promoting", async () => {
    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => usePromoteTripIdeaMutation(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        tripId,
        ideaId,
        tripDayId: dayId,
        isAllDay: true,
      });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: [...ideaKeys.all, tripId] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: itineraryKeys.trip(tripId) });
    });
  });

  it("subscribes to trip_ideas and trip_idea_votes changes when enabled", () => {
    const { Wrapper } = createWrapper();
    const { unmount } = renderHook(() => useIdeasRealtime(tripId, true), { wrapper: Wrapper });

    expect(mockChannelFactory).toHaveBeenCalledWith(`ideas:${tripId}`);
    expect(mockChannel.on).toHaveBeenCalledTimes(2);
    expect(mockChannel.subscribe).toHaveBeenCalled();

    unmount();
    expect(mockRemoveChannel).toHaveBeenCalled();
  });

  it("does not subscribe when disabled or the tripId is invalid", () => {
    const { Wrapper } = createWrapper();
    renderHook(() => useIdeasRealtime("bad", true), { wrapper: Wrapper });
    renderHook(() => useIdeasRealtime(tripId, false), { wrapper: Wrapper });
    expect(mockChannelFactory).not.toHaveBeenCalled();
  });
});
