/**
 * Centralized product branding.
 * Change the temporary name, tagline, and logo references here only.
 */
export const branding = {
  productName: "TripApp",
  tagline: "Plan the trip together. Keep everything in one place.",
  shortTagline: "Plan trips together",
  emptyHomeTitle: "Your next trip starts here.",
  emptyHomeBody:
    "Plan an itinerary, invite travellers, and keep every detail together.",
  supportEmail: "hello@tripapp.example",
  /** Placeholder asset path — replace when final logo is ready */
  logoMark: require("../../assets/icon.png") as number,
} as const;
