/**
 * Maps packing Supabase failures to readable Errors.
 */
export function mapPackingError(error: unknown): Error {
  if (!error || typeof error !== "object") {
    return new Error("Unable to update packing list. Please try again.");
  }
  const message =
    "message" in error && typeof error.message === "string" ? error.message : "";
  const code = "code" in error && error.code != null ? String(error.code) : "";
  const details =
    "details" in error && typeof error.details === "string" ? error.details : "";
  const lower = `${message} ${details}`.toLowerCase();

  if (lower.includes("not authenticated") || code === "PGRST301") {
    return new Error("Sign in to view this packing list.");
  }
  if (code === "42501" || lower.includes("permission") || lower.includes("cannot toggle")) {
    return new Error("You do not have permission to change this packing item.");
  }
  if (lower.includes("duplicate packing item")) {
    return new Error("Duplicate packing items are not allowed in the reorder list.");
  }
  if (lower.includes("do not belong to this trip")) {
    return new Error("One or more packing items do not belong to this trip.");
  }
  if (normalizedSafe(message).length > 0 && normalizedSafe(message).length < 180) {
    return new Error(normalizedSafe(message));
  }
  return new Error("Unable to update packing list. Please try again.");
}

function normalizedSafe(message: string): string {
  return message.replace(/^.*ERROR:\s*/i, "").replace(/\s+CONTEXT:[\s\S]*$/i, "").trim();
}

export function getPackingErrorDebug(error: unknown): {
  message: string;
  code?: string;
  details?: string;
} | null {
  if (!error || typeof error !== "object") {
    return null;
  }
  return {
    message: "message" in error && typeof error.message === "string" ? error.message : "Unknown",
    code: "code" in error && error.code != null ? String(error.code) : undefined,
    details: "details" in error && typeof error.details === "string" ? error.details : undefined,
  };
}
