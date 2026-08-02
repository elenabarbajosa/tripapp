import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGlobalSearchParams, useRouter } from "expo-router";

import { AppButton } from "@/components/ui/AppButton/AppButton";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog/ConfirmationDialog";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import { ScreenHeader } from "@/components/ui/ScreenHeader/ScreenHeader";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  useArchiveTripIdeaMutation,
  useDeleteTripIdeaMutation,
  useIdeasRealtime,
  useTripIdeasQuery,
  useUnvoteIdeaMutation,
  useVoteForIdeaMutation,
} from "@/features/ideas/hooks";
import {
  filterIdeasByCategory,
  filterIdeasByStatus,
  sortIdeas,
  type IdeaCategoryFilter,
  type IdeaSortMode,
  type IdeaStatusFilter,
} from "@/features/ideas/ranking";
import { usePreview } from "@/features/preview/PreviewProvider";
import { useTripQuery } from "@/features/trips/hooks";
import { currentUserRole } from "@/features/trips/mappers";
import {
  canArchiveIdea,
  canCreateIdea,
  canDeleteIdea,
  canEditIdea,
  canPromoteIdea,
  canVoteOnIdea,
} from "@/features/trips/permissions";
import type { TripIdea } from "@/types/models";
import {
  getTripIdeaCategoryLabel,
  TRIP_IDEA_CATEGORIES,
} from "@/utils/ideaCategory";
import { isValidUuid, resolveRouteParam } from "@/utils/routeParams";
import { styles } from "./IdeasScreen.styles";

const STATUS_FILTERS: IdeaStatusFilter[] = ["proposed", "added_to_itinerary", "archived", "all"];
const SORT_MODES: IdeaSortMode[] = ["top", "newest"];
const CATEGORY_FILTERS: IdeaCategoryFilter[] = ["all", ...TRIP_IDEA_CATEGORIES];

function statusFilterLabel(filter: IdeaStatusFilter): string {
  switch (filter) {
    case "proposed":
      return "Proposed";
    case "added_to_itinerary":
      return "Added";
    case "archived":
      return "Archived";
    case "all":
      return "All";
    default:
      return filter;
  }
}

function sortLabel(mode: IdeaSortMode): string {
  return mode === "newest" ? "Newest" : "Top voted";
}

function categoryFilterLabel(filter: IdeaCategoryFilter): string {
  return filter === "all" ? "All categories" : getTripIdeaCategoryLabel(filter);
}

