import type { TripMapPoint, TripMapRoutePoint } from "./types";

export function pointsToGeoJson(points: TripMapPoint[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: points.map((point) => ({
      type: "Feature",
      id: point.id,
      properties: {
        id: point.id,
        entityId: point.entityId,
        type: point.type,
        title: point.title,
        stopNumber: point.stopNumber,
        category: point.category,
      },
      geometry: {
        type: "Point",
        coordinates: [point.longitude, point.latitude],
      },
    })),
  };
}

/**
 * Visual trip overview only — straight lines between destinations in display order.
 * Not a road route, distance, or travel-time estimate.
 */
export function routeToGeoJson(routePoints: TripMapRoutePoint[]): GeoJSON.FeatureCollection {
  if (routePoints.length < 2) {
    return { type: "FeatureCollection", features: [] };
  }
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { kind: "destination-overview" },
        geometry: {
          type: "LineString",
          coordinates: routePoints.map((point) => [point.longitude, point.latitude]),
        },
      },
    ],
  };
}
