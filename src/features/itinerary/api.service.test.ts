import { mapItineraryError } from "@/features/itinerary/errors";
import {
  createTripActivity,
  getTripDaysWithActivities,
  reorderTripActivities,
} from "@/features/itinerary/api";

const tripId = "11111111-1111-4111-8111-111111111111";
const dayId = "22222222-2222-4222-8222-222222222222";
const activityId = "33333333-3333-4333-8333-333333333333";
const destinationId = "44444444-4444-4444-8444-444444444444";
const userId = "55555555-5555-4555-8555-555555555555";

const mockFrom = jest.fn();
const mockRpc = jest.fn();
const mockGetUser = jest.fn();

jest.mock("@/services/supabase", () => ({
  requireSupabaseClient: () => ({
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
    auth: {
      getUser: (...args: unknown[]) => mockGetUser(...args),
    },
  }),
}));

function chain(result: { data?: unknown; error?: unknown | null }) {
  const builder: Record<string, unknown> = {};
  const methods = [
    "select",
    "eq",
    "order",
    "limit",
    "insert",
    "update",
    "delete",
    "single",
    "maybeSingle",
  ];
  for (const method of methods) {
    builder[method] = jest.fn(() => builder);
  }
  const promise = Promise.resolve(result);
  builder.then = promise.then.bind(promise);
  builder.catch = promise.catch.bind(promise);
  builder.finally = promise.finally.bind(promise);
  return builder;
}

describe("itinerary api service behavior", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("maps successful day+activity loads", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "trip_days") {
        return chain({
          data: [
            {
              id: dayId,
              trip_id: tripId,
              date: "2026-09-12",
              label: null,
              destination_id: destinationId,
              created_at: "2026-08-01T00:00:00Z",
              updated_at: "2026-08-01T00:00:00Z",
              trip_destinations: { city: "Lisbon" },
            },
          ],
          error: null,
        });
      }
      return chain({
        data: [
          {
            id: activityId,
            trip_id: tripId,
            trip_day_id: dayId,
            destination_id: destinationId,
            created_by: userId,
            title: "Miradouro",
            description: null,
            category: "sightseeing",
            is_all_day: false,
            start_time: "09:30:00",
            end_time: null,
            location_name: "Viewpoint",
            address: null,
            geoapify_place_id: null,
            latitude: null,
            longitude: null,
            notes: null,
            position: 0,
            created_at: "2026-08-01T00:00:00Z",
            updated_at: "2026-08-01T00:00:00Z",
            trip_destinations: { city: "Lisbon" },
          },
        ],
        error: null,
      });
    });

    const days = await getTripDaysWithActivities(tripId);
    expect(days).toHaveLength(1);
    expect(days[0]?.activities[0]?.title).toBe("Miradouro");
    expect(days[0]?.activities[0]?.startTime).toBe("09:30");
    expect(days[0]?.destinationCity).toBe("Lisbon");
  });

  it("maps trip-day ownership failures from insert", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });

    let activityCalls = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table !== "trip_activities") {
        return chain({ data: null, error: null });
      }
      activityCalls += 1;
      if (activityCalls === 1) {
        return chain({ data: [], error: null });
      }
      return chain({
        data: null,
        error: {
          code: "42501",
          message: "Trip day does not belong to this trip",
          details: "",
          hint: "",
        },
      });
    });

    await expect(
      createTripActivity({
        tripId,
        tripDayId: dayId,
        title: "Walk",
        category: "activity",
        isAllDay: true,
      }),
    ).rejects.toThrow("That day does not belong to this trip.");
  });

  it("maps destination ownership / foreign-key failures", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });

    let activityCalls = 0;
    mockFrom.mockImplementation(() => {
      activityCalls += 1;
      if (activityCalls === 1) {
        return chain({ data: [], error: null });
      }
      return chain({
        data: null,
        error: {
          code: "23503",
          message: "insert or update on table violates foreign key constraint",
          details: "destination_id",
          hint: "",
        },
      });
    });

    await expect(
      createTripActivity({
        tripId,
        tripDayId: dayId,
        destinationId,
        title: "Dinner",
        category: "food",
        isAllDay: false,
        startTime: "19:00",
      }),
    ).rejects.toThrow("That day or destination is no longer available on this trip.");
  });

  it("maps reorder rejecting unrelated activity ids", async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: {
        message: "One or more activities do not belong to this trip day",
        code: "P0001",
        details: "",
        hint: "",
      },
    });

    await expect(
      reorderTripActivities({
        tripId,
        tripDayId: dayId,
        activityIds: [activityId],
      }),
    ).rejects.toThrow("One or more activities do not belong to this day.");
  });

  it("maps viewer write denials", () => {
    expect(
      mapItineraryError({
        code: "42501",
        message: "permission denied for table trip_activities",
      }).message,
    ).toBe("You do not have permission to change this itinerary.");
  });

  it("maps unrelated user access as permission denial", async () => {
    mockFrom.mockImplementation(() =>
      chain({
        data: null,
        error: {
          code: "42501",
          message: "permission denied",
          details: "",
          hint: "",
        },
      }),
    );

    await expect(getTripDaysWithActivities(tripId)).rejects.toThrow(
      "You do not have permission to change this itinerary.",
    );
  });
});
