import { ActivityCategory } from "@/types/models";
import { colors } from "@/theme/colors";

const categoryLabels: Record<ActivityCategory, string> = {
  activity: "Activity",
  restaurant: "Restaurant",
  accommodation: "Stay",
  flight: "Flight",
  transport: "Transport",
  free_time: "Free time",
  note: "Note",
  other: "Other",
};

const categoryColors: Record<ActivityCategory, string> = {
  activity: colors.activity,
  restaurant: colors.restaurant,
  accommodation: colors.accommodation,
  flight: colors.flight,
  transport: colors.transport,
  free_time: colors.freeTime,
  note: colors.note,
  other: colors.other,
};

export function getCategoryLabel(category: ActivityCategory): string {
  return categoryLabels[category];
}

export function getCategoryColor(category: ActivityCategory): string {
  return categoryColors[category];
}
