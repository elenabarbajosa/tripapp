import {
  clampISODate,
  formatLocalDisplayDate,
  isoDateToPickerDate,
  maskDisplayDateInput,
  parseDisplayDateToISO,
  pickerDateToISODate,
} from "@/utils/dateOnly";

describe("dateOnly utilities", () => {
  it("parses valid DD/MM/YYYY into ISO without shifting the calendar day", () => {
    expect(parseDisplayDateToISO("12/09/2026")).toBe("2026-09-12");
    expect(formatLocalDisplayDate("2026-09-12")).toBe("12/09/2026");
  });

  it("rejects invalid manual dates", () => {
    expect(() => parseDisplayDateToISO("31/02/2026")).toThrow(/valid date/i);
    expect(() => parseDisplayDateToISO("12-09-2026")).toThrow(/DD\/MM\/YYYY/);
  });

  it("round-trips picker Dates using local calendar parts (DST-safe)", () => {
    // Construct local midnight around a common DST boundary month.
    const local = new Date(2026, 2, 29); // 29 Mar 2026 local
    const iso = pickerDateToISODate(local);
    expect(iso).toBe("2026-03-29");
    const back = isoDateToPickerDate(iso);
    expect(back.getFullYear()).toBe(2026);
    expect(back.getMonth()).toBe(2);
    expect(back.getDate()).toBe(29);
  });

  it("does not shift ISO dates when converting through UTC-sensitive environments", () => {
    const iso = "2026-01-01";
    const picker = isoDateToPickerDate(iso);
    expect(pickerDateToISODate(picker)).toBe(iso);
    expect(formatLocalDisplayDate(iso)).toBe("01/01/2026");
  });

  it("masks typed digits into DD/MM/YYYY", () => {
    expect(maskDisplayDateInput("1209")).toBe("12/09");
    expect(maskDisplayDateInput("12092026")).toBe("12/09/2026");
  });

  it("clamps ISO dates to min/max bounds", () => {
    expect(clampISODate("2026-09-10", "2026-09-12", "2026-09-24")).toBe("2026-09-12");
    expect(clampISODate("2026-09-30", "2026-09-12", "2026-09-24")).toBe("2026-09-24");
  });
});
