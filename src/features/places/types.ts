export interface PlaceSuggestion {
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

export interface PlaceAutocompleteResponse {
  suggestions: PlaceSuggestion[];
  attribution: string;
  configured?: boolean;
  error?: string;
}

export interface GetPlaceSuggestionsInput {
  query: string;
  countryCode?: string | null;
  language?: string | null;
  limit?: number;
}

export interface PlaceLocationValue {
  locationName: string | null;
  address: string | null;
  geoapifyPlaceId: string | null;
  latitude: number | null;
  longitude: number | null;
}

export type PlacesUserFacingErrorCode =
  | "not_configured"
  | "unavailable"
  | "empty"
  | "invalid_query";

export class PlacesUserFacingError extends Error {
  readonly code: PlacesUserFacingErrorCode;
  readonly details?: string;

  constructor(code: PlacesUserFacingErrorCode, message: string, details?: string) {
    super(message);
    this.name = "PlacesUserFacingError";
    this.code = code;
    this.details = details;
  }
}
