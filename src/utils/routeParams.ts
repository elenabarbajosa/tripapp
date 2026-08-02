/**
 * Expo Router search params may be `string | string[]`.
 */
export function resolveRouteParam(
  value: string | string[] | undefined | null,
): string | undefined {
  if (Array.isArray(value)) {
    const first = value[0]?.trim();
    return first ? first : undefined;
  }
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** True only for a real UUID string — rejects undefined, "", and the literal "undefined". */
export function isValidUuid(value: string | undefined | null): value is string {
  if (typeof value !== "string") {
    return false;
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed === "undefined" || trimmed === "null") {
    return false;
  }
  return UUID_RE.test(trimmed);
}
