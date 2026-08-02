import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import { styles } from "./MoreScreen.styles";

const moreLinks = [
  { label: "Bookings", path: "bookings" },
  { label: "Expenses", path: "expenses" },
  { label: "Packing", path: "packing" },
  { label: "Ideas", path: "ideas" },
  { label: "Votes", path: "votes" },
  { label: "Group", path: "group" },
  { label: "Trip settings", path: "settings" },
] as const;

export function MoreScreen() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams<{ tripId: string }>();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.content}>
        <Text style={styles.title}>More</Text>
        {moreLinks.map((link) => (
          <Pressable
            key={link.path}
            accessibilityRole="button"
            accessibilityLabel={link.label}
            onPress={() => router.push(`/trips/${tripId}/${link.path}`)}
          >
            <Text style={styles.item}>{link.label}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}
