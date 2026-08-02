import { useEffect, useMemo, useRef } from "react";
import { Pressable, Text, View } from "react-native";
import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
  type CameraRef,
} from "@maplibre/maplibre-react-native";

import { TripMapAttribution } from "@/components/tripMap/TripMapAttribution";
import {
  boundsFromPoints,
  CITY_LEVEL_ZOOM,
  DEFAULT_MAP_PADDING,
  WORLD_CENTER,
  WORLD_ZOOM,
} from "@/features/tripMap/camera";
import { pointsToGeoJson, routeToGeoJson } from "@/features/tripMap/geojson";
import type { TripMapPoint, TripMapRoutePoint } from "@/features/tripMap/types";
import { mapColors } from "@/theme";
import { styles } from "./TripMapCanvas.styles";

export interface TripMapCanvasProps {
  styleUrl: string;
  points: TripMapPoint[];
  routePoints: TripMapRoutePoint[];
  showRoute: boolean;
  selectedId: string | null;
  fitToken: number;
  onSelectPointId: (pointId: string | null) => void;
  onRequestFitAll: () => void;
}

export function TripMapCanvas({
  styleUrl,
  points,
  routePoints,
  showRoute,
  selectedId,
  fitToken,
  onSelectPointId,
  onRequestFitAll,
}: TripMapCanvasProps) {
  const cameraRef = useRef<CameraRef>(null);

  const pointsGeoJson = useMemo(() => pointsToGeoJson(points), [points]);
  const routeGeoJson = useMemo(
    () => routeToGeoJson(showRoute ? routePoints : []),
    [routePoints, showRoute],
  );

  const initialViewState = useMemo(() => {
    if (points.length === 0) {
      return { center: WORLD_CENTER, zoom: WORLD_ZOOM };
    }
    if (points.length === 1) {
      return {
        center: [points[0]!.longitude, points[0]!.latitude] as [number, number],
        zoom: CITY_LEVEL_ZOOM,
      };
    }
    const bounds = boundsFromPoints(points);
    if (!bounds) {
      return { center: WORLD_CENTER, zoom: WORLD_ZOOM };
    }
    return {
      bounds,
      padding: DEFAULT_MAP_PADDING,
    };
  }, [points]);

  useEffect(() => {
    if (fitToken === 0) {
      return;
    }
    if (points.length === 0) {
      cameraRef.current?.flyTo({
        center: WORLD_CENTER,
        zoom: WORLD_ZOOM,
        duration: 600,
      });
      return;
    }
    if (points.length === 1) {
      cameraRef.current?.flyTo({
        center: [points[0]!.longitude, points[0]!.latitude],
        zoom: CITY_LEVEL_ZOOM,
        duration: 600,
      });
      return;
    }
    const bounds = boundsFromPoints(points);
    if (!bounds) {
      return;
    }
    cameraRef.current?.fitBounds(bounds, {
      padding: DEFAULT_MAP_PADDING,
      duration: 600,
    });
  }, [fitToken, points]);

  return (
    <View style={styles.container}>
      <Map style={styles.map} mapStyle={styleUrl}>
        <Camera ref={cameraRef} initialViewState={initialViewState} />
        {routeGeoJson.features.length > 0 ? (
          <GeoJSONSource id="trip-route" data={routeGeoJson}>
            <Layer
              id="trip-route-line"
              type="line"
              paint={{
                "line-color": mapColors.routeLineStrong,
                "line-width": 3,
                "line-opacity": 0.75,
              }}
            />
          </GeoJSONSource>
        ) : null}
        <GeoJSONSource
          id="trip-points"
          data={pointsGeoJson}
          onPress={(event) => {
            event.stopPropagation();
            const feature = event.nativeEvent.features[0];
            const id =
              feature &&
              feature.properties &&
              typeof feature.properties.id === "string"
                ? feature.properties.id
                : null;
            onSelectPointId(id);
          }}
        >
          <Layer
            id="trip-points-circle"
            type="circle"
            paint={{
              "circle-radius": [
                "case",
                ["==", ["get", "type"], "destination"],
                10,
                7,
              ],
              "circle-color": [
                "match",
                ["get", "type"],
                "destination",
                mapColors.destination,
                "activity",
                mapColors.activity,
                "booking",
                mapColors.booking,
                "idea",
                mapColors.idea,
                mapColors.destination,
              ],
              "circle-stroke-width": [
                "case",
                ["==", ["get", "id"], selectedId ?? ""],
                3,
                1,
              ],
              "circle-stroke-color": mapColors.selectionRing,
            }}
          />
          <Layer
            id="trip-points-labels"
            type="symbol"
            filter={["==", ["get", "type"], "destination"]}
            layout={{
              "text-field": ["to-string", ["get", "stopNumber"]],
              "text-size": 12,
              "text-allow-overlap": true,
            }}
            paint={{
              "text-color": mapColors.destinationOn,
            }}
          />
        </GeoJSONSource>
      </Map>

      <View style={styles.fitButtonWrap} pointerEvents="box-none">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fit all mapped places"
          onPress={onRequestFitAll}
          style={styles.fitButton}
        >
          <Text style={styles.fitButtonLabel}>Fit all</Text>
        </Pressable>
      </View>

      <View style={styles.attributionWrap} pointerEvents="box-none">
        <TripMapAttribution />
      </View>
    </View>
  );
}
