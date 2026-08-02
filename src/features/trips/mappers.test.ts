import { mapTripSummary, type TripWithRelations } from "@/features/trips/mappers";
import { partitionTrips } from "@/features/trips/api";
import type { TripSummary } from "@/types/models";

const sampleRow: TripWithRelations = {
  id: "trip-1",
  name: "Coastal Escape",
  cover_image_url: null,
  start_date: "2026-09-10",
  end_date: "2026-09-12",
  currency: "EUR",
  home_currency: "GBP",
  created_by: "user-1",
  created_at: "2026-08-01T00:00:00Z",
  updated_at: "2026-08-01T00:00:00Z",
  trip_destinations: [
    {
      id: "dest-1",
      trip_id: "trip-1",
      city: "Lisbon",
      country: "Portugal",
      arrival_date: "2026-09-10",
      departure_date: "2026-09-12",
      latitude: 38.7,
      longitude: -9.1,
      country_code: "PT",
      currency_code: "EUR",
      display_order: 1,
      created_at: "2026-08-01T00:00:00Z",
      updated_at: "2026-08-01T00:00:00Z",
    },
  ],
  trip_members: [
    {
      id: "member-1",
      trip_id: "trip-1",
      user_id: "user-1",
      role: "owner",
      status: "accepted",
      created_at: "2026-08-01T00:00:00Z",
      updated_at: "2026-08-01T00:00:00Z",
      profiles: {
        id: "user-1",
        display_name: "Alex",
        email: "alex@example.com",
        avatar_url: null,
        preferred_currency: "EUR",
        created_at: "2026-08-01T00:00:00Z",
        updated_at: "2026-08-01T00:00:00Z",
      },
    },
  ],
};

describe("trip mappers", () => {
  it("maps trip rows into TripSummary", () => {
    const trip = mapTripSummary(sampleRow, "2026-08-02");
    expect(trip.name).toBe("Coastal Escape");
    expect(trip.homeCurrency).toBe("GBP");
    expect(trip.phase).toBe("upcoming");
    expect(trip.destinations[0]?.city).toBe("Lisbon");
    expect(trip.destinations[0]?.currencyCode).toBe("EUR");
    expect(trip.destinations[0]?.countryCode).toBe("PT");
    expect(trip.members[0]?.role).toBe("owner");
    expect(trip.travellerCount).toBe(1);
  });
});

describe("partitionTrips", () => {
  it("splits upcoming/active from completed", () => {
    const trips: TripSummary[] = [
      {
        ...mapTripSummary(sampleRow, "2026-08-02"),
        phase: "upcoming",
      },
      {
        ...mapTripSummary(sampleRow, "2026-08-02"),
        id: "trip-2",
        phase: "completed",
      },
    ];

    const { upcoming, previous } = partitionTrips(trips);
    expect(upcoming).toHaveLength(1);
    expect(previous).toHaveLength(1);
  });
});
