import {
  mapActivityRow,
  mapDayRow,
  sortActivities,
  type TripActivityRowWithDestination,
} from "@/features/itinerary/mappers";
import type { TripActivity } from "@/types/models";

function activity(overrides: Partial<TripActivity>): TripActivity {
  return {
    id: "a1",
    tripId: "t1",
    tripDayId: "d1",
    destinationId: null,
    createdBy: "u1",
    title: "Activity",
    description: null,
    category: "activity",
    isAllDay: false,
    startTime: null,
    endTime: null,
    locationName: null,
    address: null,
    geoapifyPlaceId: null,
    latitude: null,
    longitude: null,
    notes: null,
    position: 0,
    createdAt: "2026-08-01T10:00:00Z",
    updatedAt: "2026-08-01T10:00:00Z",
    ...overrides,
  };
}

describe("itinerary mappers", () => {
  it("maps day and activity rows", () => {
    const day = mapDayRow({
      id: "day-1",
      trip_id: "trip-1",
      date: "2026-09-12",
      label: "Arrival",
      destination_id: "dest-1",
      created_at: "2026-08-01T00:00:00Z",
      updated_at: "2026-08-01T00:00:00Z",
      trip_destinations: { city: "Lisbon" },
    });
    expect(day.destinationCity).toBe("Lisbon");
    expect(day.date).toBe("2026-09-12");

    const row: TripActivityRowWithDestination = {
      id: "act-1",
      trip_id: "trip-1",
      trip_day_id: "day-1",
      destination_id: "dest-1",
      created_by: "user-1",
      title: "Miradouro",
      description: null,
      category: "sightseeing",
      is_all_day: false,
      start_time: "09:30:00",
      end_time: "10:00:00",
      location_name: "Viewpoint",
      address: null,
      geoapify_place_id: null,
      latitude: null,
      longitude: null,
      notes: null,
      position: 2,
      created_at: "2026-08-01T00:00:00Z",
      updated_at: "2026-08-01T00:00:00Z",
      trip_destinations: { city: "Lisbon" },
    };
    const mapped = mapActivityRow(row);
    expect(mapped.startTime).toBe("09:30");
    expect(mapped.endTime).toBe("10:00");
    expect(mapped.category).toBe("sightseeing");
    expect(mapped.destinationCity).toBe("Lisbon");
  });

  it("sorts by ORDERING RULE: all-day, start_time, position, created_at", () => {
    const sorted = sortActivities([
      activity({
        id: "timed-null",
        startTime: null,
        position: 0,
        createdAt: "2026-08-01T12:00:00Z",
      }),
      activity({
        id: "timed-late",
        startTime: "15:00",
        position: 0,
        createdAt: "2026-08-01T11:00:00Z",
      }),
      activity({
        id: "all-day-b",
        isAllDay: true,
        position: 1,
        createdAt: "2026-08-01T09:00:00Z",
      }),
      activity({
        id: "all-day-a",
        isAllDay: true,
        position: 0,
        createdAt: "2026-08-01T08:00:00Z",
      }),
      activity({
        id: "timed-early",
        startTime: "09:00",
        position: 1,
        createdAt: "2026-08-01T10:00:00Z",
      }),
      activity({
        id: "timed-early-pos0",
        startTime: "09:00",
        position: 0,
        createdAt: "2026-08-01T10:30:00Z",
      }),
    ]);

    expect(sorted.map((item) => item.id)).toEqual([
      "all-day-a",
      "all-day-b",
      "timed-early-pos0",
      "timed-early",
      "timed-late",
      "timed-null",
    ]);
  });
});
