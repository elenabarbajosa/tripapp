import {
  calculatePackingProgress,
  filterPackingItems,
  groupPackingByCategory,
} from "@/features/packing/progress";
import type { TripPackingItem } from "@/types/models";

function item(overrides: Partial<TripPackingItem>): TripPackingItem {
  return {
    id: "1",
    tripId: "t1",
    createdBy: "u1",
    title: "Passport",
    category: "documents",
    scope: "shared",
    assignedTo: null,
    quantity: 1,
    notes: null,
    isPacked: false,
    packedBy: null,
    packedAt: null,
    position: 0,
    createdAt: "2026-08-01T00:00:00Z",
    updatedAt: "2026-08-01T00:00:00Z",
    ...overrides,
  };
}

describe("packing progress and filters", () => {
  const items = [
    item({ id: "a", isPacked: true, category: "documents" }),
    item({
      id: "b",
      isPacked: false,
      scope: "personal",
      assignedTo: "u1",
      createdBy: "u1",
      category: "clothes",
      position: 1,
    }),
    item({ id: "c", isPacked: false, category: "toiletries", position: 2 }),
  ];

  it("calculates progress", () => {
    expect(calculatePackingProgress(items)).toEqual({
      packedCount: 1,
      totalCount: 3,
      percent: 33,
    });
  });

  it("filters mine/shared/packed", () => {
    expect(filterPackingItems(items, "shared", "u1")).toHaveLength(2);
    expect(filterPackingItems(items, "mine", "u1")).toHaveLength(1);
    expect(filterPackingItems(items, "packed", "u1")).toHaveLength(1);
    expect(filterPackingItems(items, "unpacked", "u1")).toHaveLength(2);
  });

  it("groups by category", () => {
    const groups = groupPackingByCategory(items);
    expect(groups.map((g) => g.category)).toEqual([
      "clothes",
      "toiletries",
      "documents",
    ]);
  });
});
