/**
 * Maps Supabase / PostgREST trip query failures to readable Errors.
 * Never includes tokens or secrets.
 */
export function mapTripQueryError(error: unknown): Error {
  if (!error || typeof error !== "object") {
    return new Error("Unable to load trip data. Please try again.");
  }

  const message =
    "message" in error && typeof error.message === "string" ? error.message : "";
  const code = "code" in error && error.code != null ? String(error.code) : "";
  const details =
    "details" in error && typeof error.details === "string" ? error.details : "";
  const hint = "hint" in error && typeof error.hint === "string" ? error.hint : "";

  const lower = `${message} ${details} ${hint}`.toLowerCase();

  if (lower.includes("infinite recursion") || code === "42P17") {
    return new Error(
      "Could not load trip members because of a database policy conflict. Apply migration 20260802040000_fix_trip_members_access.sql.",
    );
  }

  if (code === "PGRST200" || lower.includes("could not find a relationship")) {
    return new Error(
      "Could not load trip members (relationship lookup failed). Pull to refresh after applying the latest migrations.",
    );
  }

  if (code === "PGRST202" || lower.includes("could not find the function")) {
    return new Error(
      "A required database function is missing. Apply migration 20260802040000_fix_trip_members_access.sql.",
    );
  }

  if (code === "42501" || lower.includes("permission denied")) {
    return new Error("You do not have permission to view this trip.");
  }

  if (lower.includes("not an accepted member")) {
    return new Error("You are not an accepted member of this trip.");
  }

  if (lower.includes("not authenticated") || code === "PGRST301") {
    return new Error("Sign in to view this trip.");
  }

  if (message && message.length < 200) {
    return new Error(message);
  }

  return new Error("Unable to load trip data. Please try again.");
}

export type TripQueryErrorDebug = {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
};

export function getTripQueryErrorDebug(error: unknown): TripQueryErrorDebug | null {
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
