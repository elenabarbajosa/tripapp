/**
 * Normalize an email the same way the server does:
 * lowercase + trim; blank becomes null.
 */
export function normalizeEmail(email: string): string | null {
  const normalized = email.trim().toLowerCase();
  return normalized.length === 0 ? null : normalized;
}

/**
 * Lightweight email shape check aligned with server invitation validation
 * (`position('@' in email) >= 2` after normalize).
 */
export function isValidEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return false;
  }
  const atIndex = normalized.indexOf("@");
  return atIndex >= 1 && atIndex < normalized.length - 1;
}
