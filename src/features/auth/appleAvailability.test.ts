import { Platform } from "react-native";

import { isAppleSignInAvailable } from "@/features/auth/appleSignIn";

describe("apple platform availability", () => {
  const originalOs = Platform.OS;

  afterEach(() => {
    Object.defineProperty(Platform, "OS", {
      configurable: true,
      get: () => originalOs,
    });
  });

  it("is unavailable on android", async () => {
    Object.defineProperty(Platform, "OS", {
      configurable: true,
      get: () => "android",
    });

    await expect(isAppleSignInAvailable()).resolves.toBe(false);
  });
});
