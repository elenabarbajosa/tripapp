/**
 * Date-only helpers for form fields and pickers.
 * Prefer local calendar components so selections never shift across timezones/DST.
 */

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DISPLAY_DATE_PATTERN = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

export function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
  );
}

/** ISO YYYY-MM-DD → local Date at local midnight (safe for pickers). */
export function isoDateToPickerDate(iso: string): Date {
  const match = ISO_DATE_PATTERN.exec(iso.trim());
  if (!match) {
    throw new Error(`Invalid ISO date: ${iso}`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!isValidCalendarDate(year, month, day)) {
    throw new Error(`Invalid calendar date: ${iso}`);
  }
  return new Date(year, month - 1, day);
}

/** Local picker Date → ISO YYYY-MM-DD using local calendar parts (no UTC shift). */
export function pickerDateToISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** ISO YYYY-MM-DD → DD/MM/YYYY for English UI. */
export function formatLocalDisplayDate(iso: string): string {
  const date = isoDateToPickerDate(iso);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Manual DD/MM/YYYY (or D/M/YYYY) → ISO YYYY-MM-DD.
 * Returns null when the text is empty or incomplete; throws for invalid complete dates.
 */
export function parseDisplayDateToISO(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const match = DISPLAY_DATE_PATTERN.exec(trimmed);
  if (!match) {
    throw new Error("Use DD/MM/YYYY");
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  if (!isValidCalendarDate(year, month, day)) {
    throw new Error("Enter a valid date");
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Progressive mask helper while typing DD/MM/YYYY. */
export function maskDisplayDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function compareISODates(a: string, b: string): number {
  if (a === b) {
    return 0;
  }
  return a < b ? -1 : 1;
}

export function clampISODate(value: string, minimum?: string | null, maximum?: string | null): string {
  let next = value;
  if (minimum && compareISODates(next, minimum) < 0) {
    next = minimum;
  }
  if (maximum && compareISODates(next, maximum) > 0) {
    next = maximum;
  }
  return next;
}
