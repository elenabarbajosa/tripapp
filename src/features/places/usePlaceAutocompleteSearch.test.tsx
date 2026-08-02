import { act, renderHook, waitFor } from "@testing-library/react-native";

import {
  buildPlaceSearchCacheKey,
  clearPlaceSuggestionsCache,
  setCachedPlaceSuggestions,
} from "@/features/places/cache";
import { usePlaceAutocompleteSearch } from "@/features/places/usePlaceAutocompleteSearch";
import type { PlaceSuggestion } from "@/features/places/types";

const mockGetPlaceSuggestions = jest.fn();

jest.mock("@/features/places/api", () => ({
  getPlaceSuggestions: (...args: unknown[]) => mockGetPlaceSuggestions(...args),
}));

const sample: PlaceSuggestion = {
  placeId: "p1",
  name: "Chicago Riverwalk",
  formattedAddress: "Chicago Riverwalk, Chicago, IL",
  primaryText: "Chicago Riverwalk",
  secondaryText: "Chicago, IL",
  latitude: 41.888,
  longitude: -87.621,
  countryCode: "US",
  resultType: "street",
  category: null,
};

type HookProps = {
  query: string;
  countryCode?: string | null;
  language?: string | null;
  enabled?: boolean;
};

describe("usePlaceAutocompleteSearch", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    clearPlaceSuggestionsCache();
    mockGetPlaceSuggestions.mockResolvedValue([sample]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("does not request below three characters", async () => {
    renderHook(() => usePlaceAutocompleteSearch({ query: "Ch", enabled: true }));
    await act(async () => {
      jest.advanceTimersByTime(500);
    });
    expect(mockGetPlaceSuggestions).not.toHaveBeenCalled();
  });

  it("debounces requests by 400ms", async () => {
    const { rerender, result } = renderHook(
      (props: HookProps) =>
        usePlaceAutocompleteSearch({
          query: props.query,
          enabled: props.enabled ?? true,
        }),
      { initialProps: { query: "Chi" } satisfies HookProps },
    );

    await act(async () => {
      jest.advanceTimersByTime(399);
    });
    expect(mockGetPlaceSuggestions).not.toHaveBeenCalled();

    rerender({ query: "Chic" });
    await act(async () => {
      jest.advanceTimersByTime(400);
    });

    await waitFor(() => {
      expect(mockGetPlaceSuggestions).toHaveBeenCalledTimes(1);
    });
    expect(mockGetPlaceSuggestions).toHaveBeenCalledWith(
      expect.objectContaining({ query: "Chic" }),
    );
    await waitFor(() => {
      expect(result.current.suggestions[0]?.placeId).toBe("p1");
    });
  });

  it("does not repeat the same normalized query", async () => {
    const key = buildPlaceSearchCacheKey("chicago", "US", "en");
    setCachedPlaceSuggestions(key, [sample], "Powered by Geoapify");

    const { result } = renderHook(() =>
      usePlaceAutocompleteSearch({
        query: "Chicago",
        countryCode: "US",
        language: "en",
        enabled: true,
      }),
    );

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(mockGetPlaceSuggestions).not.toHaveBeenCalled();
    expect(result.current.suggestions).toHaveLength(1);
  });

  it("ignores stale responses when a newer query completes first", async () => {
    let resolveSlow: ((value: PlaceSuggestion[]) => void) | undefined;

    mockGetPlaceSuggestions.mockImplementation((input: { query: string }) => {
      if (input.query === "aaa") {
        return new Promise<PlaceSuggestion[]>((resolve) => {
          resolveSlow = resolve;
        });
      }
      return Promise.resolve([
        {
          ...sample,
          placeId: "p2",
          name: "Newer result",
          primaryText: "Newer result",
        },
      ]);
    });

    const { rerender, result } = renderHook(
      (props: HookProps) =>
        usePlaceAutocompleteSearch({
          query: props.query,
          enabled: true,
        }),
      { initialProps: { query: "aaa" } satisfies HookProps },
    );

    await act(async () => {
      jest.advanceTimersByTime(400);
    });

    rerender({ query: "bbbccc" });
    await act(async () => {
      jest.advanceTimersByTime(400);
    });

    await waitFor(() => {
      expect(result.current.suggestions[0]?.placeId).toBe("p2");
    });

    await act(async () => {
      resolveSlow?.([sample]);
    });

    expect(result.current.suggestions[0]?.placeId).toBe("p2");
  });

  it("limits displayed suggestions to five", async () => {
    mockGetPlaceSuggestions.mockResolvedValue(
      Array.from({ length: 8 }, (_, index) => ({
        ...sample,
        placeId: `p${index}`,
        name: `Place ${index}`,
        primaryText: `Place ${index}`,
      })),
    );

    const { result } = renderHook(() =>
      usePlaceAutocompleteSearch({ query: "place", enabled: true }),
    );

    await act(async () => {
      jest.advanceTimersByTime(400);
    });

    await waitFor(() => {
      expect(result.current.suggestions).toHaveLength(5);
    });
  });
});
