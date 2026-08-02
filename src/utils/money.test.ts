import {
  currencyFractionDigits,
  formatMinorCurrency,
  fromMinorUnits,
  isValidCurrencyCode,
  splitEqualMinor,
  splitPercentageMinor,
  toMinorUnits,
} from "@/utils/money";

describe("money minor units", () => {
  it("converts major to minor for two-decimal currencies", () => {
    expect(toMinorUnits(12.34, "USD")).toBe(1234);
    expect(fromMinorUnits(1234, "USD")).toBe(12.34);
  });

  it("uses zero decimals for JPY", () => {
    expect(currencyFractionDigits("JPY")).toBe(0);
    expect(toMinorUnits(1500, "JPY")).toBe(1500);
  });

  it("formats minor currency", () => {
    expect(formatMinorCurrency(214000, "USD")).toContain("2,140");
  });

  it("rejects non-positive amounts", () => {
    expect(() => toMinorUnits(0, "USD")).toThrow(/greater than zero/i);
  });

  it("splits equal amounts with remainder", () => {
    expect(splitEqualMinor(100, 3)).toEqual([34, 33, 33]);
    expect(splitEqualMinor(100, 3).reduce((a, b) => a + b, 0)).toBe(100);
  });

  it("splits equal amounts exactly", () => {
    expect(splitEqualMinor(90, 3)).toEqual([30, 30, 30]);
  });

  it("splits percentages with rounding remainder", () => {
    const shares = splitPercentageMinor(100, [33.33, 33.33, 33.34]);
    expect(shares.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it("rejects percentage totals that are not 100", () => {
    expect(() => splitPercentageMinor(100, [50, 40])).toThrow(/total 100/i);
  });

  it("validates ISO currency codes", () => {
    expect(isValidCurrencyCode("USD")).toBe(true);
    expect(isValidCurrencyCode("us")).toBe(false);
  });
});
