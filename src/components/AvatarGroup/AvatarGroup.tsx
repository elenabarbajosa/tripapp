import { Text, View } from "react-native";

import { MemberAvatar } from "@/components/MemberAvatar/MemberAvatar";
import { ProfileSummary } from "@/types/models";
import { styles } from "./AvatarGroup.styles";

export interface AvatarGroupProps {
  members: Pick<ProfileSummary, "displayName" | "avatarUrl">[];
  maxVisible?: number;
}

export function AvatarGroup({ members, maxVisible = 4 }: AvatarGroupProps) {
  const visible = members.slice(0, maxVisible);
  const remaining = members.length - visible.length;

  return (
    <View
      style={styles.row}
      accessibilityLabel={`${members.length} travellers`}
    >
      {visible.map((member, index) => (
        <View key={`${member.displayName}-${index}`} style={index === 0 ? null : styles.overlap}>
          <MemberAvatar name={member.displayName} imageUrl={member.avatarUrl} size="sm" />
        </View>
      ))}
      {remaining > 0 ? <Text style={styles.count}>+{remaining}</Text> : null}
    </View>
  );
}
