import { ActivityIndicator, Text, View } from "react-native";

import { branding } from "@/constants/branding";
import { colors } from "@/theme";
import { styles } from "./AuthBootstrap.styles";

export function AuthBootstrap() {
  return (
    <View style={styles.root} accessibilityLabel="Restoring your session">
      <Text style={styles.brand}>{branding.productName}</Text>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.label}>Restoring your session…</Text>
    </View>
  );
}
