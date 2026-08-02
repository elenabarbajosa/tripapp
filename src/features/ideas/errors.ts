/**
 * Maps Supabase / PostgREST idea and vote failures to readable Errors.
 * Never includes tokens or secrets.
 */
export function mapIdeaError(error: unknown): Error {
  if (!error || typeof error !== "object") {
    return new Error("Unable to load ideas. Please try again.");
  }

  const message =
    "message" in error && typeof error.message === "string" ? error.message : "";
  const code = "code" in error && error.code != null ? String(error.code) : "";
  const details =
    "details" in error && typeof error.details === "string" ? error.details : "";
  const hint = "hint" in error && typeof error.hint === "string" ? error.hint : "";

  const normalized = message
    .replace(/^.*ERROR:\s*/i, "")
    .replace(/\s+CONTEXT:[\s\S]*$/i, "")
    .trim();
  const lower = `${normalized} ${details} ${hint}`.toLowerCase();

  if (lower.includes("not authenticated") || code === "PGRST301") {
    return new Error("Sign in to view ideas.");
  }

  if (code === "42501" || lower.includes("permission denied")) {
    return new Error("You do not have permission to change this idea.");
  }

  if (code === "23514" || lower.includes("check constraint") || lower.includes("violates check")) {
    if (lower.includes("trip_ideas_title")) {
      return new Error("Enter a valid idea title.");
    }
    if (lower.includes("trip_ideas_description_length")) {
      return new Error("Description must be 2000 characters or fewer.");
    }
    if (lower.includes("trip_ideas_location_length")) {
      return new Error("Location name must be 160 characters or fewer.");
    }
    if (lower.includes("trip_ideas_address_length")) {
      return new Error("Address must be 240 characters or fewer.");
    }
    if (
      lower.includes("trip_ideas_lat_lng_pair") ||
      lower.includes("trip_ideas_latitude_range") ||
      lower.includes("trip_ideas_longitude_range")
    ) {
      return new Error("Selected location is invalid. Try searching again.");
    }
    return new Error("That idea could not be saved. Check the details and try again.");
  }

  if (code === "23503" || lower.includes("foreign key")) {
    return new Error("That trip is no longer available.");
  }

  if (code === "23505" || lower.includes("duplicate key")) {
    return new Error("You have already voted for this idea.");
  }

  if (code === "PGRST116" || lower.includes("0 rows") || lower.includes("contains 0 rows")) {
    return new Error("Idea not found.");
  }

  if (normalized.length > 0 && normalized.length < 200) {
    return new Error(normalized);
  }

  return new Error("Unable to update ideas. Please try again.");
}

export type IdeaErrorDebug = {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
};

export function getIdeaErrorDebug(error: unknown): IdeaErrorDebug | null {
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
