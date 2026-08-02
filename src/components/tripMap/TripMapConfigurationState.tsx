import { Text, View } from "react-native";

import { styles } from "./TripMapConfigurationState.styles";

export function TripMapConfigurationState() {
  return (
    <View style={styles.container} accessibilityRole="summary">
      <Text style={styles.title}>Map tiles are not configured</Text>
      <Text style={styles.body}>
        The interactive map needs a Geoapify map-tiles key. You can still browse mapped places in
        the list below.
      </Text>
      {__DEV__ ? (
        <Text style={styles.dev}>
          Development setup: add EXPO_PUBLIC_GEOAPIFY_MAP_KEY to .env (map-tiles key only — never
          reuse the private GEOAPIFY_API_KEY), then rebuild the native app. This feature does not
          run in Expo Go.
        </Text>
      ) : null}
    </View>
  );
}
