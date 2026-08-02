import type { PlaceSuggestion } from "./types";

type CacheEntry = {
  suggestions: PlaceSuggestion[];
  attribution: string | null;
};

const cache = new Map<string, CacheEntry>();
const MAX_CACHE_ENTRIES = 30;

export function buildPlaceSearchCacheKey(
  query: string,
  countryCode?: string | null,
  language?: string | null,
): string {
  return [
    query.trim().toLowerCase(),
    (countryCode ?? "").trim().toUpperCase(),
    (language ?? "").trim().toLowerCase(),
  ].join("|");
}

export function getCachedPlaceSuggestions(key: string): CacheEntry | null {
  return cache.get(key) ?? null;
}

export function setCachedPlaceSuggestions(
  key: string,
  suggestions: PlaceSuggestion[],
  attribution: string | null = null,
): void {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest) {
      cache.delete(oldest);
    }
  }
  cache.set(key, { suggestions, attribution });
}

/** Test helper — clears the in-memory session cache. */
export function clearPlaceSuggestionsCache(): void {
  cache.clear();
}
