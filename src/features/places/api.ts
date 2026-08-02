import { requireSupabaseClient } from "@/services/supabase";

import { getPlacesErrorDebug, mapPlacesError } from "./errors";
import type {
  GetPlaceSuggestionsInput,
  PlaceAutocompleteResponse,
  PlaceSuggestion,
} from "./types";
import { PlacesUserFacingError } from "./types";

const MAX_LIMIT = 5;
const MIN_QUERY = 3;

function normalizeSuggestion(raw: unknown): PlaceSuggestion | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const placeId = typeof row.placeId === "string" ? row.placeId.trim() : "";
  const name = typeof row.name === "string" ? row.name.trim() : "";
  const formattedAddress =
    typeof row.formattedAddress === "string" ? row.formattedAddress.trim() : "";
  const primaryText =
    typeof row.primaryText === "string" ? row.primaryText.trim() : name;
  const latitude = typeof row.latitude === "number" ? row.latitude : Number.NaN;
  const longitude = typeof row.longitude === "number" ? row.longitude : Number.NaN;

  if (
    !placeId ||
    !name ||
    !formattedAddress ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  return {
    placeId,
    name,
    formattedAddress,
    primaryText: primaryText || name,
    secondaryText:
      typeof row.secondaryText === "string" && row.secondaryText.trim()
        ? row.secondaryText.trim()
        : null,
    latitude,
    longitude,
    countryCode:
      typeof row.countryCode === "string" && row.countryCode.trim()
        ? row.countryCode.trim().toUpperCase()
        : null,
    resultType:
      typeof row.resultType === "string" && row.resultType.trim()
        ? row.resultType.trim()
        : null,
    category:
      typeof row.category === "string" && row.category.trim()
        ? row.category.trim()
        : null,
  };
}

function logPlacesError(context: string, error: unknown): void {
  if (!__DEV__) {
    return;
  }
  console.warn(`[places:${context}]`, getPlacesErrorDebug(error));
}

/**
 * Calls the authenticated `geoapify-autocomplete` Edge Function.
 * Never sends or receives a Geoapify API key from the client.
 */
export async function getPlaceSuggestions(
  input: GetPlaceSuggestionsInput,
): Promise<PlaceSuggestion[]> {
  const query = input.query.trim();
  if (query.length < MIN_QUERY) {
    return [];
  }

  const client = requireSupabaseClient();
  const limit = Math.min(
    Math.max(1, typeof input.limit === "number" ? Math.floor(input.limit) : MAX_LIMIT),
    MAX_LIMIT,
  );

  const countryCode =
    typeof input.countryCode === "string" && input.countryCode.trim()
      ? input.countryCode.trim().toUpperCase()
      : undefined;
  const language =
    typeof input.language === "string" && input.language.trim()
      ? input.language.trim().toLowerCase()
      : undefined;

  try {
    const { data, error } = await client.functions.invoke("geoapify-autocomplete", {
      body: {
        query,
        countryCode,
        language,
        limit,
      },
    });

    if (error) {
      logPlacesError("getPlaceSuggestions", error);
      throw mapPlacesError(error);
    }

    const payload = (data ?? null) as PlaceAutocompleteResponse | null;
    if (payload && payload.configured === false) {
      throw new PlacesUserFacingError(
        "not_configured",
        "Location search is not configured yet.",
        typeof payload.error === "string" ? payload.error : undefined,
      );
    }

    if (payload && typeof payload.error === "string" && payload.error.trim()) {
      const friendly = mapPlacesError({
        message: payload.error,
        status: payload.configured === false ? 503 : 502,
      });
      throw friendly;
    }

    const suggestions = Array.isArray(payload?.suggestions)
      ? payload.suggestions
          .map((item) => normalizeSuggestion(item))
          .filter((item): item is PlaceSuggestion => item != null)
          .slice(0, MAX_LIMIT)
      : [];

    return suggestions;
  } catch (error) {
    if (error instanceof PlacesUserFacingError) {
      throw error;
    }
    logPlacesError("getPlaceSuggestions.unexpected", error);
    throw mapPlacesError(error);
  }
}
