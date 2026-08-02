import { Pressable, Text, View } from "react-native";

import {
  DEFAULT_MAP_FILTER_STATE,
  toggleTypeFilter,
  type TripMapFilterState,
} from "@/features/tripMap/filters";
import type { TripMapPointType } from "@/features/tripMap/types";
import { styles } from "./TripMapFilters.styles";

const TYPE_OPTIONS: { type: TripMapPointType | "all"; label: string }[] = [
  { type: "all", label: "All" },
  { type: "destination", label: "Destinations" },
  { type: "activity", label: "Activities" },
  { type: "booking", label: "Bookings" },
  { type: "idea", label: "Ideas" },
];

export interface TripMapFiltersProps {
  filters: TripMapFilterState;
  onChange: (next: TripMapFilterState) => void;
}

export function TripMapFilters({ filters, onChange }: TripMapFiltersProps) {
  const isAll = filters.types.size === 0;

  return (
    <View style={styles.row} accessibilityRole="tablist">
      {TYPE_OPTIONS.map((option) => {
        const selected =
          option.type === "all"
            ? isAll
            : filters.types.has(option.type) && !isAll;
        return (
          <Pressable
            key={option.type}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => {
              if (option.type === "all") {
                onChange({ ...filters, types: new Set() });
                return;
              }
              if (isAll) {
                onChange({
                  ...filters,
                  types: toggleTypeFilter(new Set(), option.type),
                });
                return;
              }
              const nextTypes = toggleTypeFilter(filters.types, option.type);
              onChange({
                ...filters,
                types: nextTypes.size === 0 ? new Set() : nextTypes,
              });
            }}
            style={[styles.chip, selected ? styles.chipSelected : null]}
          >
            <Text style={[styles.chipLabel, selected ? styles.chipLabelSelected : null]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: filters.showRoute }}
        onPress={() => {
          onChange({ ...filters, showRoute: !filters.showRoute });
        }}
        style={[styles.chip, filters.showRoute ? styles.chipSelected : null]}
      >
        <Text
          style={[
            styles.chipLabel,
            filters.showRoute ? styles.chipLabelSelected : null,
          ]}
        >
          Route overview
        </Text>
      </Pressable>
    </View>
  );
}

export { DEFAULT_MAP_FILTER_STATE };
