import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { styles } from "./MapScreen.styles";

export function MapScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.content}>
        <Text style={styles.title}>Map</Text>
        <Text style={styles.body}>
          Map markers, day filters, and Geoapify place search arrive in Phase 8. This shell keeps
          the trip tab structure ready.
        </Text>
      </View>
    </SafeAreaView>
  );
}
