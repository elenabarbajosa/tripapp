import { Pressable, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton/AppButton";
import type { TripBooking } from "@/types/models";
import { formatDisplayDate, formatShortDate, formatTimeLabel } from "@/utils/date";
import { getTripBookingTypeColor, getTripBookingTypeLabel } from "@/utils/bookingType";
import { styles } from "./TripBookingCard.styles";

export interface TripBookingCardProps {
  booking: TripBooking;
  canEdit?: boolean;
  canDelete?: boolean;
  actionsDisabled?: boolean;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

function dateTimeLabel(booking: TripBooking): string {
  const { startDate, endDate, startTime, endTime } = booking;

  if (!startDate) {
    return "Date TBD";
  }

  if (endDate && endDate !== startDate) {
    return `${formatShortDate(startDate)} – ${formatDisplayDate(endDate)}`;
  }

  const dateLabel = formatDisplayDate(startDate);
  if (startTime && endTime) {
    return `${dateLabel} · ${formatTimeLabel(startTime)} – ${formatTimeLabel(endTime)}`;
  }
  if (startTime) {
    return `${dateLabel} · ${formatTimeLabel(startTime)}`;
  }
  return dateLabel;
}

export function TripBookingCard({
  booking,
  canEdit = false,
  canDelete = false,
  actionsDisabled = false,
  onPress,
  onEdit,
  onDelete,
}: TripBookingCardProps) {
  const typeColor = getTripBookingTypeColor(booking.bookingType);
  const typeLabel = getTripBookingTypeLabel(booking.bookingType);
  const showActions = canEdit || canDelete;

  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={`${booking.title}, ${typeLabel}, ${dateTimeLabel(booking)}`}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.card, pressed && onPress ? styles.pressed : null]}
    >
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <Text style={styles.dateLabel}>{dateTimeLabel(booking)}</Text>
          <Text style={styles.title}>{booking.title}</Text>
        </View>
        <View
          style={[styles.typeBadge, { backgroundColor: `${typeColor}1A` }]}
          accessibilityLabel={`Type ${typeLabel}`}
        >
          <View style={[styles.typeDot, { backgroundColor: typeColor }]} />
          <Text style={[styles.typeLabel, { color: typeColor }]}>{typeLabel}</Text>
        </View>
      </View>

      {booking.providerName ? (
        <Text style={styles.meta}>{booking.providerName}</Text>
      ) : null}
      {booking.locationName ? (
        <Text style={styles.meta}>{booking.locationName}</Text>
      ) : null}
      {booking.confirmationNumber ? (
        <Text style={styles.code}>Confirmation {booking.confirmationNumber}</Text>
      ) : null}

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
        </View>
      ) : null}
    </Pressable>
  );
}
