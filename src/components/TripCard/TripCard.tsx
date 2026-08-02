import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";

import { AvatarGroup } from "@/components/AvatarGroup/AvatarGroup";
import { TripSummary } from "@/types/models";
import { formatCountdown, formatDateRange } from "@/utils/date";
import { styles } from "./TripCard.styles";

export interface TripCardProps {
  trip: TripSummary;
  onPress?: () => void;
  muted?: boolean;
}

export function TripCard({ trip, onPress, muted = false }: TripCardProps) {
  const destinationLabel = trip.destinations.map((d) => d.city).join(" · ");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${trip.name}, ${destinationLabel}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, muted ? styles.mutedCard : null, pressed ? { opacity: 0.94 } : null]}
    >
      <Image
        source={{ uri: trip.coverImageUrl }}
        style={styles.image}
        contentFit="cover"
        accessibilityIgnoresInvertColors
      />
      <View style={styles.body}>
        <Text style={styles.title}>{trip.name}</Text>
        <Text style={styles.destinations}>{destinationLabel}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.dates}>{formatDateRange(trip.startDate, trip.endDate)}</Text>
          {!muted ? <Text style={styles.countdown}>{formatCountdown(trip.startDate)}</Text> : null}
        </View>
        <View style={styles.footer}>
          <AvatarGroup members={trip.members.map((m) => m.profile)} />
          <Text style={styles.travellers}>
            {trip.travellerCount} {trip.travellerCount === 1 ? "traveller" : "travellers"}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
