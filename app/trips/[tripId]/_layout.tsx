import { Stack } from "expo-router";

import { colors } from "@/theme";

export default function TripLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="activities/new" />
      <Stack.Screen name="activities/[activityId]/edit" />
      <Stack.Screen name="bookings" />
      <Stack.Screen name="expenses" />
      <Stack.Screen name="packing" />
      <Stack.Screen name="ideas" />
      <Stack.Screen name="votes" />
      <Stack.Screen name="group" />
      <Stack.Screen name="invite" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
