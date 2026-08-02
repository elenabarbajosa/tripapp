/**
 * Map marker and overlay tokens. Hex values live here (and colors.ts) only —
 * never scatter raw hex through map components.
 */
import { colors } from "./colors";

export const mapColors = {
  destination: colors.primary,
  destinationSoft: colors.primarySoft,
  destinationOn: colors.onPrimary,
  activity: colors.activity,
  activitySoft: "#CCFBF1",
  booking: colors.accommodation,
  bookingSoft: "#EDE9FE",
  idea: colors.sightseeing,
  ideaSoft: "#CFFAFE",
  routeLine: colors.primaryBorder,
  routeLineStrong: colors.primary,
  attributionBg: "rgba(255, 255, 255, 0.92)",
  selectionRing: colors.primaryPressed,
} as const;

export type MapColorToken = keyof typeof mapColors;
