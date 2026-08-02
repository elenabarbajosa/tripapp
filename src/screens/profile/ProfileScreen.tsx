import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { MemberAvatar } from "@/components/MemberAvatar/MemberAvatar";
import { AppButton } from "@/components/ui/AppButton/AppButton";
import { mockCurrentUser } from "@/data/mock";
import { getSupabaseStatusMessage } from "@/services/supabase";
import { styles } from "./ProfileScreen.styles";

export function ProfileScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.content}>
        <MemberAvatar
          name={mockCurrentUser.displayName}
          imageUrl={mockCurrentUser.avatarUrl}
          size="xl"
        />
        <Text style={styles.title}>{mockCurrentUser.displayName}</Text>
        <Text style={styles.body}>{mockCurrentUser.email}</Text>
        <Text style={styles.body}>Preferred currency: {mockCurrentUser.preferredCurrency}</Text>
        <Text style={styles.body}>{getSupabaseStatusMessage()}</Text>
        <AppButton label="Sign out (Phase 2)" variant="secondary" onPress={() => router.replace("/")} />
      </View>
    </SafeAreaView>
  );
}
