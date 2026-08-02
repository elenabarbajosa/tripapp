import type { TripPackingCategory, TripPackingScope } from "@/types/models";

const packingCategoryLabels: Record<TripPackingCategory, string> = {
  clothes: "Clothes",
  toiletries: "Toiletries",
  electronics: "Electronics",
  documents: "Documents",
  medication: "Medication",
  travel: "Travel",
  other: "Other",
};

export const TRIP_PACKING_CATEGORIES: TripPackingCategory[] = [
  "clothes",
  "toiletries",
  "electronics",
  "documents",
  "medication",
  "travel",
  "other",
];

export function getTripPackingCategoryLabel(category: TripPackingCategory): string {
  return packingCategoryLabels[category];
}

const packingScopeLabels: Record<TripPackingScope, string> = {
  shared: "Shared",
  personal: "Personal",
};

export const TRIP_PACKING_SCOPES: TripPackingScope[] = ["shared", "personal"];

export function getTripPackingScopeLabel(scope: TripPackingScope): string {
  return packingScopeLabels[scope];
}
