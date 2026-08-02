import { defaultSelectedDayId, formatDayChipParts } from "./daySelection";

const days = [
  { id: "day-1", date: "2026-09-12" },
  { id: "day-2", date: "2026-09-13" },
  { id: "day-3", date: "2026-09-14" },
];

describe("defaultSelectedDayId", () => {
  it("returns undefined for an empty list", () => {
    expect(defaultSelectedDayId([], "2026-09-13")).toBeUndefined();
  });

  it("selects today when that date is in the trip", () => {
    expect(defaultSelectedDayId(days, "2026-09-13")).toBe("day-2");
  });

  it("falls back to the first day when today is outside the trip", () => {
    expect(defaultSelectedDayId(days, "2026-08-01")).toBe("day-1");
    expect(defaultSelectedDayId(days, "2026-09-20")).toBe("day-1");
  });
});

describe("formatDayChipParts", () => {
  it("formats weekday and month/day in UTC", () => {
    expect(formatDayChipParts("2026-09-12")).toEqual({
      weekday: "Sat",
      monthDay: "Sep 12",
    });
  });
});
