import {
  boundsFromPoints,
  centerFromPoints,
  CITY_LEVEL_ZOOM,
} from "@/features/tripMap/camera";
import {
  DEFAULT_MAP_FILTER_STATE,
  filterMapPoints,
  isTypeVisible,
  toggleTypeFilter,
} from "@/features/tripMap/filters";
import {
  buildRoutePoints,
  isMappedPoint,
  isValidMapCoordinate,
  mapActivityPoint,
  mapBookingPoint,
  mapDestinationPoint,
  mapIdeaPoint,
} from "@/features/tripMap/mappers";
import type { TripMapPoint } from "@/features/tripMap/types";
import type {
  TripActivity,
  TripBooking,
  TripDestination,
  TripIdea,
} from "@/types/models";

const tripId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function destination(partial: Partial<TripDestination> & Pick<TripDestination, "id" | "city">): TripDestination {
  return {
    country: "Portugal",
    countryCode: "PT",
    currencyCode: "EUR",
    arrivalDate: "2026-08-01",
    departureDate: "2026-08-05",
    latitude: 38.7223,
    longitude: -9.1393,
    geoapifyPlaceId: null,
    geocodedAt: null,
    displayOrder: 1,
    ...partial,
  };
}

function activity(partial: Partial<TripActivity> & Pick<TripActivity, "id" | "title">): TripActivity {
  return {
    tripId,
    tripDayId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    destinationId: null,
    createdBy: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    description: null,
    category: "sightseeing",
    isAllDay: true,
    startTime: null,
    endTime: null,
    locationName: "Tower",
    address: "Lisbon",
    geoapifyPlaceId: "place.1",
    latitude: 38.6916,
    longitude: -9.216,
    notes: null,
    position: 0,
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-01T10:00:00.000Z",
    ...partial,
  };
}

function booking(partial: Partial<TripBooking> & Pick<TripBooking, "id" | "title">): TripBooking {
  return {
    tripId,
    createdBy: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    bookingType: "accommodation",
    providerName: "Hotel",
    confirmationNumber: null,
    bookingReference: null,
    status: null,
    startDate: "2026-08-02",
    startTime: null,
    endDate: "2026-08-04",
    endTime: null,
    locationName: "Hotel",
    address: "Chiado",
    geoapifyPlaceId: "place.2",
    latitude: 38.71,
    longitude: -9.14,
    departureLocation: null,
    arrivalLocation: null,
    carrierName: null,
    transportNumber: null,
    terminal: null,
    gate: null,
    checkInTime: null,
    checkOutTime: null,
    notes: null,
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-01T10:00:00.000Z",
    ...partial,
  };
}

function idea(partial: Partial<TripIdea> & Pick<TripIdea, "id" | "title">): TripIdea {
  return {
    tripId,
    destinationId: null,
    createdBy: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    description: null,
    category: "food",
    status: "proposed",
    locationName: "Pastelaria",
    address: "Belem",
    geoapifyPlaceId: "place.3",
    latitude: 38.697,
    longitude: -9.203,
    promotedActivityId: null,
    voteCount: 0,
    userHasVoted: false,
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-01T10:00:00.000Z",
    ...partial,
  };
}

describe("trip map mappers", () => {
  it("maps a valid destination point with stop number", () => {
    const mapped = mapDestinationPoint(
      destination({ id: "11111111-1111-4111-8111-111111111111", city: "Lisbon" }),
      tripId,
      1,
    );
    expect(isMappedPoint(mapped)).toBe(true);
    if (isMappedPoint(mapped)) {
      expect(mapped.type).toBe("destination");
      expect(mapped.stopNumber).toBe(1);
      expect(mapped.latitude).toBeCloseTo(38.7223);
    }
  });

  it("maps activity, booking, and idea points", () => {
    expect(isMappedPoint(mapActivityPoint(activity({ id: "11111111-1111-4111-8111-111111111111", title: "Tower" }), tripId))).toBe(true);
    expect(isMappedPoint(mapBookingPoint(booking({ id: "22222222-2222-4222-8222-222222222222", title: "Hotel" }), tripId))).toBe(true);
    expect(isMappedPoint(mapIdeaPoint(idea({ id: "33333333-3333-4333-8333-333333333333", title: "Pastry" }), tripId))).toBe(true);
  });

  it("discards invalid and missing coordinates", () => {
    expect(isValidMapCoordinate(91, 0)).toBe(false);
    expect(isValidMapCoordinate(0, 181)).toBe(false);
    expect(isValidMapCoordinate(null, null)).toBe(false);
    const missing = mapDestinationPoint(
      destination({
        id: "11111111-1111-4111-8111-111111111111",
        city: "Porto",
        latitude: null,
        longitude: null,
      }),
      tripId,
      1,
    );
    expect(isMappedPoint(missing)).toBe(false);
    if (!isMappedPoint(missing)) {
      expect(missing.reason).toBe("missing_coordinates");
    }
  });

  it("preserves destination and route ordering by displayOrder", () => {
    const destinations = [
      destination({
        id: "22222222-2222-4222-8222-222222222222",
        city: "Porto",
        displayOrder: 2,
        latitude: 41.15,
        longitude: -8.61,
      }),
      destination({
        id: "11111111-1111-4111-8111-111111111111",
        city: "Lisbon",
        displayOrder: 1,
      }),
    ];
    const route = buildRoutePoints(destinations, tripId);
    expect(route.map((point) => point.title)).toEqual(["Lisbon", "Porto"]);
    expect(route.map((point) => point.stopNumber)).toEqual([1, 2]);
  });
});

