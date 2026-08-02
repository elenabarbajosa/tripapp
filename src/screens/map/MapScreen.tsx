import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGlobalSearchParams, useRouter } from "expo-router";

import { TripMapCanvas } from "@/components/tripMap/TripMapCanvas";
import { TripMapConfigurationState } from "@/components/tripMap/TripMapConfigurationState";
import { TripMapDaySelector } from "@/components/tripMap/TripMapDaySelector";
import { TripMapFilters } from "@/components/tripMap/TripMapFilters";
import { TripMapList } from "@/components/tripMap/TripMapList";
import { TripMapMarkerCard } from "@/components/tripMap/TripMapMarkerCard";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import { ScreenHeader } from "@/components/ui/ScreenHeader/ScreenHeader";
import { useAuth } from "@/features/auth/AuthProvider";
import { usePreview } from "@/features/preview/PreviewProvider";
import { getTripMapConfig } from "@/features/tripMap/config";
import {
  DEFAULT_MAP_FILTER_STATE,
  filterMapPoints,
  type TripMapFilterState,
} from "@/features/tripMap/filters";
import { useTripMapQuery } from "@/features/tripMap/hooks";
import type { TripMapPoint } from "@/features/tripMap/types";
import { openExternalDirections } from "@/utils/externalMaps";
import { isValidUuid, resolveRouteParam } from "@/utils/routeParams";
import { styles } from "./MapScreen.styles";

type ViewMode = "map" | "list";

