import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGlobalSearchParams, useRouter } from "expo-router";

import { isValidUuid, resolveRouteParam } from "@/utils/routeParams";
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
  // Nested tabs do not always inherit [tripId] via useLocalSearchParams.
  // useGlobalSearchParams is required to read the parent dynamic segment.
  const params = useGlobalSearchParams<{ tripId?: string | string[] }>();
  const tripId = resolveRouteParam(params.tripId);

  const openLink = (path: (typeof moreLinks)[number]["path"]) => {
    if (!isValidUuid(tripId)) {
      return;
    }

    if (path === "group") {
      // Explicit params — never interpolate a missing id into the path.
      router.push({
        pathname: "/trips/[tripId]/group",
        params: { tripId },
      });
      return;
    }

    router.push({
      pathname: `/trips/[tripId]/${path}`,
      params: { tripId },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.content}>
        <Text style={styles.title}>More</Text>
        {moreLinks.map((link) => (
          <Pressable
            key={link.path}
            accessibilityRole="button"
            accessibilityLabel={link.label}
            onPress={() => openLink(link.path)}
          >
            <Text style={styles.item}>{link.label}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}