describe("trip map filters and camera", () => {
  const dayId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  const points: TripMapPoint[] = [
    {
      id: "destination:1",
      entityId: "11111111-1111-4111-8111-111111111111",
      tripId,
      type: "destination",
      title: "Lisbon",
      subtitle: "Portugal",
      latitude: 38.7,
      longitude: -9.1,
      category: "destination",
      date: "2026-08-01",
      tripDayId: null,
      destinationId: "11111111-1111-4111-8111-111111111111",
      address: "Lisbon",
      stopNumber: 1,
    },
    {
      id: "activity:1",
      entityId: "22222222-2222-4222-8222-222222222222",
      tripId,
      type: "activity",
      title: "Tower",
      subtitle: null,
      latitude: 38.69,
      longitude: -9.21,
      category: "sightseeing",
      date: null,
      tripDayId: dayId,
      destinationId: null,
      address: null,
      stopNumber: null,
    },
    {
      id: "booking:1",
      entityId: "33333333-3333-4333-8333-333333333333",
      tripId,
      type: "booking",
      title: "Hotel",
      subtitle: null,
      latitude: 38.71,
      longitude: -9.14,
      category: "accommodation",
      date: "2026-08-02",
      tripDayId: null,
      destinationId: null,
      address: null,
      stopNumber: null,
    },
    {
      id: "idea:1",
      entityId: "44444444-4444-4444-8444-444444444444",
      tripId,
      type: "idea",
      title: "Pastry",
      subtitle: null,
      latitude: 38.69,
      longitude: -9.2,
      category: "food",
      date: null,
      tripDayId: null,
      destinationId: null,
      address: null,
      stopNumber: null,
    },
  ];

  it("treats empty type set as all types", () => {
    expect(isTypeVisible(new Set(), "idea")).toBe(true);
    const only = toggleTypeFilter(new Set(), "activity");
    expect(isTypeVisible(only, "activity")).toBe(true);
    expect(isTypeVisible(only, "idea")).toBe(false);
  });

  it("keeps destinations visible on a day filter and hides ideas unless enabled", () => {
    const days = [{ id: dayId, date: "2026-08-02", label: null }];
    const filtered = filterMapPoints(
      points,
      { ...DEFAULT_MAP_FILTER_STATE, dayId, includeIdeasOnDay: false },
      days,
      new Map([
        [
          "33333333-3333-4333-8333-333333333333",
          { start: "2026-08-02", end: "2026-08-04" },
        ],
      ]),
    );
    expect(filtered.some((point) => point.type === "destination")).toBe(true);
    expect(filtered.some((point) => point.type === "booking")).toBe(true);
    expect(filtered.some((point) => point.type === "idea")).toBe(false);
  });

  it("filters activities by trip day id", () => {
    const days = [{ id: dayId, date: "2026-08-01", label: null }];
    const filtered = filterMapPoints(
      points,
      { ...DEFAULT_MAP_FILTER_STATE, dayId },
      days,
    );
    expect(filtered.some((point) => point.type === "activity")).toBe(true);
  });

  it("computes one-point center and multi-point bounds", () => {
    const one = centerFromPoints([points[0]!]);
    expect(one).toEqual([points[0]!.longitude, points[0]!.latitude]);
    expect(CITY_LEVEL_ZOOM).toBeGreaterThan(8);
    const bounds = boundsFromPoints(points);
    expect(bounds).not.toBeNull();
    if (bounds) {
      expect(bounds[0]).toBeLessThanOrEqual(bounds[2]);
      expect(bounds[1]).toBeLessThanOrEqual(bounds[3]);
    }
  });
});
