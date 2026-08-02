/**
 * Maps Supabase / PostgREST booking failures to readable Errors.
 * Never includes tokens or secrets.
 */
export function mapBookingError(error: unknown): Error {
  if (!error || typeof error !== "object") {
    return new Error("Unable to load bookings. Please try again.");
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
    return new Error("Sign in to view bookings.");
  }

  if (code === "42501" || lower.includes("permission denied")) {
    return new Error("You do not have permission to change this booking.");
  }

  if (code === "23514" || lower.includes("check constraint") || lower.includes("violates check")) {
    if (lower.includes("date_order")) {
      return new Error("End date must be on or after the start date.");
    }
    if (lower.includes("time_order")) {
      return new Error("End time must be on or after start time.");
    }
    if (lower.includes("lat_lng_pair") || lower.includes("latitude_range") || lower.includes("longitude_range")) {
      return new Error("Selected location is invalid. Try searching again.");
    }
    if (lower.includes("title")) {
      return new Error("Enter a valid booking title.");
    }
    return new Error("That booking could not be saved. Check the details and try again.");
  }

  if (code === "23503" || lower.includes("foreign key")) {
    return new Error("That trip is no longer available.");
  }

  if (code === "PGRST116" || lower.includes("0 rows") || lower.includes("contains 0 rows")) {
    return new Error("Booking not found.");
  }

  if (normalized.length > 0 && normalized.length < 200) {
    return new Error(normalized);
  }

  return new Error("Unable to update bookings. Please try again.");
}

export type BookingErrorDebug = {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
};

export function getBookingErrorDebug(error: unknown): BookingErrorDebug | null {
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
