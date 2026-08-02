import {
  calculatePackingProgress,
  filterPackingItems,
} from "@/features/packing/progress";
import type { TripPackingItem } from "@/types/models";

function item(
  partial: Partial<TripPackingItem> & Pick<TripPackingItem, "id" | "title">,
): TripPackingItem {
  return {
    tripId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    createdBy: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    category: "other",
    scope: "shared",
    assignedTo: null,
    quantity: 1,
    notes: null,
    isPacked: false,
    packedBy: null,
    packedAt: null,
    position: 0,
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-01T10:00:00.000Z",
    ...partial,
  };
}

describe("packing progress and filters", () => {
  it("calculates progress", () => {
    const progress = calculatePackingProgress([
      item({ id: "1", title: "A", isPacked: true }),
      item({ id: "2", title: "B", isPacked: false }),
    ]);
    expect(progress).toEqual({ packedCount: 1, totalCount: 2, percent: 50 });
  });

  it("filters shared, mine, packed, and unpacked", () => {
    const userId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    const items = [
      item({ id: "1", title: "Shared", scope: "shared" }),
      item({
        id: "2",
        title: "Mine",
        scope: "personal",
        assignedTo: userId,
        createdBy: userId,
        isPacked: true,
      }),
      item({
        id: "3",
        title: "Other",
        scope: "personal",
        assignedTo: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        createdBy: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      }),
    ];
    expect(filterPackingItems(items, "shared", userId)).toHaveLength(1);
    expect(filterPackingItems(items, "mine", userId).map((entry) => entry.id)).toEqual(["2"]);
    expect(filterPackingItems(items, "packed", userId)).toHaveLength(1);
    expect(filterPackingItems(items, "unpacked", userId)).toHaveLength(2);
  });
});
