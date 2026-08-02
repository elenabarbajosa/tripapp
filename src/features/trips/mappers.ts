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

export type TripMemberRowWithProfile = TripMemberRow & {
  profiles: ProfileRow | null;
};

export type TripWithRelations = TripRow & {
  trip_destinations: TripDestinationRow[] | null;
  trip_members: TripMemberRowWithProfile[] | null;
};

export type TripMemberRpcRow = {
  member_id: string;
  trip_id: string;
  user_id: string;
  role: TripMemberRole;
  status: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  preferred_currency: string;
  member_created_at: string;
  member_updated_at: string;
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

export function mapTripMember(row: TripMemberRowWithProfile): TripMember | null {
  if (!row.profiles) {
    return null;
  }

  return {
    id: row.id,
    role: row.role,
    profile: mapProfileRow(row.profiles),
  };
}

export function mapTripMembersFromRpc(rows: TripMemberRpcRow[]): TripMember[] {
  return rows
    .filter((row) => row.status === "accepted")
    .map((row) => ({
      id: row.member_id,
      role: row.role,
      profile: {
        id: row.user_id,
        displayName:
          row.display_name?.trim() || row.email?.split("@")[0] || "Traveller",
        email: row.email ?? "",
        avatarUrl: row.avatar_url,
        preferredCurrency: row.preferred_currency || "EUR",
      },
    }));
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
