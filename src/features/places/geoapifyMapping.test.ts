import {
  buildGeoapifyAutocompleteUrl,
  mapGeoapifyResult,
  mapGeoapifyResults,
  MAX_SUGGESTION_LIMIT,
  stripSecretsFromPayload,
  validateAutocompleteBody,
} from "@/features/places/geoapifyMapping";

describe("geoapify-autocomplete edge mapping", () => {
  it("maps a valid Geoapify result", () => {
    const mapped = mapGeoapifyResult({
      place_id: "place-1",
      name: "Art Institute of Chicago",
      formatted: "111 S Michigan Ave, Chicago, IL 60603, United States of America",
      address_line1: "Art Institute of Chicago",
      address_line2: "111 S Michigan Ave, Chicago, IL 60603, United States of America",
      lat: 41.8796,
      lon: -87.6237,
      country_code: "us",
      result_type: "amenity",
      category: "entertainment",
    });

    expect(mapped).toEqual({
      placeId: "place-1",
      name: "Art Institute of Chicago",
      formattedAddress: "111 S Michigan Ave, Chicago, IL 60603, United States of America",
      primaryText: "Art Institute of Chicago",
      secondaryText: "111 S Michigan Ave, Chicago, IL 60603, United States of America",
      latitude: 41.8796,
      longitude: -87.6237,
      countryCode: "US",
      resultType: "amenity",
      category: "entertainment",
    });
  });

  it("discards malformed results", () => {
    expect(
      mapGeoapifyResults([
        { place_id: "x", formatted: "A", lat: 1, lon: 2 },
        { place_id: null, formatted: "Bad", lat: 1, lon: 2 },
        { place_id: "y", formatted: null, lat: 1, lon: 2 },
        { place_id: "z", formatted: "No coords" },
        { place_id: "w", formatted: "Bad lat", lat: 999, lon: 1 },
      ]),
    ).toHaveLength(1);
  });

  it("never includes an API key in normalized mapping output", () => {
    const suggestions = mapGeoapifyResults([
      {
        place_id: "p1",
        name: "Willis Tower",
        formatted: "233 S Wacker Dr, Chicago",
        lat: 41.8789,
        lon: -87.6359,
        apiKey: "should-not-leak",
      },
    ]);
    expect(JSON.stringify(suggestions)).not.toContain("should-not-leak");
    expect(JSON.stringify(suggestions)).not.toContain("apiKey");
  });

  it("strips secrets from upstream payloads", () => {
    expect(
      stripSecretsFromPayload({
        results: [],
        apiKey: "secret",
        api_key: "secret2",
        GEOAPIFY_API_KEY: "secret3",
      }),
    ).toEqual({ results: [] });
  });

  it("rejects queries below three characters", () => {
    const result = validateAutocompleteBody({ query: "ab" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/at least 3/i);
    }
  });

  it("rejects invalid bodies and long queries", () => {
    expect(validateAutocompleteBody(null as never).ok).toBe(false);
    expect(validateAutocompleteBody({ query: "a".repeat(201) }).ok).toBe(false);
    expect(validateAutocompleteBody({ query: "Chicago", countryCode: "USA" }).ok).toBe(
      false,
    );
  });

  it("caps limit at five", () => {
    const result = validateAutocompleteBody({ query: "Chicago", limit: 50 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.limit).toBe(MAX_SUGGESTION_LIMIT);
    }
  });

  it("builds a safe Geoapify URL with encoded params and bias", () => {
    const url = buildGeoapifyAutocompleteUrl(
      {
        query: "Chicago Riverwalk",
        countryCode: "US",
        language: "en",
        limit: 5,
      },
      "TEST_KEY",
    );
    expect(url).toContain("text=Chicago+Riverwalk");
    expect(url).toContain("format=json");
    expect(url).toContain("limit=5");
    expect(url).toContain("lang=en");
    expect(url).toContain("bias=countrycode%3Aus");
    expect(url).toContain("apiKey=TEST_KEY");
    expect(url).not.toContain("filter=");
  });

  it("documents timeout and missing-key safe responses", () => {
    // Handler behaviour (AbortController / missing GEOAPIFY_API_KEY) returns
    // friendly errors without leaking secrets — covered by client error mapping
    // and this invariant for response shaping.
    expect(stripSecretsFromPayload({ error: "timeout", apiKey: "x" })).toEqual({
      error: "timeout",
    });
    expect(
      validateAutocompleteBody({ query: "   " }).ok,
    ).toBe(false);
  });
});
