import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { AppButton } from "@/components/ui/AppButton/AppButton";
import { styles } from "./PlaceholderScreen.styles";

export interface PlaceholderScreenProps {
  title: string;
  body: string;
}

export function PlaceholderScreen({ title, body }: PlaceholderScreenProps) {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
        <AppButton label="Go back" variant="secondary" onPress={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}
