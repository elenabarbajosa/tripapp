import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGlobalSearchParams, useRouter } from "expo-router";

import { ProgressBar } from "@/components/ui/ProgressBar/ProgressBar";
import { AppButton } from "@/components/ui/AppButton/AppButton";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog/ConfirmationDialog";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import { ScreenHeader } from "@/components/ui/ScreenHeader/ScreenHeader";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  useDeletePackingItemMutation,
  usePackingRealtime,
  useReorderPackingItemsMutation,
  useTogglePackingItemMutation,
  useTripPackingQuery,
} from "@/features/packing/hooks";
import {
  calculatePackingProgress,
  filterPackingItems,
  groupPackingByCategory,
  type PackingFilter,
} from "@/features/packing/progress";
import { usePreview } from "@/features/preview/PreviewProvider";
import { useTripQuery } from "@/features/trips/hooks";
import { currentUserRole } from "@/features/trips/mappers";
import {
  canCreatePackingItem,
  canDeletePackingItem,
  canEditPackingItem,
  canReorderPackingItems,
  canTogglePackingItem,
} from "@/features/trips/permissions";
import type { TripPackingItem } from "@/types/models";
import { isValidUuid, resolveRouteParam } from "@/utils/routeParams";
import { styles } from "./PackingScreen.styles";

const FILTERS: PackingFilter[] = ["all", "shared", "mine", "unpacked", "packed"];

function filterLabel(filter: PackingFilter): string {
  switch (filter) {
    case "all":
      return "All";
    case "shared":
      return "Shared";
    case "mine":
      return "Mine";
    case "unpacked":
      return "Unpacked";
    case "packed":
      return "Packed";
    default:
      return filter;
  }
}

