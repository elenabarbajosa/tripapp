import Constants from "expo-constants";

/**
 * True when the JS bundle is running inside Expo Go.
 *
 * Prefer `expoGoConfig` over `ExecutionEnvironment.StoreClient` alone:
 * StoreClient also covers custom `expo-dev-client` development builds.
 */
export function isExpoGo(): boolean {
  return Constants.expoGoConfig != null;
}
