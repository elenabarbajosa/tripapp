import { ActivityIndicator, Text, View } from "react-native";

import { colors } from "@/theme";
import { styles } from "./LoadingState.styles";

export interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label = "Loading…" }: LoadingStateProps) {
  return (
    <View style={styles.container} accessibilityLabel={label}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}
