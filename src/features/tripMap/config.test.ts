import { getTripMapConfig } from "@/features/tripMap/config";

describe("trip map config", () => {
  it("reports unconfigured when the public map key is missing", () => {
    const config = getTripMapConfig({ EXPO_PUBLIC_GEOAPIFY_MAP_KEY: "" });
    expect(config.isMapConfigured).toBe(false);
    expect(config.styleUrl).toBeNull();
  });

  it("builds a Geoapify style URL without exposing the key in logs (value only in URL)", () => {
    const config = getTripMapConfig({
      EXPO_PUBLIC_GEOAPIFY_MAP_KEY: "test-map-key",
    });
    expect(config.isMapConfigured).toBe(true);
    expect(config.styleUrl).toContain("osm-bright-grey");
    expect(config.styleUrl).toContain("apiKey=test-map-key");
    expect(config.styleId).toBe("osm-bright-grey");
  });
});
