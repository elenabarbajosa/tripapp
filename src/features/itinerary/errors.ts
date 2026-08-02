/**
 * Maps Supabase / PostgREST itinerary failures to readable Errors.
 * Never includes tokens or secrets.
 */
export function mapItineraryError(error: unknown): Error {
  if (!error || typeof error !== "object") {
    return new Error("Unable to load itinerary. Please try again.");
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
    return new Error("Sign in to view this itinerary.");
  }

  if (lower.includes("only owners and editors can reorder")) {
    return new Error("Only owners and editors can reorder activities.");
  }

  if (lower.includes("trip day does not belong")) {
    return new Error("That day does not belong to this trip.");
  }

  if (lower.includes("duplicate activity ids")) {
    return new Error("Duplicate activities are not allowed in the reorder list.");
  }

  if (lower.includes("do not belong to this trip day")) {
    return new Error("One or more activities do not belong to this day.");
  }

  if (lower.includes("must include every activity")) {
    return new Error("The reorder list must include every activity for this day.");
  }

  if (lower.includes("activity list is required")) {
    return new Error("Select activities to reorder.");
  }

  if (lower.includes("trip and day are required")) {
    return new Error("Trip and day are required.");
  }

  if (code === "42501" || lower.includes("permission denied")) {
    return new Error("You do not have permission to change this itinerary.");
  }

  if (code === "23514" || lower.includes("check constraint") || lower.includes("violates check")) {
    if (lower.includes("time_order") || lower.includes("end_time")) {
      return new Error("End time must be on or after start time.");
    }
    if (lower.includes("all_day")) {
      return new Error("All-day activities cannot have start or end times.");
    }
    if (lower.includes("title")) {
      return new Error("Enter a valid activity title.");
    }
    return new Error("That activity could not be saved. Check the details and try again.");
  }

  if (code === "23503" || lower.includes("foreign key")) {
    return new Error("That day or destination is no longer available on this trip.");
  }

  if (code === "PGRST116" || lower.includes("0 rows") || lower.includes("contains 0 rows")) {
    return new Error("Activity not found.");
  }

  if (normalized.length > 0 && normalized.length < 200) {
    return new Error(normalized);
  }

  return new Error("Unable to update itinerary. Please try again.");
}

export type ItineraryErrorDebug = {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
};

export function getItineraryErrorDebug(error: unknown): ItineraryErrorDebug | null {
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