export function PackingScreen() {
  const router = useRouter();
  const params = useGlobalSearchParams<{ tripId?: string | string[] }>();
  const tripId = resolveRouteParam(params.tripId);
  const hasValidTripId = isValidUuid(tripId);

  const { user, isAuthenticated, isInitializing } = useAuth();
  const { isPreviewActive } = usePreview();
  const shouldLoad =
    !isInitializing && isAuthenticated && !isPreviewActive && hasValidTripId;

  const tripQuery = useTripQuery(tripId, shouldLoad);
  const packingQuery = useTripPackingQuery(tripId, shouldLoad && Boolean(tripQuery.data));
  usePackingRealtime(tripId, shouldLoad && Boolean(tripQuery.data));

  const trip = tripQuery.data ?? null;
  const role = trip ? currentUserRole(trip, user?.id) : null;
  const items = useMemo(() => packingQuery.data ?? [], [packingQuery.data]);

  const [filter, setFilter] = useState<PackingFilter>("all");
  const [pendingDelete, setPendingDelete] = useState<TripPackingItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const toggleMutation = useTogglePackingItemMutation();
  const deleteMutation = useDeletePackingItemMutation();
  const reorderMutation = useReorderPackingItemsMutation();
  const isMutating =
    toggleMutation.isPending || deleteMutation.isPending || reorderMutation.isPending;

  const canAdd =
    !isPreviewActive &&
    canCreatePackingItem(role, "personal", user?.id, user?.id);
  const canReorder = !isPreviewActive && canReorderPackingItems(role);

  const progress = useMemo(() => calculatePackingProgress(items), [items]);
  const filtered = useMemo(
    () => filterPackingItems(items, filter, user?.id),
    [items, filter, user?.id],
  );
  const grouped = useMemo(() => groupPackingByCategory(filtered), [filtered]);

  const onAdd = () => {
    if (!hasValidTripId || !tripId) {
      return;
    }
    router.push({
      pathname: "/trips/[tripId]/packing/new",
      params: { tripId },
    });
  };

  const onEdit = (item: TripPackingItem) => {
    if (!hasValidTripId || !tripId) {
      return;
    }
    router.push({
      pathname: "/trips/[tripId]/packing/[itemId]/edit",
      params: { tripId, itemId: item.id },
    });
  };

  const onToggle = async (item: TripPackingItem) => {
    if (!tripId || !canTogglePackingItem(role, item, user?.id)) {
      return;
    }
    setActionError(null);
    try {
      await toggleMutation.mutateAsync({ tripId, itemId: item.id });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to toggle item.");
    }
  };

  const onMove = async (itemId: string, direction: "up" | "down") => {
    if (!tripId || !canReorder) {
      return;
    }
    const ids = filtered.map((item) => item.id);
    const index = ids.indexOf(itemId);
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || swapWith < 0 || swapWith >= ids.length) {
      return;
    }
    const next = [...ids];
    const a = next[index];
    const b = next[swapWith];
    if (!a || !b) {
      return;
    }
    next[index] = b;
    next[swapWith] = a;
    // Reorder within full trip list by swapping positions among filtered subset in the full ordered list
    const fullIds = items.map((item) => item.id);
    const fullNext = [...fullIds];
    const fullIndex = fullNext.indexOf(itemId);
    const fullSwap = fullNext.indexOf(next[swapWith] === itemId ? a : b);
    // Simpler: rebuild full order from grouped filtered move only on unfiltered all view
    const working = filter === "all" ? [...ids] : [...fullIds];
    if (filter === "all") {
      working[index] = b;
      working[swapWith] = a;
      setActionError(null);
      try {
        await reorderMutation.mutateAsync({ tripId, itemIds: working });
      } catch (error) {
        setActionError(error instanceof Error ? error.message : "Unable to reorder.");
      }
      return;
    }
    // For filtered views, swap within full list by ids
    if (fullIndex >= 0 && fullSwap >= 0) {
      const tmp = fullNext[fullIndex]!;
      fullNext[fullIndex] = fullNext[fullSwap]!;
      fullNext[fullSwap] = tmp;
      setActionError(null);
      try {
        await reorderMutation.mutateAsync({ tripId, itemIds: fullNext });
      } catch (error) {
        setActionError(error instanceof Error ? error.message : "Unable to reorder.");
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScreenHeader title="Packing" subtitle="Shared and personal lists" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!hasValidTripId && !isPreviewActive ? (
          <EmptyState
            title="Trip not found"
            body="This packing link is missing a valid trip id."
          />
        ) : null}
        {isPreviewActive ? (
          <EmptyState title="Preview mode" body="Sign in to manage packing for a live trip." />
        ) : null}
        {shouldLoad && (tripQuery.isLoading || packingQuery.isLoading) ? (
          <LoadingState label="Loading packing…" />
        ) : null}
        {shouldLoad && packingQuery.isError ? (
          <ErrorState
            title="Could not load packing"
            message={
              packingQuery.error instanceof Error
                ? packingQuery.error.message
                : "Try again in a moment."
            }
            onRetry={() => {
              void packingQuery.refetch();
            }}
          />
        ) : null}

        {shouldLoad && trip && !packingQuery.isError ? (
          <>
            <Text style={styles.progressLabel}>
              {progress.packedCount} of {progress.totalCount} packed ({progress.percent}%)
            </Text>
            <ProgressBar progress={progress.percent} />

            <View style={styles.filterRow}>
              {FILTERS.map((option) => {
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
                      {filterLabel(option)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {actionError ? <Text style={styles.actionError}>{actionError}</Text> : null}

            {filtered.length === 0 ? (
              <EmptyState
                title="No packing items yet"
                body={canAdd ? "Add shared or personal items to get started." : "No items match this filter."}
              />
            ) : null}

            {grouped.map((group) => (
              <View key={group.category}>
                <Text style={styles.sectionTitle}>{group.category}</Text>
                {group.items.map((item, index) => {
                  const canToggle = canTogglePackingItem(role, item, user?.id);
                  const canEdit = canEditPackingItem(role, item, user?.id);
                  const canDelete = canDeletePackingItem(role, item, user?.id);
                  return (
                    <View key={item.id} style={styles.itemRow}>
                      <Pressable
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: item.isPacked, disabled: !canToggle }}
                        disabled={!canToggle || isMutating}
                        onPress={() => {
                          void onToggle(item);
                        }}
                        style={[styles.checkbox, item.isPacked ? styles.checkboxChecked : null]}
                      >
                        {item.isPacked ? <Text style={styles.checkboxMark}>✓</Text> : null}
                      </Pressable>
                      <View style={styles.itemBody}>
                        <Text
                          style={[styles.itemTitle, item.isPacked ? styles.itemTitlePacked : null]}
                        >
                          {item.title}
                          {item.quantity > 1 ? ` ×${item.quantity}` : ""}
                        </Text>
                        <Text style={styles.itemMeta}>
                          {item.scope}
                          {item.assignedTo ? " · assigned" : ""}
                          {item.notes ? ` · ${item.notes}` : ""}
                        </Text>
                        <View style={styles.itemActions}>
                          {canEdit ? (
                            <AppButton
                              label="Edit"
                              size="sm"
                              variant="secondary"
                              onPress={() => onEdit(item)}
                              disabled={isMutating}
                            />
                          ) : null}
                          {canDelete ? (
                            <AppButton
                              label="Delete"
                              size="sm"
                              variant="ghost"
                              onPress={() => setPendingDelete(item)}
                              disabled={isMutating}
                            />
                          ) : null}
                          {canReorder && filter === "all" ? (
                            <>
                              <AppButton
                                label="Up"
                                size="sm"
                                variant="ghost"
                                disabled={isMutating || index === 0}
                                onPress={() => {
                                  void onMove(item.id, "up");
                                }}
                              />
                              <AppButton
                                label="Down"
                                size="sm"
                                variant="ghost"
                                disabled={isMutating || index === group.items.length - 1}
                                onPress={() => {
                                  void onMove(item.id, "down");
                                }}
                              />
                            </>
                          ) : null}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
            <View style={styles.fabSpacer} />
          </>
        ) : null}
      </ScrollView>

      {canAdd ? (
        <View style={styles.fabContainer}>
          <AppButton label="Add item" onPress={onAdd} disabled={isMutating} />
        </View>
      ) : null}

      <ConfirmationDialog
        visible={pendingDelete != null}
        title="Delete packing item?"
        message={
          pendingDelete ? `Remove “${pendingDelete.title}” from the packing list?` : ""
        }
        confirmLabel={deleteMutation.isPending ? "Deleting…" : "Delete"}
        destructive
        onConfirm={() => {
          if (!pendingDelete || !tripId) {
            setPendingDelete(null);
            return;
          }
          void (async () => {
            try {
              await deleteMutation.mutateAsync({
                tripId,
                itemId: pendingDelete.id,
              });
              setPendingDelete(null);
            } catch (error) {
              setActionError(
                error instanceof Error ? error.message : "Unable to delete item.",
              );
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
