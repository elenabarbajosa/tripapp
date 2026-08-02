import { Pressable, Text, View } from "react-native";

import type { TripMapDayOption } from "@/features/tripMap/types";
import { styles } from "./TripMapDaySelector.styles";

export interface TripMapDaySelectorProps {
  days: TripMapDayOption[];
  selectedDayId: string | null;
  onSelectDayId: (dayId: string | null) => void;
  includeIdeasOnDay: boolean;
  onToggleIncludeIdeas: (value: boolean) => void;
}

export function TripMapDaySelector({
  days,
  selectedDayId,
  onSelectDayId,
  includeIdeasOnDay,
  onToggleIncludeIdeas,
}: TripMapDaySelectorProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: selectedDayId == null }}
          onPress={() => onSelectDayId(null)}
          style={[styles.chip, selectedDayId == null ? styles.chipSelected : null]}
        >
          <Text
            style={[
              styles.chipLabel,
              selectedDayId == null ? styles.chipLabelSelected : null,
            ]}
          >
            All days
          </Text>
        </Pressable>
        {days.map((day) => {
          const selected = selectedDayId === day.id;
          return (
            <Pressable
              key={day.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onSelectDayId(day.id)}
              style={[styles.chip, selected ? styles.chipSelected : null]}
            >
              <Text style={[styles.chipLabel, selected ? styles.chipLabelSelected : null]}>
                {day.label?.trim() || day.date}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {selectedDayId != null ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: includeIdeasOnDay }}
          onPress={() => onToggleIncludeIdeas(!includeIdeasOnDay)}
          style={[styles.chip, includeIdeasOnDay ? styles.chipSelected : null]}
        >
          <Text
            style={[
              styles.chipLabel,
              includeIdeasOnDay ? styles.chipLabelSelected : null,
            ]}
          >
            Include ideas
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
