import type { TripActivityCategory } from "@/types/models";
import { colors } from "@/theme/colors";

const categoryLabels: Record<TripActivityCategory, string> = {
  activity: "Activity",
  sightseeing: "Sightseeing",
  food: "Food",
  nightlife: "Nightlife",
  shopping: "Shopping",
  transport: "Transport",
  other: "Other",
};

const categoryColors: Record<TripActivityCategory, string> = {
  activity: colors.activity,
  sightseeing: colors.sightseeing,
  food: colors.food,
  nightlife: colors.nightlife,
  shopping: colors.shopping,
  transport: colors.transport,
  other: colors.other,
};

export const TRIP_ACTIVITY_CATEGORIES: TripActivityCategory[] = [
  "activity",
  "sightseeing",
  "food",
  "nightlife",
  "shopping",
  "transport",
  "other",
];

export function getTripActivityCategoryLabel(category: TripActivityCategory): string {
  return categoryLabels[category];
}

export function getTripActivityCategoryColor(category: TripActivityCategory): string {
  return categoryColors[category];
}
