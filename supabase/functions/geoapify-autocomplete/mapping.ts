/**
 * Pure Geoapify autocomplete helpers (no Deno / network).
 * Keep in sync with src/features/places/geoapifyMapping.ts
 */

export const GEOAPIFY_AUTOCOMPLETE_URL =
  "https://api.geoapify.com/v1/geocode/autocomplete";

export const MIN_QUERY_LENGTH = 3;
export const MAX_QUERY_LENGTH = 200;
export const MAX_SUGGESTION_LIMIT = 5;
export const DEFAULT_ATTRIBUTION = "Powered by Geoapify";

export interface AutocompleteRequestBody {
  query?: unknown;
  countryCode?: unknown;
  language?: unknown;
  limit?: unknown;
}

export interface ValidatedAutocompleteRequest {
  query: string;
  countryCode: string | null;
  language: string | null;
  limit: number;
}

export interface GeoapifyRawResult {
  place_id?: unknown;
  name?: unknown;
  formatted?: unknown;
  address_line1?: unknown;
  address_line2?: unknown;
  lat?: unknown;
  lon?: unknown;
  country_code?: unknown;
  result_type?: unknown;
  category?: unknown;
}

export interface NormalizedPlaceSuggestion {
  placeId: string;
  name: string;
  formattedAddress: string;
  primaryText: string;
  secondaryText: string | null;
  latitude: number;
  longitude: number;
  countryCode: string | null;
  resultType: string | null;
  category: string | null;
}

export type AutocompleteValidationResult =
  | { ok: true; value: ValidatedAutocompleteRequest }
  | { ok: false; status: number; error: string };

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function validateAutocompleteBody(
  body: AutocompleteRequestBody,
): AutocompleteValidationResult {
  if (body == null || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, status: 400, error: "Invalid request body" };
  }

  const query = asTrimmedString(body.query);
  if (!query) {
    return { ok: false, status: 400, error: "Query is required" };
  }
  if (query.length < MIN_QUERY_LENGTH) {
    return {
      ok: false,
      status: 400,
      error: `Query must be at least ${MIN_QUERY_LENGTH} characters`,
    };
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return {
      ok: false,
      status: 400,
      error: `Query must be ${MAX_QUERY_LENGTH} characters or fewer`,
    };
  }

  let countryCode: string | null = null;
  const rawCountry = asTrimmedString(body.countryCode);
  if (rawCountry) {
    const normalized = rawCountry.toUpperCase();
    if (!/^[A-Z]{2}$/.test(normalized)) {
      return { ok: false, status: 400, error: "countryCode must be ISO alpha-2" };
    }
    countryCode = normalized;
  }

  let language: string | null = null;
  const rawLanguage = asTrimmedString(body.language);
  if (rawLanguage) {
    if (!/^[a-zA-Z]{2}(-[a-zA-Z]{2})?$/.test(rawLanguage)) {
      return { ok: false, status: 400, error: "language must be a short locale code" };
    }
    language = rawLanguage.toLowerCase();
  }

  let limit = MAX_SUGGESTION_LIMIT;
  if (body.limit != null) {
    const parsed =
      typeof body.limit === "number"
        ? body.limit
        : typeof body.limit === "string"
          ? Number(body.limit)
          : NaN;
    if (!Number.isFinite(parsed) || parsed < 1) {
      return { ok: false, status: 400, error: "limit must be a positive number" };
    }
    limit = Math.min(Math.floor(parsed), MAX_SUGGESTION_LIMIT);
  }

  return {
    ok: true,
    value: {
      query,
      countryCode,
      language,
      limit,
    },
  };
}

export function buildGeoapifyAutocompleteUrl(
  request: ValidatedAutocompleteRequest,
  apiKey: string,
): string {
  const params = new URLSearchParams();
  params.set("text", request.query);
  params.set("format", "json");
  params.set("limit", String(request.limit));
  params.set("apiKey", apiKey);
  if (request.language) {
    params.set("lang", request.language);
  }
  if (request.countryCode) {
    // Soft bias toward the destination country — does not hard-block other countries.
    params.set("bias", `countrycode:${request.countryCode.toLowerCase()}`);
  }
  return `${GEOAPIFY_AUTOCOMPLETE_URL}?${params.toString()}`;
}

/**
 * Geoapify `filter=countrycode:` acts as a soft bias when combined with text search
 * in practice for our usage; we still never reject manual entry client-side.
 */
export function mapGeoapifyResult(
  result: GeoapifyRawResult,
): NormalizedPlaceSuggestion | null {
  const placeId = asTrimmedString(result.place_id);
  const formatted =
    asTrimmedString(result.formatted) ??
    asTrimmedString(result.address_line1);
  const latitude = asFiniteNumber(result.lat);
  const longitude = asFiniteNumber(result.lon);

  if (!placeId || !formatted || latitude == null || longitude == null) {
    return null;
  }
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return null;
  }

  const addressLine1 = asTrimmedString(result.address_line1);
  const addressLine2 = asTrimmedString(result.address_line2);
  const name =
    asTrimmedString(result.name) ?? addressLine1 ?? formatted;
  const primaryText = addressLine1 ?? name;
  const secondaryText = addressLine2;
  const countryCodeRaw = asTrimmedString(result.country_code);
  const countryCode = countryCodeRaw ? countryCodeRaw.toUpperCase() : null;

  return {
    placeId,
    name,
    formattedAddress: formatted,
    primaryText,
    secondaryText,
    latitude,
    longitude,
    countryCode,
    resultType: asTrimmedString(result.result_type),
    category: asTrimmedString(result.category),
  };
}

export function mapGeoapifyResults(
  results: unknown,
  limit = MAX_SUGGESTION_LIMIT,
): NormalizedPlaceSuggestion[] {
  if (!Array.isArray(results)) {
    return [];
  }
  const mapped: NormalizedPlaceSuggestion[] = [];
  for (const item of results) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const suggestion = mapGeoapifyResult(item as GeoapifyRawResult);
    if (suggestion) {
      mapped.push(suggestion);
    }
    if (mapped.length >= limit) {
      break;
    }
  }
  return mapped;
}

export function stripSecretsFromPayload(payload: unknown): unknown {
  if (!payload || typeof payload !== "object") {
    return payload;
  }
  const clone = { ...(payload as Record<string, unknown>) };
  delete clone.apiKey;
  delete clone.api_key;
  delete clone.GEOAPIFY_API_KEY;
  return clone;
}
