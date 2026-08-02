import { Pressable, Text, View } from "react-native";

import { CategoryBadge } from "@/components/ui/CategoryBadge/CategoryBadge";
import { StatusBadge } from "@/components/ui/StatusBadge/StatusBadge";
import { ActivityItem } from "@/types/models";
import { getCategoryColor } from "@/utils/category";
import { formatTimeLabel } from "@/utils/date";
import { styles } from "./ActivityCard.styles";

export interface ActivityCardProps {
  activity: ActivityItem;
  showConnector?: boolean;
  onPress?: () => void;
}

export function ActivityCard({ activity, showConnector = true, onPress }: ActivityCardProps) {
  const categoryColor = getCategoryColor(activity.category);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${activity.name} at ${formatTimeLabel(activity.startTime)}`}
      onPress={onPress}
      style={styles.row}
    >
      <View style={styles.timeColumn}>
        <Text style={styles.time}>{formatTimeLabel(activity.startTime)}</Text>
        {activity.endTime ? (
          <Text style={styles.endTime}>{formatTimeLabel(activity.endTime)}</Text>
        ) : null}
      </View>
      <View style={styles.timeline}>
        <View style={[styles.dot, { backgroundColor: categoryColor }]} />
        {showConnector ? <View style={styles.line} /> : null}
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{activity.name}</Text>
          <StatusBadge
            label={activity.status === "confirmed" ? "Confirmed" : "Tentative"}
            variant={activity.status}
          />
        </View>
        {activity.locationName ? <Text style={styles.location}>{activity.locationName}</Text> : null}
        <View style={styles.footer}>
          <CategoryBadge category={activity.category} />
        </View>
      </View>
    </Pressable>
  );
}
