import {
  daysUntil,
  formatCountdown,
  formatDateRange,
  formatTimeLabel,
} from "@/utils/date";

describe("date utilities", () => {
  it("calculates days until a future start date", () => {
    expect(daysUntil("2026-09-12", "2026-08-02")).toBe(41);
  });

  it("formats countdown labels", () => {
    expect(formatCountdown("2026-08-02", "2026-08-02")).toBe("Today");
    expect(formatCountdown("2026-08-03", "2026-08-02")).toBe("Tomorrow");
    expect(formatCountdown("2026-08-10", "2026-08-02")).toBe("8 days to go");
  });

  it("formats date ranges", () => {
    expect(formatDateRange("2026-09-12", "2026-09-24")).toContain("Sep");
  });

  it("formats 24h times into 12h labels", () => {
    expect(formatTimeLabel("09:40")).toBe("9:40 AM");
    expect(formatTimeLabel("19:00")).toBe("7:00 PM");
  });
});
