import { Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton/AppButton";
import type { TripMapPoint } from "@/features/tripMap/types";
import { styles } from "./TripMapMarkerCard.styles";

function typeLabel(type: TripMapPoint["type"]): string {
  switch (type) {
    case "destination":
      return "Destination";
    case "activity":
      return "Activity";
    case "booking":
      return "Booking";
    case "idea":
      return "Idea";
    default:
      return type;
  }
}

export interface TripMapMarkerCardProps {
  point: TripMapPoint;
  onClose: () => void;
  onOpenDirections: (point: TripMapPoint) => void;
  onOpenDetail: (point: TripMapPoint) => void;
}

export function TripMapMarkerCard({
  point,
  onClose,
  onOpenDirections,
  onOpenDetail,
}: TripMapMarkerCardProps) {
  const detailLabel =
    point.type === "activity"
      ? "Open itinerary"
      : point.type === "booking"
        ? "Open booking"
        : point.type === "idea"
          ? "Open ideas"
          : null;

  return (
    <View style={styles.card} accessibilityRole="summary">
      <View style={styles.header}>
        <Text style={styles.type}>{typeLabel(point.type)}</Text>
        <AppButton label="Close" size="sm" variant="ghost" onPress={onClose} />
      </View>
      <Text style={styles.title}>{point.title}</Text>
      {point.category ? <Text style={styles.meta}>{point.category}</Text> : null}
      {point.date ? <Text style={styles.meta}>{point.date}</Text> : null}
      {point.subtitle ? <Text style={styles.meta}>{point.subtitle}</Text> : null}
      {point.address ? <Text style={styles.meta}>{point.address}</Text> : null}
      <View style={styles.actions}>
        {detailLabel ? (
          <AppButton
            label={detailLabel}
            size="sm"
            onPress={() => onOpenDetail(point)}
          />
        ) : null}
        <AppButton
          label="Directions"
          size="sm"
          variant="secondary"
          onPress={() => onOpenDirections(point)}
        />
      </View>
    </View>
  );
}
