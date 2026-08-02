import { Text } from "react-native";

import { AppCard } from "@/components/ui/AppCard/AppCard";
import { StatusBadge } from "@/components/ui/StatusBadge/StatusBadge";
import { BookingSummary } from "@/types/models";
import { styles } from "./BookingCard.styles";

export interface BookingCardProps {
  booking: BookingSummary;
}

export function BookingCard({ booking }: BookingCardProps) {
  return (
    <AppCard accessibilityLabel={`${booking.title}. ${booking.subtitle}`}>
      <StatusBadge label={booking.type.replace("_", " ")} variant="invitation" />
      <Text style={styles.title}>{booking.title}</Text>
      <Text style={styles.subtitle}>{booking.subtitle}</Text>
      {booking.confirmationCode ? (
        <Text style={styles.code}>Confirmation {booking.confirmationCode}</Text>
      ) : null}
    </AppCard>
  );
}
