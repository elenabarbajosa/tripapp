import { ReactNode } from "react";
import { Text, View } from "react-native";

import { styles } from "./ScreenHeader.styles";

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
}

export function ScreenHeader({ title, subtitle, leftSlot, rightSlot }: ScreenHeaderProps) {
  return (
    <View style={styles.container} accessibilityRole="header">
      <View style={styles.side}>{leftSlot}</View>
      <View style={styles.center}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={[styles.side, styles.sideRight]}>{rightSlot}</View>
    </View>
  );
}
