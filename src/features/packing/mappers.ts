import type { TripPackingItemRow } from "@/types/database";
import type { TripPackingItem } from "@/types/models";

export function mapPackingItemRow(row: TripPackingItemRow): TripPackingItem {
  return {
    id: row.id,
    tripId: row.trip_id,
    createdBy: row.created_by,
    title: row.title,
    category: row.category,
    scope: row.scope,
    assignedTo: row.assigned_to,
    quantity: row.quantity,
    notes: row.notes,
    isPacked: row.is_packed,
    packedBy: row.packed_by,
    packedAt: row.packed_at,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * ORDERING RULE: position ascending, then created_at ascending
 * (mirrors trip_packing_trip_position_idx).
 */
export function sortPackingItems(items: TripPackingItem[]): TripPackingItem[] {
  return [...items].sort((a, b) => {
    if (a.position !== b.position) {
      return a.position - b.position;
    }
    if (a.createdAt !== b.createdAt) {
      return a.createdAt < b.createdAt ? -1 : 1;
    }
    return 0;
  });
}
