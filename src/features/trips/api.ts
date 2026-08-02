import { requireSupabaseClient } from "@/services/supabase";
import type { Json } from "@/types/database";
import type { TripSummary } from "@/types/models";
import { mapTripSummary, type TripWithRelations } from "./mappers";

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
    updated_at,
    profiles (
      id,
      display_name,
      email,
      avatar_url,
      preferred_currency,
      created_at,
      updated_at
    )
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

export async function listMyTrips(): Promise<TripSummary[]> {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from("trips")
    .select(TRIP_SELECT)
    .order("start_date", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as TripWithRelations[]).map((row) => mapTripSummary(row));
}

export async function getTripById(tripId: string): Promise<TripSummary | null> {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from("trips")
    .select(TRIP_SELECT)
    .eq("id", tripId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapTripSummary(data as TripWithRelations);
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
    throw error;
  }

  if (!data) {
    throw new Error("Trip was created but no id was returned.");
  }

  return data;
}

export async function deleteTrip(tripId: string): Promise<void> {
  const client = requireSupabaseClient();
  const { error } = await client.from("trips").delete().eq("id", tripId);
  if (error) {
    throw error;
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
