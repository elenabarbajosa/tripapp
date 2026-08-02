import type { TripIdeaCategory, TripIdeaStatus } from "@/types/models";
import { colors } from "@/theme/colors";

const ideaCategoryLabels: Record<TripIdeaCategory, string> = {
  sightseeing: "Sightseeing",
  food: "Food",
  activity: "Activity",
  nightlife: "Nightlife",
  shopping: "Shopping",
  transport: "Transport",
  other: "Other",
};

const ideaCategoryColors: Record<TripIdeaCategory, string> = {
  sightseeing: colors.sightseeing,
  food: colors.food,
  activity: colors.activity,
  nightlife: colors.nightlife,
  shopping: colors.shopping,
  transport: colors.transport,
  other: colors.other,
};

export const TRIP_IDEA_CATEGORIES: TripIdeaCategory[] = [
  "sightseeing",
  "food",
  "activity",
  "nightlife",
  "shopping",
  "transport",
  "other",
];

export function getTripIdeaCategoryLabel(category: TripIdeaCategory): string {
  return ideaCategoryLabels[category];
}

export function getTripIdeaCategoryColor(category: TripIdeaCategory): string {
  return ideaCategoryColors[category];
}

const ideaStatusLabels: Record<TripIdeaStatus, string> = {
  proposed: "Proposed",
  added_to_itinerary: "Added to itinerary",
  archived: "Archived",
};

export const TRIP_IDEA_STATUSES: TripIdeaStatus[] = [
  "proposed",
  "added_to_itinerary",
  "archived",
];

export function getTripIdeaStatusLabel(status: TripIdeaStatus): string {
  return ideaStatusLabels[status];
}
