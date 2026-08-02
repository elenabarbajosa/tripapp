import { requireSupabaseClient } from "@/services/supabase";
import type { Database, TripIdeaCategory } from "@/types/database";
import type { TripIdea } from "@/types/models";
import { isValidUuid } from "@/utils/routeParams";
import { mapIdeaError, getIdeaErrorDebug } from "./errors";
import { mapIdeaRow, type TripIdeaRowWithVotes } from "./mappers";

type TripIdeaUpdate = Database["public"]["Tables"]["trip_ideas"]["Update"];

const IDEA_SELECT = `
  id,
  trip_id,
  destination_id,
  created_by,
  title,
  description,
  category,
  status,
  location_name,
  address,
  geoapify_place_id,
  latitude,
  longitude,
  promoted_activity_id,
  created_at,
  updated_at,
  trip_idea_votes (
    user_id
  )
`;

export interface CreateTripIdeaInput {
  tripId: string;
  destinationId?: string | null;
  title: string;
  description?: string | null;
  category: TripIdeaCategory;
  locationName?: string | null;
  address?: string | null;
  geoapifyPlaceId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface UpdateTripIdeaInput extends CreateTripIdeaInput {
  ideaId: string;
}

export interface DeleteTripIdeaInput {
  tripId: string;
  ideaId: string;
}

export interface VoteOnIdeaInput {
  tripId: string;
  ideaId: string;
}

export interface PromoteTripIdeaInput {
  tripId: string;
  ideaId: string;
  tripDayId: string;
  destinationId?: string | null;
  isAllDay: boolean;
  startTime?: string | null;
  endTime?: string | null;
  notes?: string | null;
}

function assertUuid(value: string | undefined | null, label: string): string {
  if (!isValidUuid(value)) {
    throw new Error(`${label} is required.`);
  }
  return value.trim();
}

function logIdeaError(context: string, error: unknown): void {
  if (!__DEV__) {
    return;
  }
  console.warn(`[ideas:${context}]`, getIdeaErrorDebug(error));
}

async function requireCurrentUserId(): Promise<string> {
  const client = requireSupabaseClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error) {
    throw mapIdeaError(error);
  }
  if (!user) {
    throw new Error("Sign in to manage trip ideas.");
  }
  return user.id;
}

export async function getTripIdeas(
  tripId: string,
  currentUserId: string | null | undefined,
): Promise<TripIdea[]> {
  const resolvedTripId = assertUuid(tripId, "Trip id");
  const client = requireSupabaseClient();

  const { data, error } = await client
    .from("trip_ideas")
    .select(IDEA_SELECT)
    .eq("trip_id", resolvedTripId);

  if (error) {
    logIdeaError("getTripIdeas", error);
    throw mapIdeaError(error);
  }

  return ((data ?? []) as TripIdeaRowWithVotes[]).map((row) =>
    mapIdeaRow(row, currentUserId),
  );
}

export async function getTripIdeaById(
  tripId: string,
  ideaId: string,
  currentUserId: string | null | undefined,
): Promise<TripIdea | null> {
  const resolvedTripId = assertUuid(tripId, "Trip id");
  const resolvedIdeaId = assertUuid(ideaId, "Idea id");
  const client = requireSupabaseClient();

  const { data, error } = await client
    .from("trip_ideas")
    .select(IDEA_SELECT)
    .eq("trip_id", resolvedTripId)
    .eq("id", resolvedIdeaId)
    .maybeSingle();

  if (error) {
    logIdeaError("getTripIdeaById", error);
    throw mapIdeaError(error);
  }

  if (!data) {
    return null;
  }

  return mapIdeaRow(data as TripIdeaRowWithVotes, currentUserId);
}

export async function createTripIdea(input: CreateTripIdeaInput): Promise<TripIdea> {
  const tripId = assertUuid(input.tripId, "Trip id");
  if (input.destinationId != null && input.destinationId !== "") {
    assertUuid(input.destinationId, "Destination id");
  }

  const userId = await requireCurrentUserId();
  const client = requireSupabaseClient();

  const { data, error } = await client
    .from("trip_ideas")
    .insert({
      trip_id: tripId,
      destination_id: input.destinationId?.trim() || null,
      created_by: userId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      category: input.category,
      location_name: input.locationName?.trim() || null,
      address: input.address?.trim() || null,
      geoapify_place_id: input.geoapifyPlaceId?.trim() || null,
      latitude:
        input.latitude == null || input.longitude == null ? null : input.latitude,
      longitude:
        input.latitude == null || input.longitude == null ? null : input.longitude,
    })
    .select(IDEA_SELECT)
    .single();

  if (error) {
    logIdeaError("createTripIdea", error);
    throw mapIdeaError(error);
  }

  return mapIdeaRow(data as TripIdeaRowWithVotes, userId);
}

