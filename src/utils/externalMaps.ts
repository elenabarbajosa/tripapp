import { Linking, Platform } from "react-native";

import { isValidMapCoordinate } from "@/features/tripMap/mappers";

export type ExternalDirectionsTarget = {
  latitude: number;
  longitude: number;
  label?: string | null;
};

function encodeLabel(label: string | null | undefined): string {
  const trimmed = (label ?? "").trim();
  return trimmed.length > 0 ? encodeURIComponent(trimmed) : "Location";
}

export function buildAppleMapsUrl(target: ExternalDirectionsTarget): string {
  const label = encodeLabel(target.label);
  return `http://maps.apple.com/?daddr=${target.latitude},${target.longitude}&q=${label}`;
}

export function buildGoogleMapsUrl(target: ExternalDirectionsTarget): string {
  const label = encodeLabel(target.label);
  return `https://www.google.com/maps/dir/?api=1&destination=${target.latitude},${target.longitude}&destination_place_id=&travelmode=driving&dir_action=navigate&destination_name=${label}`;
}

export function buildGeoUri(target: ExternalDirectionsTarget): string {
  const label = encodeLabel(target.label);
  return `geo:${target.latitude},${target.longitude}?q=${target.latitude},${target.longitude}(${label})`;
}

/**
 * Opens an external maps app for directions. Does not request location permission
 * and does not use a maps API key.
 */
export async function openExternalDirections(
  target: ExternalDirectionsTarget,
): Promise<void> {
  if (!isValidMapCoordinate(target.latitude, target.longitude)) {
    throw new Error("This place does not have valid coordinates for directions.");
  }

  const candidates =
    Platform.OS === "ios"
      ? [buildAppleMapsUrl(target), buildGoogleMapsUrl(target)]
      : [buildGeoUri(target), buildGoogleMapsUrl(target)];

  for (const url of candidates) {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        continue;
      }
      await Linking.openURL(url);
      return;
    } catch {
      // try next candidate
    }
  }

  throw new Error("No compatible maps app is available on this device.");
}
