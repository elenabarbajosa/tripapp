import type { TripPackingItem } from "@/types/models";

export type PackingFilter = "all" | "shared" | "mine" | "unpacked" | "packed";

export function calculatePackingProgress(items: TripPackingItem[]): {
  packedCount: number;
  totalCount: number;
  percent: number;
} {
  const totalCount = items.length;
  const packedCount = items.filter((item) => item.isPacked).length;
  const percent =
    totalCount === 0 ? 0 : Math.round((packedCount / totalCount) * 100);
  return { packedCount, totalCount, percent };
}

export function filterPackingItems(
  items: TripPackingItem[],
  filter: PackingFilter,
  currentUserId: string | null | undefined,
): TripPackingItem[] {
  switch (filter) {
    case "shared":
      return items.filter((item) => item.scope === "shared");
    case "mine":
      return items.filter(
        (item) =>
          item.assignedTo === currentUserId ||
          (item.scope === "personal" && item.createdBy === currentUserId),
      );
    case "unpacked":
      return items.filter((item) => !item.isPacked);
    case "packed":
      return items.filter((item) => item.isPacked);
    case "all":
    default:
      return items;
  }
}

export function groupPackingByCategory(
  items: TripPackingItem[],
): { category: TripPackingItem["category"]; items: TripPackingItem[] }[] {
  const order: TripPackingItem["category"][] = [
    "clothes",
    "toiletries",
    "electronics",
    "documents",
    "medication",
    "travel",
    "other",
  ];
  const map = new Map<TripPackingItem["category"], TripPackingItem[]>();
  for (const item of items) {
    const list = map.get(item.category) ?? [];
    list.push(item);
    map.set(item.category, list);
  }
  return order
    .filter((category) => (map.get(category)?.length ?? 0) > 0)
    .map((category) => ({
      category,
      items: [...(map.get(category) ?? [])].sort((a, b) => {
        if (a.position !== b.position) {
          return a.position - b.position;
        }
        return a.createdAt.localeCompare(b.createdAt);
      }),
    }));
}