export async function updateTripIdea(
  input: UpdateTripIdeaInput,
  currentUserId: string | null | undefined,
): Promise<TripIdea> {
  const tripId = assertUuid(input.tripId, "Trip id");
  const ideaId = assertUuid(input.ideaId, "Idea id");
  if (input.destinationId != null && input.destinationId !== "") {
    assertUuid(input.destinationId, "Destination id");
  }

  const patch: TripIdeaUpdate = {
    destination_id: input.destinationId?.trim() || null,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    category: input.category,
    location_name: input.locationName?.trim() || null,
    address: input.address?.trim() || null,
    geoapify_place_id: input.geoapifyPlaceId?.trim() || null,
    latitude: input.latitude == null || input.longitude == null ? null : input.latitude,
    longitude: input.latitude == null || input.longitude == null ? null : input.longitude,
  };

  const client = requireSupabaseClient();
  const { data, error } = await client
    .from("trip_ideas")
    .update(patch)
    .eq("trip_id", tripId)
    .eq("id", ideaId)
    .select(IDEA_SELECT)
    .single();

  if (error) {
    logIdeaError("updateTripIdea", error);
    throw mapIdeaError(error);
  }

  return mapIdeaRow(data as TripIdeaRowWithVotes, currentUserId);
}

export async function deleteTripIdea(input: DeleteTripIdeaInput): Promise<void> {
  const tripId = assertUuid(input.tripId, "Trip id");
  const ideaId = assertUuid(input.ideaId, "Idea id");
  const client = requireSupabaseClient();

  const { error } = await client
    .from("trip_ideas")
    .delete()
    .eq("trip_id", tripId)
    .eq("id", ideaId);

  if (error) {
    logIdeaError("deleteTripIdea", error);
    throw mapIdeaError(error);
  }
}

export async function archiveTripIdea(input: DeleteTripIdeaInput): Promise<void> {
  const tripId = assertUuid(input.tripId, "Trip id");
  const ideaId = assertUuid(input.ideaId, "Idea id");
  const client = requireSupabaseClient();

  const { error } = await client
    .from("trip_ideas")
    .update({ status: "archived" })
    .eq("trip_id", tripId)
    .eq("id", ideaId);

  if (error) {
    logIdeaError("archiveTripIdea", error);
    throw mapIdeaError(error);
  }
}

export async function voteForIdea(input: VoteOnIdeaInput): Promise<void> {
  assertUuid(input.tripId, "Trip id");
  const ideaId = assertUuid(input.ideaId, "Idea id");
  const userId = await requireCurrentUserId();
  const client = requireSupabaseClient();

  const { error } = await client
    .from("trip_idea_votes")
    .insert({ idea_id: ideaId, user_id: userId });

  if (error) {
    logIdeaError("voteForIdea", error);
    throw mapIdeaError(error);
  }
}

export async function unvoteIdea(input: VoteOnIdeaInput): Promise<void> {
  assertUuid(input.tripId, "Trip id");
  const ideaId = assertUuid(input.ideaId, "Idea id");
  const userId = await requireCurrentUserId();
  const client = requireSupabaseClient();

  const { error } = await client
    .from("trip_idea_votes")
    .delete()
    .eq("idea_id", ideaId)
    .eq("user_id", userId);

  if (error) {
    logIdeaError("unvoteIdea", error);
    throw mapIdeaError(error);
  }
}

/** Inserts a vote when absent; removes it when present. */
export async function toggleIdeaVote(
  input: VoteOnIdeaInput & { currentlyVoted: boolean },
): Promise<void> {
  if (input.currentlyVoted) {
    await unvoteIdea(input);
    return;
  }
  await voteForIdea(input);
}

export async function promoteTripIdeaToActivity(
  input: PromoteTripIdeaInput,
): Promise<string> {
  assertUuid(input.tripId, "Trip id");
  const ideaId = assertUuid(input.ideaId, "Idea id");
  const tripDayId = assertUuid(input.tripDayId, "Trip day id");
  if (input.destinationId != null && input.destinationId !== "") {
    assertUuid(input.destinationId, "Destination id");
  }

  const client = requireSupabaseClient();
  const { data, error } = await client.rpc("promote_trip_idea_to_activity", {
    p_idea_id: ideaId,
    p_trip_day_id: tripDayId,
    p_destination_id: input.destinationId?.trim() || null,
    p_is_all_day: input.isAllDay,
    p_start_time: input.isAllDay ? null : input.startTime?.trim() || null,
    p_end_time: input.isAllDay ? null : input.endTime?.trim() || null,
    p_notes: input.notes?.trim() || null,
  });

  if (error) {
    logIdeaError("promoteTripIdeaToActivity", error);
    throw mapIdeaError(error);
  }

  return data as string;
}
