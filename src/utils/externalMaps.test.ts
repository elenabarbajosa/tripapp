import {
  buildAppleMapsUrl,
  buildGeoUri,
  buildGoogleMapsUrl,
} from "@/utils/externalMaps";

describe("external maps utils", () => {
  it("encodes labels safely", () => {
    const target = {
      latitude: 38.7,
      longitude: -9.1,
      label: "Café & Tower / Lisbon",
    };
    expect(buildAppleMapsUrl(target)).toContain(encodeURIComponent(target.label));
    expect(buildGoogleMapsUrl(target)).toContain(encodeURIComponent(target.label));
    expect(buildGeoUri(target)).toContain(encodeURIComponent(target.label));
  });

  it("includes coordinates in URLs", () => {
    const target = { latitude: 10, longitude: 20, label: "X" };
    expect(buildAppleMapsUrl(target)).toContain("10,20");
    expect(buildGoogleMapsUrl(target)).toContain("10,20");
    expect(buildGeoUri(target)).toContain("geo:10,20");
  });
});
