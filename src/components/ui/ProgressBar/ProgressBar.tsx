import { View } from "react-native";

import { styles } from "./ProgressBar.styles";

export interface ProgressBarProps {
  progress: number;
  accessibilityLabel?: string;
}

export function ProgressBar({ progress, accessibilityLabel }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, progress));

  return (
    <View
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel ?? `Progress ${clamped}%`}
      accessibilityValue={{ min: 0, max: 100, now: clamped }}
    >
      <View style={[styles.fill, { width: `${clamped}%` }]} />
    </View>
  );
}
