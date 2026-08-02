import { Text, View } from "react-native";
import { Image } from "expo-image";

import { styles } from "./MemberAvatar.styles";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

export interface MemberAvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: AvatarSize;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function MemberAvatar({ name, imageUrl, size = "md" }: MemberAvatarProps) {
  return (
    <View
      style={[styles.avatar, styles[size]]}
      accessibilityLabel={`${name} avatar`}
      accessibilityRole="image"
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" />
      ) : (
        <Text style={size === "lg" || size === "xl" ? styles.initialsLg : styles.initials}>
          {getInitials(name)}
        </Text>
      )}
    </View>
  );
}
