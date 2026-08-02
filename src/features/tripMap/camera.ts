import type { TripMapPoint } from "./types";

export type LngLat = [longitude: number, latitude: number];
export type LngLatBounds = [west: number, south: number, east: number, north: number];

export const CITY_LEVEL_ZOOM = 11;
export const WORLD_CENTER: LngLat = [0, 20];
export const WORLD_ZOOM = 1.5;

export type CameraPadding = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export const DEFAULT_MAP_PADDING: CameraPadding = {
  top: 120,
  right: 48,
  bottom: 220,
  left: 48,
};

export function boundsFromPoints(points: TripMapPoint[]): LngLatBounds | null {
  if (points.length === 0) {
    return null;
  }
  let west = points[0]!.longitude;
  let east = points[0]!.longitude;
  let south = points[0]!.latitude;
  let north = points[0]!.latitude;
  for (const point of points) {
    west = Math.min(west, point.longitude);
    east = Math.max(east, point.longitude);
    south = Math.min(south, point.latitude);
    north = Math.max(north, point.latitude);
  }
  if (west === east) {
    west -= 0.05;
    east += 0.05;
  }
  if (south === north) {
    south -= 0.05;
    north += 0.05;
  }
  return [west, south, east, north];
}

export function centerFromPoints(points: TripMapPoint[]): LngLat | null {
  if (points.length === 0) {
    return null;
  }
  if (points.length === 1) {
    return [points[0]!.longitude, points[0]!.latitude];
  }
  const bounds = boundsFromPoints(points);
  if (!bounds) {
    return null;
  }
  const [west, south, east, north] = bounds;
  return [(west + east) / 2, (south + north) / 2];
}
