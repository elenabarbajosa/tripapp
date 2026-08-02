/**
 * Integer minor-unit money helpers.
 * Never use floating-point for persisted amounts.
 */

const ZERO_DECIMAL = new Set(["JPY", "KRW", "VND", "CLP", "ISK", "UGX", "XAF", "XOF"]);

export function currencyFractionDigits(currencyCode: string): number {
  const code = currencyCode.trim().toUpperCase();
  if (ZERO_DECIMAL.has(code)) {
    return 0;
  }
  return 2;
}

export function toMinorUnits(amount: number, currencyCode: string): number {
  if (!Number.isFinite(amount)) {
    throw new Error("Amount must be a finite number.");
  }
  if (amount <= 0) {
    throw new Error("Amount must be greater than zero.");
  }
  const digits = currencyFractionDigits(currencyCode);
  const factor = 10 ** digits;
  const minor = Math.round(amount * factor);
  if (minor <= 0) {
    throw new Error("Amount must be greater than zero.");
  }
  return minor;
}

export function fromMinorUnits(amountMinor: number, currencyCode: string): number {
  if (!Number.isInteger(amountMinor)) {
    throw new Error("Minor amount must be an integer.");
  }
  const digits = currencyFractionDigits(currencyCode);
  return amountMinor / 10 ** digits;
}

export function formatMinorCurrency(amountMinor: number, currencyCode: string): string {
  const code = currencyCode.trim().toUpperCase();
  const major = fromMinorUnits(amountMinor, code);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    minimumFractionDigits: currencyFractionDigits(code),
    maximumFractionDigits: currencyFractionDigits(code),
  }).format(major);
}

/**
 * Equal split of minor units. Remainder goes to the first N participants
 * in stable input order (1 minor unit each) so the sum stays exact.
 */
export function splitEqualMinor(totalMinor: number, participantCount: number): number[] {
  if (!Number.isInteger(totalMinor) || totalMinor <= 0) {
    throw new Error("Total must be a positive integer.");
  }
  if (!Number.isInteger(participantCount) || participantCount < 1) {
    throw new Error("At least one participant is required.");
  }
  const base = Math.floor(totalMinor / participantCount);
  const remainder = totalMinor % participantCount;
  return Array.from({ length: participantCount }, (_, index) =>
    index < remainder ? base + 1 : base,
  );
}

/**
 * Convert percentage shares (must total 100) into exact minor units.
 * Remainder is allocated by largest remainder method in input order for ties.
 */
export function splitPercentageMinor(
  totalMinor: number,
  percentages: number[],
): number[] {
  if (!Number.isInteger(totalMinor) || totalMinor <= 0) {
    throw new Error("Total must be a positive integer.");
  }
  if (percentages.length < 1) {
    throw new Error("At least one participant is required.");
  }
  const sumPct = percentages.reduce((acc, value) => acc + value, 0);
  if (Math.abs(sumPct - 100) > 0.0001) {
    throw new Error("Percentages must total 100.");
  }

  const raw = percentages.map((pct) => (totalMinor * pct) / 100);
  const floors = raw.map((value) => Math.floor(value));
  let remaining = totalMinor - floors.reduce((acc, value) => acc + value, 0);

  const remainders = raw
    .map((value, index) => ({ index, frac: value - Math.floor(value) }))
    .sort((a, b) => {
      if (b.frac !== a.frac) {
        return b.frac - a.frac;
      }
      return a.index - b.index;
    });

  const result = [...floors];
  for (const entry of remainders) {
    if (remaining <= 0) {
      break;
    }
    result[entry.index] = (result[entry.index] ?? 0) + 1;
    remaining -= 1;
  }
  return result;
}

export function isValidCurrencyCode(code: string): boolean {
  return /^[A-Z]{3}$/.test(code.trim().toUpperCase());
}
