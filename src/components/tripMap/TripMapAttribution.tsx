import { Linking, Pressable, Text, View } from "react-native";

import { styles } from "./TripMapAttribution.styles";

const LINKS = [
  {
    label: "© OpenStreetMap contributors",
    url: "https://www.openstreetmap.org/copyright",
  },
  {
    label: "© OpenMapTiles",
    url: "https://openmaptiles.org/",
  },
  {
    label: "Geoapify",
    url: "https://www.geoapify.com/",
  },
] as const;

export function TripMapAttribution() {
  return (
    <View
      style={styles.container}
      accessibilityRole="summary"
      accessibilityLabel="Map data attribution"
    >
      {LINKS.map((link, index) => (
        <Pressable
          key={link.url}
          accessibilityRole="link"
          accessibilityLabel={link.label}
          onPress={() => {
            void Linking.openURL(link.url);
          }}
          style={styles.link}
        >
          <Text style={styles.text}>
            {link.label}
            {index < LINKS.length - 1 ? " · " : ""}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
