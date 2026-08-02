/**
 * Google iOS URL scheme is the reversed iOS OAuth client ID.
 * Example: 123-abc.apps.googleusercontent.com → com.googleusercontent.apps.123-abc
 */
export function iosUrlSchemeFromClientId(iosClientId: string | undefined): string | undefined {
  const trimmed = (iosClientId ?? "").trim();
  if (!trimmed) {
    return undefined;
  }

  const suffix = ".apps.googleusercontent.com";
  if (!trimmed.endsWith(suffix)) {
    return undefined;
  }

  const id = trimmed.slice(0, -suffix.length);
  if (!id) {
    return undefined;
  }

  return `com.googleusercontent.apps.${id}`;
}
