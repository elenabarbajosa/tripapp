/**
 * Maps trip-map failures to readable Errors. Never includes keys or tokens.
 */
export function mapTripMapError(error: unknown): Error {
  if (!error || typeof error !== "object") {
    return new Error("Unable to load the trip map. Please try again.");
  }

  const message =
    "message" in error && typeof error.message === "string" ? error.message : "";
  const code = "code" in error && error.code != null ? String(error.code) : "";
  const normalized = message
    .replace(/^.*ERROR:\s*/i, "")
    .replace(/\s+CONTEXT:[\s\S]*$/i, "")
    .trim();
  const lower = normalized.toLowerCase();

  if (lower.includes("not authenticated") || code === "PGRST301") {
    return new Error("Sign in to view the trip map.");
  }
  if (code === "42501" || lower.includes("permission denied")) {
    return new Error("You do not have access to this trip map.");
  }
  if (normalized.length > 0 && normalized.length < 200) {
    return new Error(normalized);
  }
  return new Error("Unable to load the trip map. Please try again.");
}

export type TripMapErrorDebug = {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
};

export function getTripMapErrorDebug(error: unknown): TripMapErrorDebug | null {
  if (!error || typeof error !== "object") {
    return null;
  }
  return {
    message: "message" in error && typeof error.message === "string" ? error.message : "Unknown",
    code: "code" in error && error.code != null ? String(error.code) : undefined,
    details: "details" in error && typeof error.details === "string" ? error.details : undefined,
    hint: "hint" in error && typeof error.hint === "string" ? error.hint : undefined,
  };
}
