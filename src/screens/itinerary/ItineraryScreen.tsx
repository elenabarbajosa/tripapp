import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActivityCard } from "@/components/ActivityCard/ActivityCard";
import { AppButton } from "@/components/ui/AppButton/AppButton";
import { mockItineraryDays } from "@/data/mock";
import { formatDisplayDate } from "@/utils/date";
import { styles } from "./ItineraryScreen.styles";

export function ItineraryScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {mockItineraryDays.map((day) => (
          <View key={day.id} style={styles.dayBlock}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayTitle}>{day.label}</Text>
              <Text style={styles.dayMeta}>
                {formatDisplayDate(day.date)}
                {day.destinationCity ? ` · ${day.destinationCity}` : ""}
              </Text>
            </View>
            {day.activities.length === 0 ? (
              <Text style={styles.emptyDay}>No activities planned yet.</Text>
            ) : (
              day.activities.map((activity, index) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  showConnector={index < day.activities.length - 1}
                  onPress={() => undefined}
                />
              ))
            )}
          </View>
        ))}
        <View style={styles.fabSpacer} />
      </ScrollView>
      <View style={styles.fabContainer}>
        <AppButton label="Add activity" onPress={() => undefined} />
      </View>
    </SafeAreaView>
  );
}
