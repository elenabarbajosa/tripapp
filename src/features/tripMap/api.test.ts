import { isValidUuid } from "@/utils/routeParams";
import { getTripMapData } from "@/features/tripMap/api";

jest.mock("@/features/trips/api", () => ({
  getTripById: jest.fn(),
}));
jest.mock("@/features/itinerary/api", () => ({
  getTripDaysWithActivities: jest.fn(),
}));
jest.mock("@/features/bookings/api", () => ({
  getTripBookings: jest.fn(),
}));
jest.mock("@/features/ideas/api", () => ({
  getTripIdeas: jest.fn(),
}));
jest.mock("@/features/tripMap/geocode", () => ({
  ensureDestinationCoordinates: jest.fn(async (destinations: unknown[]) => ({
    destinations,
    geocodeFailedIds: [],
  })),
}));
jest.mock("@/services/supabase", () => ({
  requireSupabaseClient: jest.fn(() => ({
    auth: { getUser: jest.fn(async () => ({ data: { user: { id: "u" } } })) },
  })),
}));

describe("getTripMapData guards", () => {
  it("rejects invalid trip ids before contacting feature services", async () => {
    await expect(getTripMapData("undefined")).rejects.toThrow(/trip id/i);
    expect(isValidUuid("undefined")).toBe(false);
  });
});
