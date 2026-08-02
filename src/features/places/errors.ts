import { PlacesUserFacingError } from "./types";

export type PlacesErrorDebug = {
  message: string;
  code?: string;
  details?: string;
};

/**
 * Maps Edge Function / network failures to friendly PlacesUserFacingError values.
 * Never includes tokens or the Geoapify API key.
 */
export function mapPlacesError(error: unknown): PlacesUserFacingError {
  if (error instanceof PlacesUserFacingError) {
    return error;
  }

  if (!error || typeof error !== "object") {
    return new PlacesUserFacingError(
      "unavailable",
      "Location search is temporarily unavailable. You can enter it manually.",
    );
  }

  const message =
    "message" in error && typeof error.message === "string" ? error.message : "";
  const context =
    "context" in error && error.context && typeof error.context === "object"
      ? (error.context as Record<string, unknown>)
      : null;
  const status =
    context && "status" in context && typeof context.status === "number"
      ? context.status
      : "status" in error && typeof error.status === "number"
        ? error.status
        : null;
  const bodyMessage =
    context &&
    "body" in context &&
    context.body &&
    typeof context.body === "object" &&
    "error" in (context.body as object) &&
    typeof (context.body as { error?: unknown }).error === "string"
      ? (context.body as { error: string }).error
      : "";

  const combined = `${message} ${bodyMessage}`.toLowerCase();

  if (
    status === 503 ||
    combined.includes("not configured") ||
    combined.includes("geoapify_api_key")
  ) {
    return new PlacesUserFacingError(
      "not_configured",
      "Location search is not configured yet.",
      bodyMessage || message || undefined,
    );
  }

  if (
    combined.includes("failed to send") ||
    combined.includes("function not found") ||
    combined.includes("not found") ||
    combined.includes("404") ||
    status === 404
  ) {
    return new PlacesUserFacingError(
      "unavailable",
      "Location search is temporarily unavailable. You can enter it manually.",
      bodyMessage || message || undefined,
    );
  }

  if (combined.includes("at least 3") || combined.includes("query is required")) {
    return new PlacesUserFacingError(
      "invalid_query",
      "Type at least three characters to search.",
      bodyMessage || message || undefined,
    );
  }

  return new PlacesUserFacingError(
    "unavailable",
    "Location search is temporarily unavailable. You can enter it manually.",
    bodyMessage || message || undefined,
  );
}

export function getPlacesErrorDebug(error: unknown): PlacesErrorDebug | null {
  if (!error || typeof error !== "object") {
    return null;
  }
  if (error instanceof PlacesUserFacingError) {
    return {
      message: error.message,
      code: error.code,
      details: error.details,
    };
  }
  return {
    message: "message" in error && typeof error.message === "string" ? error.message : "Unknown",
    code:
      "code" in error && error.code != null
        ? String(error.code)
        : "status" in error && error.status != null
          ? String(error.status)
          : undefined,
    details:
      "details" in error && typeof error.details === "string" ? error.details : undefined,
  };
}
