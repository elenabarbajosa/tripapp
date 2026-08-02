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
      <Stack.Screen name="bookings/index" />
      <Stack.Screen name="bookings/new" />
      <Stack.Screen name="bookings/[bookingId]/index" />
      <Stack.Screen name="bookings/[bookingId]/edit" />
      <Stack.Screen name="expenses/index" />
      <Stack.Screen name="expenses/new" />
      <Stack.Screen name="expenses/[expenseId]/index" />
      <Stack.Screen name="expenses/[expenseId]/edit" />
      <Stack.Screen name="expenses/settlements/new" />
      <Stack.Screen name="packing/index" />
      <Stack.Screen name="packing/new" />
      <Stack.Screen name="packing/[itemId]/edit" />
      <Stack.Screen name="ideas/index" />
      <Stack.Screen name="ideas/new" />
      <Stack.Screen name="ideas/[ideaId]/edit" />
      <Stack.Screen name="ideas/[ideaId]/add-to-itinerary" />
      <Stack.Screen name="votes" />
      <Stack.Screen name="group" />
      <Stack.Screen name="invite" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
