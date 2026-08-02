import {
  assertGeocodeDestinationId,
  clearGeocodeInflightForTests,
  geocodeTripDestination,
} from "@/features/tripMap/geocode";

jest.mock("@/services/supabase", () => ({
  requireSupabaseClient: jest.fn(),
}));

const { requireSupabaseClient } = jest.requireMock("@/services/supabase") as {
  requireSupabaseClient: jest.Mock;
};

describe("destination geocode client", () => {
  beforeEach(() => {
    clearGeocodeInflightForTests();
    requireSupabaseClient.mockReset();
  });

  it("rejects invalid and undefined destination ids", async () => {
    expect(() => assertGeocodeDestinationId("undefined")).toThrow(/destination id/i);
    await expect(geocodeTripDestination("undefined")).resolves.toBeNull();
    await expect(geocodeTripDestination("")).resolves.toBeNull();
    expect(requireSupabaseClient).not.toHaveBeenCalled();
  });

  it("deduplicates concurrent requests for the same destination", async () => {
    let resolveInvoke: (value: unknown) => void = () => undefined;
    const invokePromise = new Promise((resolve) => {
      resolveInvoke = resolve;
    });
    const invoke = jest.fn(() => invokePromise);
    requireSupabaseClient.mockReturnValue({
      functions: { invoke },
    });

    const destinationId = "11111111-1111-4111-8111-111111111111";
    const first = geocodeTripDestination(destinationId);
    const second = geocodeTripDestination(destinationId);
    expect(invoke).toHaveBeenCalledTimes(1);

    resolveInvoke({
      data: {
        cached: true,
        location: {
          destinationId,
          tripId: "22222222-2222-4222-8222-222222222222",
          city: "Lisbon",
          country: "Portugal",
          countryCode: "PT",
          displayOrder: 1,
          latitude: 38.7,
          longitude: -9.1,
          geoapifyPlaceId: "place.1",
          geocodedAt: "2026-08-01T10:00:00.000Z",
        },
      },
      error: null,
    });

    const [a, b] = await Promise.all([first, second]);
    expect(a?.latitude).toBe(38.7);
    expect(b?.latitude).toBe(38.7);
  });

  it("returns null when the provider payload is invalid", async () => {
    requireSupabaseClient.mockReturnValue({
      functions: {
        invoke: jest.fn(async () => ({
          data: { location: { latitude: 999, longitude: 0 } },
          error: null,
        })),
      },
    });
    await expect(
      geocodeTripDestination("11111111-1111-4111-8111-111111111111"),
    ).resolves.toBeNull();
  });
});
