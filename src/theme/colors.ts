/**
 * Semantic colour tokens for TripApp.
 * Hex values must only appear in this file.
 */
export const colors = {
  primary: "#2563EB",
  primaryPressed: "#1D4ED8",
  primarySoft: "#EFF6FF",
  primaryBorder: "#BFDBFE",
  onPrimary: "#FFFFFF",

  background: "#F7F9FC",
  surface: "#FFFFFF",
  surfaceSecondary: "#F1F5F9",
  surfaceElevated: "#FFFFFF",

  textPrimary: "#111827",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
  textInverse: "#FFFFFF",

  border: "#E2E8F0",
  borderStrong: "#CBD5E1",
  divider: "#E2E8F0",

  success: "#16A34A",
  successSoft: "#DCFCE7",
  warning: "#D97706",
  warningSoft: "#FEF3C7",
  error: "#DC2626",
  errorSoft: "#FEE2E2",

  overlay: "rgba(15, 23, 42, 0.45)",
  skeleton: "#E2E8F0",
  skeletonHighlight: "#F1F5F9",

  // Activity category accents
  flight: "#2563EB",
  accommodation: "#7C3AED",
  restaurant: "#EA580C",
  activity: "#0D9488",
  transport: "#0369A1",
  freeTime: "#64748B",
  note: "#475569",
  other: "#64748B",

  // Map / status helpers
  tentative: "#D97706",
  confirmed: "#16A34A",
  invitation: "#2563EB",
} as const;

export type ColorToken = keyof typeof colors;
