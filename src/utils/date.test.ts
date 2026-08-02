import {
  daysUntil,
  eachISODateInRange,
  formatCountdown,
  formatDateRange,
  formatTimeLabel,
  resolveTripPhase,
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

  it("lists each ISO date in an inclusive range", () => {
    expect(eachISODateInRange("2026-09-12", "2026-09-14")).toEqual([
      "2026-09-12",
      "2026-09-13",
      "2026-09-14",
    ]);
  });

  it("resolves trip phase from dates", () => {
    expect(resolveTripPhase("2026-09-12", "2026-09-24", "2026-08-02")).toBe("upcoming");
    expect(resolveTripPhase("2026-09-12", "2026-09-24", "2026-09-15")).toBe("active");
    expect(resolveTripPhase("2026-09-12", "2026-09-24", "2026-09-25")).toBe("completed");
  });
});
