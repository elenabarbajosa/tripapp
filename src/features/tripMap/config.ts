const MAP_STYLE_ID = "osm-bright-grey";

export interface TripMapConfig {
  isMapConfigured: boolean;
  /** Full MapLibre style URL, or null when the public map key is missing. */
  styleUrl: string | null;
  styleId: typeof MAP_STYLE_ID;
}

/**
 * Central map tile configuration.
 * Reads EXPO_PUBLIC_GEOAPIFY_MAP_KEY only — never the private autocomplete secret.
 * Never logs the key value.
 */
export function getTripMapConfig(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): TripMapConfig {
  const apiKey = (env.EXPO_PUBLIC_GEOAPIFY_MAP_KEY ?? "").trim();
  if (!apiKey) {
    return {
      isMapConfigured: false,
      styleUrl: null,
      styleId: MAP_STYLE_ID,
    };
  }

  const styleUrl = `https://maps.geoapify.com/v1/styles/${MAP_STYLE_ID}/style.json?apiKey=${encodeURIComponent(apiKey)}`;

  return {
    isMapConfigured: true,
    styleUrl,
    styleId: MAP_STYLE_ID,
  };
}

export const isMapConfigured = getTripMapConfig().isMapConfigured;