export function MapScreen() {
  const router = useRouter();
  const params = useGlobalSearchParams<{ tripId?: string | string[] }>();
  const tripId = resolveRouteParam(params.tripId);
  const hasValidTripId = isValidUuid(tripId);

  const { isAuthenticated, isInitializing } = useAuth();
  const { isPreviewActive } = usePreview();
  const mapConfig = useMemo(() => getTripMapConfig(), []);

  const shouldLoad =
    !isInitializing && isAuthenticated && !isPreviewActive && hasValidTripId;

  const mapQuery = useTripMapQuery(tripId, shouldLoad);

  const [filters, setFilters] = useState<TripMapFilterState>(() => ({
    ...DEFAULT_MAP_FILTER_STATE,
    types: new Set(),
  }));
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fitToken, setFitToken] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);

  const updateFilters = (next: TripMapFilterState) => {
    setFilters(next);
    setSelectedId(null);
    setFitToken((token) => token + 1);
  };

  const data = mapQuery.data;
  const filteredPoints = useMemo(() => {
    if (!data) {
      return [];
    }
    return filterMapPoints(
      data.points,
      filters,
      data.days,
      data.bookingDateRanges,
    );
  }, [data, filters]);

  const filteredRoutePoints = useMemo(() => {
    if (!data || !filters.showRoute) {
      return [];
    }
    if (!isTypeFilterAllowsDestinations(filters)) {
      return [];
    }
    const visibleDestinationIds = new Set(
      filteredPoints
        .filter((point) => point.type === "destination")
        .map((point) => point.entityId),
    );
    return data.routePoints.filter((point) =>
      visibleDestinationIds.has(point.destinationId),
    );
  }, [data, filteredPoints, filters]);

  const selectedPoint =
    filteredPoints.find((point) => point.id === selectedId) ?? null;

  const onOpenDirections = async (point: TripMapPoint) => {
    setActionError(null);
    try {
      await openExternalDirections({
        latitude: point.latitude,
        longitude: point.longitude,
        label: point.title,
      });
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to open directions.",
      );
    }
  };

  const onOpenDetail = (point: TripMapPoint) => {
    if (!hasValidTripId || !tripId) {
      return;
    }
    if (point.type === "activity") {
      const paramsPayload: { tripId: string; tripDayId?: string } = { tripId };
      if (isValidUuid(point.tripDayId)) {
        paramsPayload.tripDayId = point.tripDayId;
      }
      router.push({
        pathname: "/trips/[tripId]/(tabs)/itinerary",
        params: paramsPayload,
      });
      return;
    }
    if (point.type === "booking" && isValidUuid(point.entityId)) {
      router.push({
        pathname: "/trips/[tripId]/bookings/[bookingId]",
        params: { tripId, bookingId: point.entityId },
      });
      return;
    }
    if (point.type === "idea" && isValidUuid(point.entityId)) {
      router.push({
        pathname: "/trips/[tripId]/ideas",
        params: { tripId, ideaId: point.entityId },
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScreenHeader title="Map" subtitle="Trip places overview" />
      <View style={styles.body}>
        {!hasValidTripId && !isPreviewActive ? (
          <EmptyState
            title="Trip not found"
            body="This map link is missing a valid trip id."
          />
        ) : null}

        {isPreviewActive ? (
          <EmptyState title="Preview mode" body="Sign in to view a live trip map." />
        ) : null}

        {shouldLoad && mapQuery.isLoading ? <LoadingState label="Loading map…" /> : null}

        {shouldLoad && mapQuery.isError ? (
          <ErrorState
            title="Could not load map"
            message={
              mapQuery.error instanceof Error
                ? mapQuery.error.message
                : "Try again in a moment."
            }
            onRetry={() => {
              void mapQuery.refetch();
            }}
          />
        ) : null}

        {shouldLoad && data && !mapQuery.isError ? (
          <>
            <View style={styles.controls}>
              <View style={styles.modeRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: viewMode === "map" }}
                  onPress={() => setViewMode("map")}
                  style={[styles.modeChip, viewMode === "map" ? styles.modeChipSelected : null]}
                >
                  <Text
                    style={[
                      styles.modeChipLabel,
                      viewMode === "map" ? styles.modeChipLabelSelected : null,
                    ]}
                  >
                    Map
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: viewMode === "list" }}
                  onPress={() => setViewMode("list")}
                  style={[styles.modeChip, viewMode === "list" ? styles.modeChipSelected : null]}
                >
                  <Text
                    style={[
                      styles.modeChipLabel,
                      viewMode === "list" ? styles.modeChipLabelSelected : null,
                    ]}
                  >
                    List
                  </Text>
                </Pressable>
              </View>
              <TripMapFilters filters={filters} onChange={updateFilters} />
              <TripMapDaySelector
                days={data.days}
                selectedDayId={filters.dayId}
                onSelectDayId={(dayId) => updateFilters({ ...filters, dayId })}
                includeIdeasOnDay={filters.includeIdeasOnDay}
                onToggleIncludeIdeas={(includeIdeasOnDay) =>
                  updateFilters({ ...filters, includeIdeasOnDay })
                }
              />
              {actionError ? <Text style={styles.actionError}>{actionError}</Text> : null}
            </View>

            {filteredPoints.length === 0 ? (
              <EmptyState
                title="No mapped places yet"
                body="No mapped places yet. Add a location to an activity, booking, or idea."
              />
            ) : null}

            {viewMode === "map" ? (
              <View style={styles.mapArea}>
                {!mapConfig.isMapConfigured || !mapConfig.styleUrl ? (
                  <TripMapConfigurationState />
                ) : (
                  <TripMapCanvas
                    styleUrl={mapConfig.styleUrl}
                    points={filteredPoints}
                    routePoints={filteredRoutePoints}
                    showRoute={filters.showRoute}
                    selectedId={selectedId}
                    fitToken={fitToken}
                    onSelectPointId={setSelectedId}
                    onRequestFitAll={() => setFitToken((token) => token + 1)}
                  />
                )}
                {selectedPoint ? (
                  <View style={styles.cardWrap}>
                    <TripMapMarkerCard
                      point={selectedPoint}
                      onClose={() => setSelectedId(null)}
                      onOpenDirections={(point) => {
                        void onOpenDirections(point);
                      }}
                      onOpenDetail={onOpenDetail}
                    />
                  </View>
                ) : null}
              </View>
            ) : (
              <TripMapList
                points={filteredPoints}
                selectedId={selectedId}
                onSelect={(point) => setSelectedId(point.id)}
                onOpenDirections={(point) => {
                  void onOpenDirections(point);
                }}
                onOpenDetail={onOpenDetail}
              />
            )}

            {viewMode === "map" &&
            (!mapConfig.isMapConfigured || !mapConfig.styleUrl) &&
            filteredPoints.length > 0 ? (
              <View style={styles.fallbackList}>
                <TripMapList
                  points={filteredPoints}
                  selectedId={selectedId}
                  onSelect={(point) => setSelectedId(point.id)}
                  onOpenDirections={(point) => {
                    void onOpenDirections(point);
                  }}
                  onOpenDetail={onOpenDetail}
                />
              </View>
            ) : null}

            {data.unmapped.length > 0 ? (
              <Text style={styles.unmappedHint}>
                {data.unmapped.length} place
                {data.unmapped.length === 1 ? "" : "s"} still need coordinates.
              </Text>
            ) : null}
          </>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function isTypeFilterAllowsDestinations(filters: TripMapFilterState): boolean {
  return filters.types.size === 0 || filters.types.has("destination");
}
