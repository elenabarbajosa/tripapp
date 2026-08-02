import {
  compareTimes,
  formatTimeHHmm,
  isValidTimeHHmm,
  parseTimeToHHmm,
  timeToMinutes,
} from "@/utils/time";

describe("time utils", () => {
  it("validates HH:mm strings", () => {
    expect(isValidTimeHHmm("09:30")).toBe(true);
    expect(isValidTimeHHmm("23:59")).toBe(true);
    expect(isValidTimeHHmm("9:30")).toBe(false);
    expect(isValidTimeHHmm("24:00")).toBe(false);
    expect(isValidTimeHHmm("")).toBe(false);
    expect(isValidTimeHHmm(null)).toBe(false);
  });

  it("parses postgres time and HH:mm into HH:mm", () => {
    expect(parseTimeToHHmm("09:30:00")).toBe("09:30");
    expect(parseTimeToHHmm("9:05:00")).toBe("09:05");
    expect(formatTimeHHmm("14:00")).toBe("14:00");
    expect(parseTimeToHHmm("")).toBeNull();
    expect(parseTimeToHHmm("nope")).toBeNull();
  });

  it("compares times and converts to minutes", () => {
    expect(compareTimes("09:00", "10:00")).toBeLessThan(0);
    expect(compareTimes("12:00", "12:00")).toBe(0);
    expect(compareTimes("18:00", "17:59")).toBeGreaterThan(0);
    expect(timeToMinutes("01:30")).toBe(90);
  });
});
