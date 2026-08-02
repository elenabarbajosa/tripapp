import { mapPackingItemRow, sortPackingItems } from "@/features/packing/mappers";
import type { TripPackingItem } from "@/types/models";
import type { TripPackingItemRow } from "@/types/database";

function item(overrides: Partial<TripPackingItem> = {}): TripPackingItem {
  return {
    id: "item-1",
    tripId: "trip-1",
    createdBy: "user-1",
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
    createdAt: "2026-08-01T10:00:00Z",
    updatedAt: "2026-08-01T10:00:00Z",
    ...overrides,
  };
}

function row(overrides: Partial<TripPackingItemRow> = {}): TripPackingItemRow {
  return {
    id: "row-1",
    trip_id: "trip-1",
    created_by: "user-1",
    title: "Sunscreen",
    category: "toiletries",
    scope: "shared",
    assigned_to: null,
    quantity: 2,
    notes: "SPF 50",
    is_packed: false,
    packed_by: null,
    packed_at: null,
    position: 3,
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
    ...overrides,
  };
}

describe("packing mappers", () => {
  it("maps a packing row to a domain item", () => {
    const mapped = mapPackingItemRow(row());
    expect(mapped.id).toBe("row-1");
    expect(mapped.category).toBe("toiletries");
    expect(mapped.quantity).toBe(2);
    expect(mapped.notes).toBe("SPF 50");
    expect(mapped.isPacked).toBe(false);
  });

  it("maps packed metadata when present", () => {
    const mapped = mapPackingItemRow(
      row({ is_packed: true, packed_by: "user-2", packed_at: "2026-08-02T00:00:00Z" }),
    );
    expect(mapped.isPacked).toBe(true);
    expect(mapped.packedBy).toBe("user-2");
    expect(mapped.packedAt).toBe("2026-08-02T00:00:00Z");
  });

  it("sorts by position ascending, then created_at ascending", () => {
    const sorted = sortPackingItems([
      item({ id: "b", position: 1, createdAt: "2026-08-01T09:00:00Z" }),
      item({ id: "a", position: 0, createdAt: "2026-08-01T10:00:00Z" }),
      item({ id: "c", position: 1, createdAt: "2026-08-01T08:00:00Z" }),
    ]);

    expect(sorted.map((entry) => entry.id)).toEqual(["a", "c", "b"]);
  });
});
