import { requireSupabaseClient } from "@/services/supabase";
import type { Database, TripActivityCategory } from "@/types/database";
import type { TripActivity, TripDayWithActivities } from "@/types/models";
import { isValidUuid } from "@/utils/routeParams";
import { formatTimeHHmm } from "@/utils/time";
import { mapItineraryError, getItineraryErrorDebug } from "./errors";
import {
  mapActivityRow,
  mapDayRow,
  sortActivities,
  type TripActivityRowWithDestination,
  type TripDayRowWithDestination,
} from "./mappers";

type TripActivityUpdate = Database["public"]["Tables"]["trip_activities"]["Update"];

const DAY_SELECT = `
  id,
  trip_id,
  date,
  label,
  destination_id,
  created_at,
  updated_at,
  trip_destinations (
    city
  )
`;

const ACTIVITY_SELECT = `
  id,
  trip_id,
  trip_day_id,
  destination_id,
  created_by,
  title,
  description,
  category,
  is_all_day,
  start_time,
  end_time,
  location_name,
  address,
  geoapify_place_id,
  latitude,
  longitude,
  notes,
  position,
  created_at,
  updated_at,
  trip_destinations (
    city
  )
`;

export interface CreateTripActivityInput {
  tripId: string;
  tripDayId: string;
  destinationId?: string | null;
  title: string;
  description?: string | null;
  category: TripActivityCategory;
  isAllDay: boolean;
  startTime?: string | null;
  endTime?: string | null;
  locationName?: string | null;
  address?: string | null;
  geoapifyPlaceId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
}

export interface UpdateTripActivityInput {
  tripId: string;
  activityId: string;
  tripDayId?: string;
  destinationId?: string | null;
  title?: string;
  description?: string | null;
  category?: TripActivityCategory;
  isAllDay?: boolean;
  startTime?: string | null;
  endTime?: string | null;
  locationName?: string | null;
  address?: string | null;
  geoapifyPlaceId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
}

export interface DeleteTripActivityInput {
  tripId: string;
  activityId: string;
}

export interface ReorderTripActivitiesInput {
  tripId: string;
  tripDayId: string;
  activityIds: string[];
}

function assertUuid(value: string | undefined | null, label: string): string {
  if (!isValidUuid(value)) {
    throw new Error(`${label} is required.`);
  }
  return value.trim();
}

function toDbTime(value: string | null | undefined): string | null {
  if (value == null || value === "") {
    return null;
  }
  return formatTimeHHmm(value);
}

function logItineraryError(context: string, error: unknown): void {
  if (!__DEV__) {
    return;
  }
  console.warn(`[itinerary:${context}]`, getItineraryErrorDebug(error));
}

/**
 * Loads trip days (with destination city) and assembles sorted activities per day.
 *
 * ORDERING RULE: all-day first, then start_time ascending (nulls last among timed),
 * then position ascending, then created_at ascending.
 */
export async function getTripDaysWithActivities(
  tripId: string,
): Promise<TripDayWithActivities[]> {
  const resolvedTripId = assertUuid(tripId, "Trip id");
  const client = requireSupabaseClient();

  const [daysResult, activitiesResult] = await Promise.all([
    client
      .from("trip_days")
      .select(DAY_SELECT)
      .eq("trip_id", resolvedTripId)
      .order("date", { ascending: true }),
    client
      .from("trip_activities")
      .select(ACTIVITY_SELECT)
      .eq("trip_id", resolvedTripId),
  ]);

  if (daysResult.error) {
    logItineraryError("getTripDaysWithActivities.days", daysResult.error);
    throw mapItineraryError(daysResult.error);
  }
  if (activitiesResult.error) {
    logItineraryError("getTripDaysWithActivities.activities", activitiesResult.error);
    throw mapItineraryError(activitiesResult.error);
  }

  const activitiesByDay = new Map<string, TripActivity[]>();
  for (const row of (activitiesResult.data ?? []) as TripActivityRowWithDestination[]) {
    const activity = mapActivityRow(row);
    const list = activitiesByDay.get(activity.tripDayId) ?? [];
    list.push(activity);
    activitiesByDay.set(activity.tripDayId, list);
  }

  return ((daysResult.data ?? []) as TripDayRowWithDestination[]).map((dayRow) => {
    const day = mapDayRow(dayRow);
    return {
      ...day,
      activities: sortActivities(activitiesByDay.get(day.id) ?? []),
    };
  });
}

