import { Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton/AppButton";
import { IconButton } from "@/components/ui/IconButton/IconButton";
import type { TripActivity } from "@/types/models";
import { formatTimeLabel } from "@/utils/date";
import {
  getTripActivityCategoryColor,
  getTripActivityCategoryLabel,
} from "@/utils/itineraryCategory";
import { styles } from "./ItineraryActivityCard.styles";

const DESCRIPTION_PREVIEW_MAX = 120;

export interface ItineraryActivityCardProps {
  activity: TripActivity;
  canEdit?: boolean;
  canDelete?: boolean;
  canReorder?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  actionsDisabled?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

function timeLabel(activity: TripActivity): string {
  if (activity.isAllDay) {
    return "All day";
  }
  if (activity.startTime && activity.endTime) {
    return `${formatTimeLabel(activity.startTime)} – ${formatTimeLabel(activity.endTime)}`;
  }
  if (activity.startTime) {
    return formatTimeLabel(activity.startTime);
  }
  return "Time TBD";
}

function descriptionPreview(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.length <= DESCRIPTION_PREVIEW_MAX) {
    return trimmed;
  }
  return `${trimmed.slice(0, DESCRIPTION_PREVIEW_MAX - 1)}…`;
}

export function ItineraryActivityCard({
  activity,
  canEdit = false,
  canDelete = false,
  canReorder = false,
  isFirst = false,
  isLast = false,
  actionsDisabled = false,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: ItineraryActivityCardProps) {
  const categoryColor = getTripActivityCategoryColor(activity.category);
  const categoryLabel = getTripActivityCategoryLabel(activity.category);
  const preview = descriptionPreview(activity.description);
  const showActions = canEdit || canDelete || canReorder;

  return (
    <View
      style={styles.card}
      accessibilityLabel={`${activity.title}, ${timeLabel(activity)}, ${categoryLabel}`}
    >
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <Text style={styles.time}>{timeLabel(activity)}</Text>
          <Text style={styles.title}>{activity.title}</Text>
        </View>
        <View
          style={[styles.categoryBadge, { backgroundColor: `${categoryColor}1A` }]}
          accessibilityLabel={`Category ${categoryLabel}`}
        >
          <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
          <Text style={[styles.categoryLabel, { color: categoryColor }]}>{categoryLabel}</Text>
        </View>
      </View>

      {activity.locationName ? <Text style={styles.meta}>{activity.locationName}</Text> : null}
      {activity.destinationCity ? (
        <Text style={styles.meta}>{activity.destinationCity}</Text>
      ) : null}
      {preview ? <Text style={styles.description}>{preview}</Text> : null}

      {showActions ? (
        <View style={styles.actions}>
          {canEdit ? (
            <AppButton
              label="Edit"
              size="sm"
              variant="secondary"
              onPress={onEdit}
              disabled={actionsDisabled}
            />
          ) : null}
          {canDelete ? (
            <AppButton
              label="Delete"
              size="sm"
              variant="ghost"
              onPress={onDelete}
              disabled={actionsDisabled}
            />
          ) : null}
          {canReorder ? (
            <>
              <IconButton
                icon="arrow-up"
                accessibilityLabel="Move activity up"
                variant="ghost"
                onPress={onMoveUp}
                disabled={actionsDisabled || isFirst}
              />
              <IconButton
                icon="arrow-down"
                accessibilityLabel="Move activity down"
                variant="ghost"
                onPress={onMoveDown}
                disabled={actionsDisabled || isLast}
              />
            </>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
