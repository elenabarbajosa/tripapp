import { getPlaceSuggestions } from "@/features/places/api";
import { mapPlacesError } from "@/features/places/errors";
import { PlacesUserFacingError } from "@/features/places/types";

const mockInvoke = jest.fn();

jest.mock("@/services/supabase", () => ({
  requireSupabaseClient: () => ({
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  }),
}));

describe("places api", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("maps typed suggestions from the Edge Function", async () => {
    mockInvoke.mockResolvedValue({
      data: {
        configured: true,
        attribution: "Powered by Geoapify",
        suggestions: [
          {
            placeId: "p1",
            name: "Willis Tower",
            formattedAddress: "233 S Wacker Drive, Chicago",
            primaryText: "Willis Tower",
            secondaryText: "233 S Wacker Drive, Chicago",
            latitude: 41.8789,
            longitude: -87.6359,
            countryCode: "US",
            resultType: "amenity",
            category: null,
          },
        ],
      },
      error: null,
    });

    const suggestions = await getPlaceSuggestions({ query: "Willis" });
    expect(mockInvoke).toHaveBeenCalledWith("geoapify-autocomplete", {
      body: {
        query: "Willis",
        countryCode: undefined,
        language: undefined,
        limit: 5,
      },
    });
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]?.name).toBe("Willis Tower");
    expect(suggestions[0]?.latitude).toBe(41.8789);
  });

  it("returns no request for short queries", async () => {
    await expect(getPlaceSuggestions({ query: "ab" })).resolves.toEqual([]);
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it("maps provider errors to friendly messages", async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: { message: "Edge Function returned a non-2xx status code", context: { status: 502 } },
    });

    await expect(getPlaceSuggestions({ query: "Chicago" })).rejects.toBeInstanceOf(
      PlacesUserFacingError,
    );
    await expect(getPlaceSuggestions({ query: "Chicago" })).rejects.toThrow(
      /temporarily unavailable/i,
    );
  });

  it("maps not-configured responses", async () => {
    mockInvoke.mockResolvedValue({
      data: {
        configured: false,
        error: "Location search is not configured yet.",
        suggestions: [],
      },
      error: null,
    });

    await expect(getPlaceSuggestions({ query: "Chicago" })).rejects.toThrow(
      "Location search is not configured yet.",
    );
  });

  it("maps function-not-deployed fallbacks", () => {
    expect(
      mapPlacesError({ message: "Function not found", status: 404 }).message,
    ).toMatch(/temporarily unavailable/i);
  });
});
