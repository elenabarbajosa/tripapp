import { PropsWithChildren } from "react";
import { View, ViewProps } from "react-native";

import { styles } from "./AppCard.styles";

export interface AppCardProps extends PropsWithChildren {
  variant?: "default" | "elevated" | "muted";
  accessibilityLabel?: string;
  style?: ViewProps["style"];
}

export function AppCard({
  children,
  variant = "default",
  accessibilityLabel,
  style,
}: AppCardProps) {
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.card,
        variant === "elevated" ? styles.elevated : null,
        variant === "muted" ? styles.muted : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}
