import type { TripIdeaRow } from "@/types/database";
import type { TripIdea } from "@/types/models";

export type TripIdeaRowWithVotes = TripIdeaRow & {
  trip_idea_votes: { user_id: string }[] | null;
};

export function mapIdeaRow(
  row: TripIdeaRowWithVotes,
  currentUserId: string | null | undefined,
): TripIdea {
  const votes = row.trip_idea_votes ?? [];
  return {
    id: row.id,
    tripId: row.trip_id,
    destinationId: row.destination_id,
    createdBy: row.created_by,
    title: row.title,
    description: row.description,
    category: row.category,
    status: row.status,
    locationName: row.location_name,
    address: row.address,
    geoapifyPlaceId: row.geoapify_place_id,
    latitude: row.latitude,
    longitude: row.longitude,
    promotedActivityId: row.promoted_activity_id,
    voteCount: votes.length,
    userHasVoted: currentUserId != null && votes.some((vote) => vote.user_id === currentUserId),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
