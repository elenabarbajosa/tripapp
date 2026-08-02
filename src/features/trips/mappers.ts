import { mapProfileRow } from "@/services/supabase/profiles";
import type {
  ProfileRow,
  TripDestinationRow,
  TripMemberRole,
  TripMemberRow,
  TripRow,
} from "@/types/database";
import type { TripDestination, TripMember, TripSummary } from "@/types/models";
import { resolveTripPhase } from "@/utils/date";

export type TripMemberWithProfile = TripMemberRow & {
  profiles: ProfileRow | null;
};

export type TripWithRelations = TripRow & {
  trip_destinations: TripDestinationRow[] | null;
  trip_members: TripMemberWithProfile[] | null;
};

export function mapTripDestination(row: TripDestinationRow): TripDestination {
  return {
    id: row.id,
    city: row.city,
    country: row.country,
    countryCode: row.country_code,
    currencyCode: row.currency_code,
    arrivalDate: row.arrival_date,
    departureDate: row.departure_date,
    latitude: row.latitude,
    longitude: row.longitude,
    displayOrder: row.display_order,
  };
}

export function mapTripMember(row: TripMemberWithProfile): TripMember | null {
  if (!row.profiles) {
    return null;
  }

  return {
    id: row.id,
    role: row.role,
    profile: mapProfileRow(row.profiles),
  };
}

export function mapTripSummary(row: TripWithRelations, today?: string): TripSummary {
  const destinations = (row.trip_destinations ?? [])
    .map(mapTripDestination)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const members = (row.trip_members ?? [])
    .filter((member) => member.status === "accepted")
    .map(mapTripMember)
    .filter((member): member is TripMember => member !== null);

  return {
    id: row.id,
    name: row.name,
    coverImageUrl: row.cover_image_url,
    startDate: row.start_date,
    endDate: row.end_date,
    destinations,
    members,
    travellerCount: members.length,
    phase: resolveTripPhase(row.start_date, row.end_date, today),
    currency: row.currency,
    homeCurrency: row.home_currency,
  };
}

export function currentUserRole(
  trip: TripSummary,
  userId: string | null | undefined,
): TripMemberRole | null {
  if (!userId) {
    return null;
  }
  return trip.members.find((member) => member.profile.id === userId)?.role ?? null;
}
