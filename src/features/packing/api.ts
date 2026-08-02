import { requireSupabaseClient } from "@/services/supabase";
import type { Database, TripPackingCategory, TripPackingScope } from "@/types/database";
import type { TripPackingItem } from "@/types/models";
import { isValidUuid } from "@/utils/routeParams";
import { mapPackingError, getPackingErrorDebug } from "./errors";
import { mapPackingItemRow, sortPackingItems } from "./mappers";

type PackingUpdate = Database["public"]["Tables"]["trip_packing_items"]["Update"];

const SELECT = `
  id, trip_id, created_by, title, category, scope, assigned_to, quantity, notes,
  is_packed, packed_by, packed_at, position, created_at, updated_at
`;

export interface CreatePackingItemInput {
  tripId: string;
  title: string;
  category: TripPackingCategory;
  scope: TripPackingScope;
  assignedTo?: string | null;
  quantity?: number;
  notes?: string | null;
}

export interface UpdatePackingItemInput {
  tripId: string;
  itemId: string;
  title?: string;
  category?: TripPackingCategory;
  scope?: TripPackingScope;
  assignedTo?: string | null;
  quantity?: number;
  notes?: string | null;
}

function assertUuid(value: string | undefined | null, label: string): string {
  if (!isValidUuid(value)) {
    throw new Error(`${label} is required.`);
  }
  return value.trim();
}

function logError(context: string, error: unknown): void {
  if (__DEV__) {
    console.warn(`[packing:${context}]`, getPackingErrorDebug(error));
  }
}

export async function getTripPackingItems(tripId: string): Promise<TripPackingItem[]> {
  const resolved = assertUuid(tripId, "Trip id");
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from("trip_packing_items")
    .select(SELECT)
    .eq("trip_id", resolved)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    logError("getTripPackingItems", error);
    throw mapPackingError(error);
  }
  return sortPackingItems((data ?? []).map(mapPackingItemRow));
}

export async function createPackingItem(
  input: CreatePackingItemInput,
): Promise<TripPackingItem> {
  const tripId = assertUuid(input.tripId, "Trip id");
  if (input.assignedTo) {
    assertUuid(input.assignedTo, "Assignee id");
  }
  const client = requireSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  if (authError) {
    throw mapPackingError(authError);
  }
  if (!user) {
    throw new Error("Sign in to add a packing item.");
  }

  const { data: existing } = await client
    .from("trip_packing_items")
    .select("position")
    .eq("trip_id", tripId)
    .order("position", { ascending: false })
    .limit(1);
  const position =
    typeof existing?.[0]?.position === "number" ? existing[0].position + 1 : 0;

  const { data, error } = await client
    .from("trip_packing_items")
    .insert({
      trip_id: tripId,
      created_by: user.id,
      title: input.title.trim(),
      category: input.category,
      scope: input.scope,
      assigned_to:
        input.scope === "personal"
          ? input.assignedTo?.trim() || user.id
          : input.assignedTo?.trim() || null,
      quantity: input.quantity ?? 1,
      notes: input.notes?.trim() || null,
      position,
    })
    .select(SELECT)
    .single();
  if (error) {
    logError("createPackingItem", error);
    throw mapPackingError(error);
  }
  return mapPackingItemRow(data);
}

export async function updatePackingItem(
  input: UpdatePackingItemInput,
): Promise<TripPackingItem> {
  const tripId = assertUuid(input.tripId, "Trip id");
  const itemId = assertUuid(input.itemId, "Item id");
  const patch: PackingUpdate = {};
  if (input.title !== undefined) {
    patch.title = input.title.trim();
  }
  if (input.category !== undefined) {
    patch.category = input.category;
  }
  if (input.scope !== undefined) {
    patch.scope = input.scope;
  }
  if (input.assignedTo !== undefined) {
    patch.assigned_to = input.assignedTo?.trim() || null;
  }
  if (input.quantity !== undefined) {
    patch.quantity = input.quantity;
  }
  if (input.notes !== undefined) {
    patch.notes = input.notes?.trim() || null;
  }
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from("trip_packing_items")
    .update(patch)
    .eq("trip_id", tripId)
    .eq("id", itemId)
    .select(SELECT)
    .single();
  if (error) {
    logError("updatePackingItem", error);
    throw mapPackingError(error);
  }
  return mapPackingItemRow(data);
}

export async function deletePackingItem(tripId: string, itemId: string): Promise<void> {
  const resolvedTrip = assertUuid(tripId, "Trip id");
  const resolvedItem = assertUuid(itemId, "Item id");
  const client = requireSupabaseClient();
  const { error } = await client
    .from("trip_packing_items")
    .delete()
    .eq("trip_id", resolvedTrip)
    .eq("id", resolvedItem);
  if (error) {
    logError("deletePackingItem", error);
    throw mapPackingError(error);
  }
}

export async function togglePackingItem(
  tripId: string,
  itemId: string,
): Promise<TripPackingItem> {
  assertUuid(tripId, "Trip id");
  const resolvedItem = assertUuid(itemId, "Item id");
  const client = requireSupabaseClient();
  const { data, error } = await client.rpc("toggle_trip_packing_item", {
    p_item_id: resolvedItem,
  });
  if (error) {
    logError("togglePackingItem", error);
    throw mapPackingError(error);
  }
  return mapPackingItemRow(data);
}

export async function reorderPackingItems(
  tripId: string,
  itemIds: string[],
): Promise<void> {
  const resolvedTrip = assertUuid(tripId, "Trip id");
  if (!itemIds.length) {
    throw new Error("Item list is required.");
  }
  for (const id of itemIds) {
    assertUuid(id, "Item id");
  }
  const client = requireSupabaseClient();
  const { error } = await client.rpc("reorder_trip_packing_items", {
    p_trip_id: resolvedTrip,
    p_item_ids: itemIds,
  });
  if (error) {
    logError("reorderPackingItems", error);
    throw mapPackingError(error);
  }
}
