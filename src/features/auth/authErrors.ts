export type SocialAuthProvider = "google" | "apple";

export class AuthCancelledError extends Error {
  readonly code = "AUTH_CANCELLED" as const;

  constructor(message = "Authentication was cancelled.") {
    super(message);
    this.name = "AuthCancelledError";
  }
}

export class AuthNotConfiguredError extends Error {
  readonly code = "AUTH_NOT_CONFIGURED" as const;

  constructor(message: string) {
    super(message);
    this.name = "AuthNotConfiguredError";
  }
}

export class AuthUnavailableError extends Error {
  readonly code = "AUTH_UNAVAILABLE" as const;

  constructor(message: string) {
    super(message);
    this.name = "AuthUnavailableError";
  }
}

export function isAuthCancelledError(error: unknown): boolean {
  return error instanceof AuthCancelledError || isCancelledCode(error);
}

function isCancelledCode(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code =
    "code" in error && (typeof error.code === "string" || typeof error.code === "number")
      ? String(error.code)
      : "";

  return (
    code === "AUTH_CANCELLED" ||
    code === "ERR_REQUEST_CANCELED" ||
    code === "SIGN_IN_CANCELLED" ||
    code === "-5" ||
    code.toLowerCase().includes("cancel")
  );
}

/**
 * Maps Supabase Auth errors to human-readable copy.
 * Never returns tokens, passwords, or raw stack traces.
 */
export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof AuthNotConfiguredError || error instanceof AuthUnavailableError) {
    return error.message;
  }

  if (isAuthCancelledError(error)) {
    return "Authentication was cancelled.";
  }

  if (!error || typeof error !== "object") {
    return "Something went wrong. Please try again.";
  }

  const message =
    "message" in error && typeof error.message === "string" ? error.message.toLowerCase() : "";
  const code =
    "code" in error && (typeof error.code === "string" || typeof error.code === "number")
      ? String(error.code).toLowerCase()
      : "";

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
  if (
    message.includes("provider is not enabled") ||
    message.includes("unsupported provider") ||
    message.includes("validation_failed")
  ) {
    return "This sign-in provider is not enabled in Supabase yet. Enable it under Authentication → Providers.";
  }
  if (message.includes("nonce") || message.includes("id_token")) {
    return "Sign-in could not be verified. Check provider configuration (including Google nonce settings) and try again.";
  }
  if (
    code.includes("play_services") ||
    message.includes("play services") ||
    message.includes("play_services")
  ) {
    return "Google Play Services are unavailable or out of date on this device.";
  }
  if (message.includes("client id") || message.includes("invalid_client") || code.includes("10")) {
    return "Google client ID configuration looks invalid. Check your .env values and Google Cloud OAuth clients.";
  }
  if (message.includes("developer error") || code === "DEVELOPER_ERROR") {
    return "Google sign-in is misconfigured for this build. Verify package name, SHA-1, and client IDs.";
  }
  if (
    message.includes("rngooglesignin") ||
    message.includes("native module") ||
    message.includes("google sign-in is not available")
  ) {
    return "Google sign-in requires a development build. Email sign-in still works in Expo Go.";
  }

  return "Unable to authenticate. Please try again.";
}

export function getSocialAuthErrorMessage(
  provider: SocialAuthProvider,
  error: unknown,
): string {
  if (isAuthCancelledError(error)) {
    return "Authentication was cancelled.";
  }

  if (error instanceof AuthNotConfiguredError || error instanceof AuthUnavailableError) {
    return error.message;
  }

  const mapped = getAuthErrorMessage(error);
  if (mapped !== "Unable to authenticate. Please try again.") {
    return mapped;
  }

  return provider === "google"
    ? "Google sign-in failed. Please try again or use email."
    : "Apple sign-in failed. Please try again or use email.";
}

export function logAuthErrorCategory(category: string, error: unknown): void {
  if (!__DEV__) {
    return;
  }
  const code =
    error && typeof error === "object" && "code" in error
      ? String(error.code)
      : error && typeof error === "object" && "status" in error
        ? String(error.status)
        : "unknown";
  // Categories only — no tokens, passwords, emails, nonces, or env values.
  console.warn(`[auth:${category}] code=${code}`);
}
