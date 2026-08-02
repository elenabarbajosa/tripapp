import { Stack } from "expo-router";

import { CreateTripDraftProvider } from "@/features/trips/CreateTripDraftProvider";

export default function CreateTripLayout() {
  return (
    <CreateTripDraftProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </CreateTripDraftProvider>
  );
}
