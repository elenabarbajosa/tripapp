import { Pressable, ScrollView, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton/AppButton";
import type { TripMapPoint } from "@/features/tripMap/types";
import { styles } from "./TripMapList.styles";

export interface TripMapListProps {
  points: TripMapPoint[];
  selectedId: string | null;
  onSelect: (point: TripMapPoint) => void;
  onOpenDirections: (point: TripMapPoint) => void;
  onOpenDetail: (point: TripMapPoint) => void;
}

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

export function TripMapList({
  points,
  selectedId,
  onSelect,
  onOpenDirections,
  onOpenDetail,
}: TripMapListProps) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      accessibilityLabel="Mapped places list"
    >
      {points.length === 0 ? (
        <Text style={styles.empty}>No mapped places match these filters.</Text>
      ) : null}
      {points.map((point) => {
        const selected = selectedId === point.id;
        return (
          <Pressable
            key={point.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onSelect(point)}
            style={[styles.item, selected ? styles.itemSelected : null]}
          >
            <Text style={styles.type}>{typeLabel(point.type)}</Text>
            <Text style={styles.title}>{point.title}</Text>
            {point.subtitle ? <Text style={styles.meta}>{point.subtitle}</Text> : null}
            {point.address ? <Text style={styles.meta}>{point.address}</Text> : null}
            <View style={styles.actions}>
              {point.type !== "destination" ? (
                <AppButton
                  label="Open"
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
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
