/**
 * Maps Supabase Auth errors to human-readable copy.
 * Never returns tokens, passwords, or raw stack traces.
 */
export function getAuthErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Something went wrong. Please try again.";
  }

  const message =
    "message" in error && typeof error.message === "string" ? error.message.toLowerCase() : "";

  if (message.includes("invalid login credentials") || message.includes("invalid credentials")) {
    return "Incorrect email or password.";
  }
  if (message.includes("email not confirmed")) {
    return "Confirm your email before signing in. Check your inbox for a verification link.";
  }
  if (message.includes("user already registered")) {
    return "An account with this email already exists. Sign in instead.";
  }
  if (message.includes("password should be at least")) {
    return "Password must be at least 8 characters.";
  }
  if (message.includes("rate limit") || message.includes("too many requests")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (message.includes("network") || message.includes("fetch")) {
    return "Network error. Check your connection and try again.";
  }
  if (message.includes("not configured") || message.includes("publishable")) {
    return "Supabase is not configured yet. Add your Project URL and publishable key to .env.";
  }

  return "Unable to authenticate. Please try again.";
}

export function logAuthErrorCategory(category: string, error: unknown): void {
  if (!__DEV__) {
    return;
  }
  const code =
    error && typeof error === "object" && "status" in error ? String(error.status) : "unknown";
  // Categories only — no tokens, passwords, emails, or env values.
  console.warn(`[auth:${category}] status=${code}`);
}