export function IdeasScreen() {
  const router = useRouter();
  const params = useGlobalSearchParams<{ tripId?: string | string[] }>();
  const tripId = resolveRouteParam(params.tripId);
  const hasValidTripId = isValidUuid(tripId);

  const { user, isAuthenticated, isInitializing } = useAuth();
  const { isPreviewActive } = usePreview();
  const shouldLoad =
    !isInitializing && isAuthenticated && !isPreviewActive && hasValidTripId;

  const tripQuery = useTripQuery(tripId, shouldLoad);
  const ideasQuery = useTripIdeasQuery(tripId, user?.id, shouldLoad && Boolean(tripQuery.data));
  useIdeasRealtime(tripId, shouldLoad && Boolean(tripQuery.data));

  const trip = tripQuery.data ?? null;
  const role = trip ? currentUserRole(trip, user?.id) : null;
  const ideas = useMemo(() => ideasQuery.data ?? [], [ideasQuery.data]);

  const [filter, setFilter] = useState<IdeaStatusFilter>("proposed");
  const [categoryFilter, setCategoryFilter] = useState<IdeaCategoryFilter>("all");
  const [sortMode, setSortMode] = useState<IdeaSortMode>("top");
  const [pendingDelete, setPendingDelete] = useState<TripIdea | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const voteMutation = useVoteForIdeaMutation();
  const unvoteMutation = useUnvoteIdeaMutation();
  const deleteMutation = useDeleteTripIdeaMutation();
  const archiveMutation = useArchiveTripIdeaMutation();
  const isMutating =
    voteMutation.isPending ||
    unvoteMutation.isPending ||
    deleteMutation.isPending ||
    archiveMutation.isPending;

  const canAdd = !isPreviewActive && canCreateIdea(role);

  const sorted = useMemo(() => sortIdeas(ideas, sortMode), [ideas, sortMode]);
  const filtered = useMemo(() => {
    const byStatus = filterIdeasByStatus(sorted, filter);
    return filterIdeasByCategory(byStatus, categoryFilter);
  }, [sorted, filter, categoryFilter]);

  const onAdd = () => {
    if (!hasValidTripId || !tripId) {
      return;
    }
    router.push({ pathname: "/trips/[tripId]/ideas/new", params: { tripId } });
  };

  const onEdit = (idea: TripIdea) => {
    if (!hasValidTripId || !tripId) {
      return;
    }
    router.push({
      pathname: "/trips/[tripId]/ideas/[ideaId]/edit",
      params: { tripId, ideaId: idea.id },
    });
  };

  const onPromote = (idea: TripIdea) => {
    if (!hasValidTripId || !tripId) {
      return;
    }
    router.push({
      pathname: "/trips/[tripId]/ideas/[ideaId]/add-to-itinerary",
      params: { tripId, ideaId: idea.id },
    });
  };

  const onToggleVote = async (idea: TripIdea) => {
    if (!tripId || !canVoteOnIdea(role)) {
      return;
    }
    setActionError(null);
    try {
      if (idea.userHasVoted) {
        await unvoteMutation.mutateAsync({ tripId, ideaId: idea.id });
      } else {
        await voteMutation.mutateAsync({ tripId, ideaId: idea.id });
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to update your vote.");
    }
  };

  const onArchive = async (idea: TripIdea) => {
    if (!tripId || !canArchiveIdea(role)) {
      return;
    }
    setActionError(null);
    try {
      await archiveMutation.mutateAsync({ tripId, ideaId: idea.id });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to archive idea.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScreenHeader title="Ideas" subtitle="Propose, vote, and add to the itinerary" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!hasValidTripId && !isPreviewActive ? (
          <EmptyState
            title="Trip not found"
            body="This ideas link is missing a valid trip id."
          />
        ) : null}
        {isPreviewActive ? (
          <EmptyState title="Preview mode" body="Sign in to manage ideas for a live trip." />
        ) : null}
        {shouldLoad && (tripQuery.isLoading || ideasQuery.isLoading) ? (
          <LoadingState label="Loading ideas…" />
        ) : null}
        {shouldLoad && ideasQuery.isError ? (
          <ErrorState
            title="Could not load ideas"
            message={
              ideasQuery.error instanceof Error
                ? ideasQuery.error.message
                : "Try again in a moment."
            }
            onRetry={() => {
              void ideasQuery.refetch();
            }}
          />
        ) : null}

        {shouldLoad && trip && !ideasQuery.isError ? (
          <>
            <View style={styles.filterRow}>
              {STATUS_FILTERS.map((option) => {
                const selected = filter === option;
                return (
                  <Pressable
                    key={option}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setFilter(option)}
                    style={[styles.filterChip, selected ? styles.filterChipSelected : null]}
                  >
                    <Text
                      style={[
                        styles.filterChipLabel,
                        selected ? styles.filterChipLabelSelected : null,
                      ]}
                    >
                      {statusFilterLabel(option)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.filterRow}>
              {SORT_MODES.map((option) => {
                const selected = sortMode === option;
                return (
                  <Pressable
                    key={option}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setSortMode(option)}
                    style={[styles.filterChip, selected ? styles.filterChipSelected : null]}
                  >
                    <Text
                      style={[
                        styles.filterChipLabel,
                        selected ? styles.filterChipLabelSelected : null,
                      ]}
                    >
                      {sortLabel(option)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.filterRow}>
              {CATEGORY_FILTERS.map((option) => {
                const selected = categoryFilter === option;
                return (
                  <Pressable
                    key={option}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setCategoryFilter(option)}
                    style={[styles.filterChip, selected ? styles.filterChipSelected : null]}
                  >
                    <Text
                      style={[
                        styles.filterChipLabel,
                        selected ? styles.filterChipLabelSelected : null,
                      ]}
                    >
                      {categoryFilterLabel(option)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {actionError ? <Text style={styles.actionError}>{actionError}</Text> : null}

            {filtered.length === 0 ? (
              <EmptyState
                title="No ideas yet"
                body={canAdd ? "Propose a place or activity to get the vote started." : "No ideas match this filter."}
              />
            ) : null}

            {filtered.map((idea) => {
              const canToggleVote = canVoteOnIdea(role);
              const canEdit = canEditIdea(role, idea, user?.id);
              const canDelete = canDeleteIdea(role, idea, user?.id);
              const canArchive = canArchiveIdea(role) && idea.status !== "archived";
              const canAddToItinerary =
                canPromoteIdea(role) && idea.status === "proposed";
              return (
                <View key={idea.id} style={styles.card}>
                  <View style={styles.voteColumn}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={idea.userHasVoted ? "Remove vote" : "Vote for this idea"}
                      accessibilityState={{ selected: idea.userHasVoted, disabled: !canToggleVote }}
                      disabled={!canToggleVote || isMutating}
                      onPress={() => {
                        void onToggleVote(idea);
                      }}
                      style={[
                        styles.voteButton,
                        idea.userHasVoted ? styles.voteButtonActive : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.voteButtonMark,
                          idea.userHasVoted ? styles.voteButtonMarkActive : null,
                        ]}
                      >
                        ▲
                      </Text>
                    </Pressable>
                    <Text style={styles.voteCount}>{idea.voteCount}</Text>
                  </View>
                  <View style={styles.cardBody}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.cardTitle}>{idea.title}</Text>
                      <View style={styles.badge}>
                        <Text style={styles.badgeLabel}>
                          {getTripIdeaCategoryLabel(idea.category)}
                        </Text>
                      </View>
                      {idea.status !== "proposed" ? (
                        <View
                          style={[
                            styles.statusBadge,
                            idea.status === "archived" ? styles.archivedBadge : null,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeLabel,
                              idea.status === "archived" ? styles.archivedBadgeLabel : null,
                            ]}
                          >
                            {idea.status === "added_to_itinerary" ? "Added" : "Archived"}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    {idea.locationName ? (
                      <Text style={styles.cardMeta}>{idea.locationName}</Text>
                    ) : null}
                    {idea.description ? (
                      <Text style={styles.cardMeta}>{idea.description}</Text>
                    ) : null}
                    <View style={styles.cardActions}>
                      {canAddToItinerary ? (
                        <AppButton
                          label="Add to itinerary"
                          size="sm"
                          onPress={() => onPromote(idea)}
                          disabled={isMutating}
                        />
                      ) : null}
                      {canEdit ? (
                        <AppButton
                          label="Edit"
                          size="sm"
                          variant="secondary"
                          onPress={() => onEdit(idea)}
                          disabled={isMutating}
                        />
                      ) : null}
                      {canArchive ? (
                        <AppButton
                          label="Archive"
                          size="sm"
                          variant="ghost"
                          onPress={() => {
                            void onArchive(idea);
                          }}
                          disabled={isMutating}
                        />
                      ) : null}
                      {canDelete ? (
                        <AppButton
                          label="Delete"
                          size="sm"
                          variant="ghost"
                          onPress={() => setPendingDelete(idea)}
                          disabled={isMutating}
                        />
                      ) : null}
                    </View>
                  </View>
                </View>
              );
            })}
            <View style={styles.fabSpacer} />
          </>
        ) : null}
      </ScrollView>

      {canAdd ? (
        <View style={styles.fabContainer}>
          <AppButton label="Add idea" onPress={onAdd} disabled={isMutating} />
        </View>
      ) : null}

      <ConfirmationDialog
        visible={pendingDelete != null}
        title="Delete idea?"
        message={pendingDelete ? `Remove “${pendingDelete.title}” from the ideas list?` : ""}
        confirmLabel={deleteMutation.isPending ? "Deleting…" : "Delete"}
        destructive
        onConfirm={() => {
          if (!pendingDelete || !tripId) {
            setPendingDelete(null);
            return;
          }
          void (async () => {
            try {
              await deleteMutation.mutateAsync({ tripId, ideaId: pendingDelete.id });
              setPendingDelete(null);
            } catch (error) {
              setActionError(error instanceof Error ? error.message : "Unable to delete idea.");
              setPendingDelete(null);
            }
          })();
        }}
        onCancel={() => {
          if (!deleteMutation.isPending) {
            setPendingDelete(null);
          }
        }}
      />
    </SafeAreaView>
  );
}
