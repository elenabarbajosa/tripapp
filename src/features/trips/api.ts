import { requireSupabaseClient } from "@/services/supabase";
import type { Json, TripMemberRole } from "@/types/database";
import type { TripMember, TripSummary } from "@/types/models";
import {
  mapTripSummary,
  mapTripMembersFromRpc,
  type TripMemberRpcRow,
  type TripWithRelations,
} from "./mappers";
import { mapTripQueryError } from "./errors";
import { isValidUuid } from "@/utils/routeParams";

/** Trip + destinations + members without nested profiles (avoids RLS recursion). */
const TRIP_SELECT = `
  id,
  name,
  cover_image_url,
  start_date,
  end_date,
  currency,
  home_currency,
  created_by,
  created_at,
  updated_at,
  trip_destinations (
    id,
    trip_id,
    city,
    country,
    country_code,
    currency_code,
    arrival_date,
    departure_date,
    latitude,
    longitude,
    display_order,
    created_at,
    updated_at
  ),
  trip_members (
    id,
    trip_id,
    user_id,
    role,
    status,
    created_at,
    updated_at
  )
`;

export interface CreateTripDestinationInput {
  city: string;
  country: string;
  countryCode: string;
  currencyCode: string;
  arrivalDate: string;
  departureDate: string;
  displayOrder: number;
}

export interface CreateTripInput {
  name: string;
  startDate: string;
  endDate: string;
  homeCurrency: string;
  coverImageUrl?: string | null;
  destinations: CreateTripDestinationInput[];
}

type TripMemberPlainRow = {
  id: string;
  trip_id: string;
  user_id: string;
  role: TripMemberRole;
  status: string;
  created_at: string;
  updated_at: string;
};

type TripRowPlain = Omit<TripWithRelations, "trip_members"> & {
  trip_members: TripMemberPlainRow[] | null;
};

type ProfileLiteRow = {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  preferred_currency: string;
  created_at: string;
  updated_at: string;
};

async function fetchProfilesByIds(userIds: string[]): Promise<Map<string, ProfileLiteRow>> {
  const unique = [...new Set(userIds.filter(Boolean))];
  const map = new Map<string, ProfileLiteRow>();
  if (unique.length === 0) {
    return map;
  }

  const client = requireSupabaseClient();
  const { data, error } = await client
    .from("profiles")
    .select("id, display_name, email, avatar_url, preferred_currency, created_at, updated_at")
    .in("id", unique);

  if (error) {
    throw mapTripQueryError(error);
  }

  for (const row of data ?? []) {
    map.set(row.id, row);
  }
  return map;
}

function attachProfiles(
  row: TripRowPlain,
  profiles: Map<string, ProfileLiteRow>,
): TripWithRelations {
  return {
    ...row,
    trip_members: (row.trip_members ?? []).map((member) => ({
      ...member,
      status: member.status === "left" ? "left" : "accepted",
      profiles: profiles.get(member.user_id) ?? null,
    })),
  };
}

async function loadTripMembersViaRpc(tripId: string): Promise<TripMember[]> {
  const client = requireSupabaseClient();
  const { data, error } = await client.rpc("get_trip_members", {
    p_trip_id: tripId,
  });

  if (error) {
    // Fallback path for projects that have not applied 20260802040000 yet:
    // load members from the trip row + separate profile query.
    if (
      typeof error.message === "string" &&
      (error.message.includes("Could not find the function") ||
        error.message.includes("function public.get_trip_members") ||
        error.code === "PGRST202")
    ) {
      return [];
    }
    throw mapTripQueryError(error);
  }

  return mapTripMembersFromRpc((data ?? []) as TripMemberRpcRow[]);
}

export async function listMyTrips(): Promise<TripSummary[]> {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from("trips")
    .select(TRIP_SELECT)
    .order("start_date", { ascending: true });

  if (error) {
    throw mapTripQueryError(error);
  }

  const rows = (data ?? []) as TripRowPlain[];
  const userIds = rows.flatMap((row) => (row.trip_members ?? []).map((m) => m.user_id));
  const profiles = await fetchProfilesByIds(userIds);

  return rows.map((row) => mapTripSummary(attachProfiles(row, profiles)));
}

export async function getTripById(tripId: string): Promise<TripSummary | null> {
  if (!isValidUuid(tripId)) {
    throw new Error("Trip id is required.");
  }

  const client = requireSupabaseClient();
  const { data, error } = await client
    .from("trips")
    .select(TRIP_SELECT)
    .eq("id", tripId.trim())
    .maybeSingle();

  if (error) {
    if (__DEV__) {
      console.warn("[getTripById] Supabase error", {
        tripId,
        message: "message" in error ? error.message : undefined,
        code: "code" in error ? error.code : undefined,
        details: "details" in error ? error.details : undefined,
        hint: "hint" in error ? error.hint : undefined,
      });
    }
    throw mapTripQueryError(error);
  }

  if (!data) {
    return null;
  }

  const row = data as TripRowPlain;

  // Prefer the security-definer RPC (no nested profile embed / no recursion).
  const rpcMembers = await loadTripMembersViaRpc(tripId);
  if (rpcMembers.length > 0) {
    const base = mapTripSummary(attachProfiles(row, new Map()));
    return {
      ...base,
      members: rpcMembers,
      travellerCount: rpcMembers.length,
    };
  }

  // Fallback when RPC is missing or returned empty: separate profile lookup.
  const profiles = await fetchProfilesByIds((row.trip_members ?? []).map((m) => m.user_id));
  return mapTripSummary(attachProfiles(row, profiles));
}

export async function createTrip(input: CreateTripInput): Promise<string> {
  const client = requireSupabaseClient();
  const destinationsPayload: Json = input.destinations.map((destination) => ({
    city: destination.city,
    country: destination.country,
    country_code: destination.countryCode,
    currency_code: destination.currencyCode,
    arrival_date: destination.arrivalDate,
    departure_date: destination.departureDate,
    display_order: destination.displayOrder,
  }));

  const { data, error } = await client.rpc("create_trip", {
    p_name: input.name,
    p_start_date: input.startDate,
    p_end_date: input.endDate,
    p_home_currency: input.homeCurrency,
    p_cover_image_url: input.coverImageUrl?.trim() || null,
    p_destinations: destinationsPayload,
  });

  if (error) {
    throw mapTripQueryError(error);
  }

  if (!data || typeof data !== "string") {
    throw new Error("Trip was created but no id was returned.");
  }

  return data;
}

export async function deleteTrip(tripId: string): Promise<void> {
  const client = requireSupabaseClient();
  const { error } = await client.from("trips").delete().eq("id", tripId);
  if (error) {
    throw mapTripQueryError(error);
  }
}

export function partitionTrips(trips: TripSummary[]): {
  upcoming: TripSummary[];
  previous: TripSummary[];
} {
  const upcoming = trips.filter((trip) => trip.phase === "upcoming" || trip.phase === "active");
  const previous = trips.filter((trip) => trip.phase === "completed");
  return { upcoming, previous };
}
