import { useEffect, useRef, useState } from "react";

import {
  buildPlaceSearchCacheKey,
  getCachedPlaceSuggestions,
  getPlaceSuggestions,
  setCachedPlaceSuggestions,
} from "@/features/places";
import { PlacesUserFacingError } from "@/features/places/types";
import type { PlaceSuggestion } from "@/features/places/types";

const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 400;
const DEFAULT_ATTRIBUTION = "Powered by Geoapify";

type SearchState = {
  key: string;
  suggestions: PlaceSuggestion[];
  isSearching: boolean;
  errorMessage: string | null;
  emptyMessage: string | null;
  attribution: string;
};

const idleState = (key = ""): SearchState => ({
  key,
  suggestions: [],
  isSearching: false,
  errorMessage: null,
  emptyMessage: null,
  attribution: DEFAULT_ATTRIBUTION,
});

export interface UsePlaceAutocompleteSearchArgs {
  query: string;
  countryCode?: string | null;
  language?: string | null;
  enabled?: boolean;
}

export interface UsePlaceAutocompleteSearchResult {
  suggestions: PlaceSuggestion[];
  isSearching: boolean;
  errorMessage: string | null;
  emptyMessage: string | null;
  attribution: string;
}

export function usePlaceAutocompleteSearch({
  query,
  countryCode,
  language,
  enabled = true,
}: UsePlaceAutocompleteSearchArgs): UsePlaceAutocompleteSearchResult {
  const trimmed = query.trim();
  const canSearch = enabled && trimmed.length >= MIN_QUERY_LENGTH;
  const cacheKey = buildPlaceSearchCacheKey(trimmed, countryCode, language);

  const [state, setState] = useState<SearchState>(idleState);
  const requestSeq = useRef(0);
  const lastRequestedKey = useRef<string | null>(null);

  useEffect(() => {
    if (!canSearch) {
      lastRequestedKey.current = null;
      return;
    }

    const cached = getCachedPlaceSuggestions(cacheKey);
    if (cached) {
      const timer = setTimeout(() => {
        setState({
          key: cacheKey,
          suggestions: cached.suggestions.slice(0, 5),
          isSearching: false,
          errorMessage: null,
          emptyMessage:
            cached.suggestions.length === 0 ? "No matching locations found." : null,
          attribution: cached.attribution ?? DEFAULT_ATTRIBUTION,
        });
        lastRequestedKey.current = cacheKey;
      }, 0);
      return () => clearTimeout(timer);
    }

    if (lastRequestedKey.current === cacheKey) {
      return;
    }

    const seq = ++requestSeq.current;
    const timer = setTimeout(() => {
      setState({
        key: cacheKey,
        suggestions: [],
        isSearching: true,
        errorMessage: null,
        emptyMessage: null,
        attribution: DEFAULT_ATTRIBUTION,
      });

      void (async () => {
        try {
          const results = await getPlaceSuggestions({
            query: trimmed,
            countryCode,
            language,
            limit: 5,
          });
          if (seq !== requestSeq.current) {
            return;
          }
          lastRequestedKey.current = cacheKey;
          setCachedPlaceSuggestions(cacheKey, results, DEFAULT_ATTRIBUTION);
          setState({
            key: cacheKey,
            suggestions: results.slice(0, 5),
            isSearching: false,
            errorMessage: null,
            emptyMessage: results.length === 0 ? "No matching locations found." : null,
            attribution: DEFAULT_ATTRIBUTION,
          });
        } catch (error) {
          if (seq !== requestSeq.current) {
            return;
          }
          lastRequestedKey.current = cacheKey;
          setState({
            key: cacheKey,
            suggestions: [],
            isSearching: false,
            emptyMessage: null,
            attribution: DEFAULT_ATTRIBUTION,
            errorMessage:
              error instanceof PlacesUserFacingError
                ? error.message
                : "Location search is temporarily unavailable. You can enter it manually.",
          });
        }
      })();
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [canSearch, cacheKey, countryCode, language, trimmed]);

  if (!canSearch) {
    return idleState();
  }

  if (state.key !== cacheKey) {
    return {
      suggestions: [],
      isSearching: false,
      errorMessage: null,
      emptyMessage: null,
      attribution: DEFAULT_ATTRIBUTION,
    };
  }

  return {
    suggestions: state.suggestions,
    isSearching: state.isSearching,
    errorMessage: state.errorMessage,
    emptyMessage: state.emptyMessage,
    attribution: state.attribution,
  };
}
