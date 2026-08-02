export type TripMapPointType = "destination" | "activity" | "booking" | "idea";

export type TripMapPoint = {
  id: string;
  entityId: string;
  tripId: string;
  type: TripMapPointType;
  title: string;
  subtitle: string | null;
  latitude: number;
  longitude: number;
  category: string | null;
  date: string | null;
  tripDayId: string | null;
  destinationId: string | null;
  address: string | null;
  /** Destination stop index (1-based) when type is destination. */
  stopNumber: number | null;
};

export type TripMapRoutePoint = {
  destinationId: string;
  tripId: string;
  title: string;
  latitude: number;
  longitude: number;
  displayOrder: number;
  stopNumber: number;
};

export type TripMapUnmappedItem = {
  entityId: string;
  tripId: string;
  type: TripMapPointType;
  title: string;
  reason: "missing_coordinates" | "invalid_coordinates" | "geocode_failed";
};

export type TripMapDayOption = {
  id: string;
  date: string;
  label: string | null;
};

export type TripMapData = {
  tripId: string;
  points: TripMapPoint[];
  routePoints: TripMapRoutePoint[];
  unmapped: TripMapUnmappedItem[];
  days: TripMapDayOption[];
  typesPresent: TripMapPointType[];
  bookingDateRanges: Map<string, { start: string | null; end: string | null }>;
};