export async function getTripActivityById(
  tripId: string,
  activityId: string,
): Promise<TripActivity | null> {
  const resolvedTripId = assertUuid(tripId, "Trip id");
  const resolvedActivityId = assertUuid(activityId, "Activity id");
  const client = requireSupabaseClient();

  const { data, error } = await client
    .from("trip_activities")
    .select(ACTIVITY_SELECT)
    .eq("trip_id", resolvedTripId)
    .eq("id", resolvedActivityId)
    .maybeSingle();

  if (error) {
    logItineraryError("getTripActivityById", error);
    throw mapItineraryError(error);
  }

  if (!data) {
    return null;
  }

  return mapActivityRow(data as TripActivityRowWithDestination);
}

export async function getTripActivities(tripId: string): Promise<TripActivity[]> {
  const resolvedTripId = assertUuid(tripId, "Trip id");
  const client = requireSupabaseClient();

  const { data, error } = await client
    .from("trip_activities")
    .select(ACTIVITY_SELECT)
    .eq("trip_id", resolvedTripId);

  if (error) {
    logItineraryError("getTripActivities", error);
    throw mapItineraryError(error);
  }

  return sortActivities(
    ((data ?? []) as TripActivityRowWithDestination[]).map((row) => mapActivityRow(row)),
  );
}

async function nextPositionForDay(tripDayId: string): Promise<number> {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from("trip_activities")
    .select("position")
    .eq("trip_day_id", tripDayId)
    .order("position", { ascending: false })
    .limit(1);

  if (error) {
    logItineraryError("nextPositionForDay", error);
    throw mapItineraryError(error);
  }

  const top = data?.[0]?.position;
  return typeof top === "number" ? top + 1 : 0;
}

export async function createTripActivity(
  input: CreateTripActivityInput,
): Promise<TripActivity> {
  const tripId = assertUuid(input.tripId, "Trip id");
  const tripDayId = assertUuid(input.tripDayId, "Trip day id");
  if (input.destinationId != null && input.destinationId !== "") {
    assertUuid(input.destinationId, "Destination id");
  }

  const client = requireSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();

  if (authError) {
    logItineraryError("createTripActivity.auth", authError);
    throw mapItineraryError(authError);
  }
  if (!user) {
    throw new Error("Sign in to add an activity.");
  }

  const isAllDay = input.isAllDay;
  const position = await nextPositionForDay(tripDayId);

  const { data, error } = await client
    .from("trip_activities")
    .insert({
      trip_id: tripId,
      trip_day_id: tripDayId,
      destination_id: input.destinationId?.trim() || null,
      created_by: user.id,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      category: input.category,
      is_all_day: isAllDay,
      start_time: isAllDay ? null : toDbTime(input.startTime),
      end_time: isAllDay ? null : toDbTime(input.endTime),
      location_name: input.locationName?.trim() || null,
      address: input.address?.trim() || null,
      geoapify_place_id: input.geoapifyPlaceId?.trim() || null,
      latitude:
        input.latitude == null || input.longitude == null ? null : input.latitude,
      longitude:
        input.latitude == null || input.longitude == null ? null : input.longitude,
      notes: input.notes?.trim() || null,
      position,
    })
    .select(ACTIVITY_SELECT)
    .single();

  if (error) {
    logItineraryError("createTripActivity", error);
    throw mapItineraryError(error);
  }

  return mapActivityRow(data as TripActivityRowWithDestination);
}

