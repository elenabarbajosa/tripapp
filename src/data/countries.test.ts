import {
  formatCurrencyLabel,
  getCountryByCode,
  resolvePrimaryTripCurrency,
  searchCountries,
} from "@/data/countries";

describe("countries data", () => {
  it("finds Spain by partial name and ISO codes", () => {
    expect(searchCountries("sp").some((country) => country.countryCode === "ES")).toBe(true);
    expect(searchCountries("ES").some((country) => country.name === "Spain")).toBe(true);
    expect(searchCountries("espa").some((country) => country.countryCode === "ES")).toBe(true);
  });

  it("finds United States and United Kingdom for united", () => {
    const results = searchCountries("united");
    const codes = results.map((country) => country.countryCode);
    expect(codes).toEqual(expect.arrayContaining(["US", "GB"]));
  });

  it("is case-insensitive and trims query text", () => {
    expect(searchCountries("  Us  ").some((country) => country.countryCode === "US")).toBe(true);
  });

  it("maps country selection with flag and currency", () => {
    const spain = getCountryByCode("ES");
    expect(spain?.flag).toBeTruthy();
    expect(spain?.currencyCode).toBe("EUR");
    expect(formatCurrencyLabel(spain!)).toContain("EUR");
  });

  it("uses the first destination currency as the primary trip currency", () => {
    expect(
      resolvePrimaryTripCurrency([
        { currencyCode: "USD" },
        { currencyCode: "CAD" },
      ]),
    ).toBe("USD");
  });

  it("returns null when no destination currency can be inferred", () => {
    expect(resolvePrimaryTripCurrency([{ currencyCode: null }, { currencyCode: "" }])).toBeNull();
  });
});
