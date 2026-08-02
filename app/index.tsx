import { Redirect } from "expo-router";

/**
 * Phase 1 entry: land on welcome.
 * Phase 2 will redirect based on auth session.
 */
export default function Index() {
  return <Redirect href="/(auth)/welcome" />;
}