export async function updateTripActivity(
  input: UpdateTripActivityInput,
): Promise<TripActivity> {
  const tripId = assertUuid(input.tripId, "Trip id");
  const activityId = assertUuid(input.activityId, "Activity id");
  if (input.tripDayId != null) {
    assertUuid(input.tripDayId, "Trip day id");
  }
  if (input.destinationId != null && input.destinationId !== "") {
    assertUuid(input.destinationId, "Destination id");
  }

  const patch: TripActivityUpdate = {};
  if (input.tripDayId !== undefined) {
    patch.trip_day_id = input.tripDayId;
  }
  if (input.destinationId !== undefined) {
    patch.destination_id = input.destinationId?.trim() || null;
  }
  if (input.title !== undefined) {
    patch.title = input.title.trim();
  }
  if (input.description !== undefined) {
    patch.description = input.description?.trim() || null;
  }
  if (input.category !== undefined) {
    patch.category = input.category;
  }
  if (input.isAllDay !== undefined) {
    patch.is_all_day = input.isAllDay;
  }
  if (input.locationName !== undefined) {
    patch.location_name = input.locationName?.trim() || null;
  }
  if (input.address !== undefined) {
    patch.address = input.address?.trim() || null;
  }
  if (input.geoapifyPlaceId !== undefined) {
    patch.geoapify_place_id = input.geoapifyPlaceId?.trim() || null;
  }
  if (input.latitude !== undefined || input.longitude !== undefined) {
    const nextLat = input.latitude !== undefined ? input.latitude : null;
    const nextLng = input.longitude !== undefined ? input.longitude : null;
    if (input.latitude !== undefined && input.longitude !== undefined) {
      if (input.latitude == null || input.longitude == null) {
        patch.latitude = null;
        patch.longitude = null;
      } else {
        patch.latitude = input.latitude;
        patch.longitude = input.longitude;
      }
    } else {
      // Keep pair consistency: clearing one clears both when only one is provided as null.
      patch.latitude = nextLat;
      patch.longitude = nextLng;
      if (patch.latitude == null || patch.longitude == null) {
        patch.latitude = null;
        patch.longitude = null;
        patch.geoapify_place_id = patch.geoapify_place_id ?? null;
      }
    }
  }
  if (input.notes !== undefined) {
    patch.notes = input.notes?.trim() || null;
  }

  const isAllDay = input.isAllDay === true;
  if (isAllDay) {
    patch.start_time = null;
    patch.end_time = null;
  } else {
    if (input.startTime !== undefined) {
      patch.start_time = toDbTime(input.startTime);
    }
    if (input.endTime !== undefined) {
      patch.end_time = toDbTime(input.endTime);
    }
  }

  const client = requireSupabaseClient();
  const { data, error } = await client
    .from("trip_activities")
    .update(patch)
    .eq("trip_id", tripId)
    .eq("id", activityId)
    .select(ACTIVITY_SELECT)
    .single();

  if (error) {
    logItineraryError("updateTripActivity", error);
    throw mapItineraryError(error);
  }

  return mapActivityRow(data as TripActivityRowWithDestination);
}

export async function deleteTripActivity(input: DeleteTripActivityInput): Promise<void> {
  const tripId = assertUuid(input.tripId, "Trip id");
  const activityId = assertUuid(input.activityId, "Activity id");
  const client = requireSupabaseClient();

  const { error } = await client
    .from("trip_activities")
    .delete()
    .eq("trip_id", tripId)
    .eq("id", activityId);

  if (error) {
    logItineraryError("deleteTripActivity", error);
    throw mapItineraryError(error);
  }
}

export async function reorderTripActivities(
  input: ReorderTripActivitiesInput,
): Promise<void> {
  const tripId = assertUuid(input.tripId, "Trip id");
  const tripDayId = assertUuid(input.tripDayId, "Trip day id");

  if (!Array.isArray(input.activityIds) || input.activityIds.length === 0) {
    throw new Error("Activity list is required.");
  }
  for (const id of input.activityIds) {
    assertUuid(id, "Activity id");
  }

  const client = requireSupabaseClient();
  const { error } = await client.rpc("reorder_trip_activities", {
    p_trip_id: tripId,
    p_trip_day_id: tripDayId,
    p_activity_ids: input.activityIds.map((id) => id.trim()),
  });

  if (error) {
    logItineraryError("reorderTripActivities", error);
    throw mapItineraryError(error);
  }
}
