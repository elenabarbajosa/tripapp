import { Text, View } from "react-native";

import { ActivityCategory } from "@/types/models";
import { getCategoryColor, getCategoryLabel } from "@/utils/category";
import { styles } from "./CategoryBadge.styles";

export interface CategoryBadgeProps {
  category: ActivityCategory;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const color = getCategoryColor(category);
  const label = getCategoryLabel(category);

  return (
    <View
      style={[styles.badge, { backgroundColor: `${color}1A` }]}
      accessibilityLabel={`Category ${label}`}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}
