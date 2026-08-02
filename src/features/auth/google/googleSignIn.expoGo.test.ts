/**
 * Regression: importing AuthProvider / AppProviders in Expo Go must never
 * evaluate googleSignInNative.ts (which statically imports RNGoogleSignin).
 */
type ExpoGoTestState = {
  nativeModuleLoadCount: number;
};

function getState(): ExpoGoTestState {
  return (globalThis as { __tripappGoogleExpoGoTest?: ExpoGoTestState }).__tripappGoogleExpoGoTest!;
}

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    expoGoConfig: { debuggerHost: "localhost:8081" },
  },
}));

jest.mock("@/features/auth/google/googleSignInNative", () => {
  const state = (globalThis as { __tripappGoogleExpoGoTest?: ExpoGoTestState })
    .__tripappGoogleExpoGoTest;
  if (state) {
    state.nativeModuleLoadCount += 1;
  }
  throw new Error("googleSignInNative must not be imported in Expo Go");
});

jest.mock("@/theme", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe("Google Expo Go startup boundary", () => {
  beforeEach(() => {
    (globalThis as { __tripappGoogleExpoGoTest?: ExpoGoTestState }).__tripappGoogleExpoGoTest = {
      nativeModuleLoadCount: 0,
    };
    jest.resetModules();
    jest.doMock("expo-constants", () => ({
      __esModule: true,
      default: {
        expoGoConfig: { debuggerHost: "localhost:8081" },
      },
    }));
    jest.doMock("@/features/auth/google/googleSignInNative", () => {
      getState().nativeModuleLoadCount += 1;
      throw new Error("googleSignInNative must not be imported in Expo Go");
    });
    jest.doMock("@/theme", () => ({
      ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
    }));
  });

  it("imports AuthProvider without loading googleSignInNative", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- assert module graph isolation
    require("@/features/auth/AuthProvider");
    expect(getState().nativeModuleLoadCount).toBe(0);
  });

  it("imports AppProviders without loading googleSignInNative", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- assert module graph isolation
    require("@/providers/AppProviders");
    expect(getState().nativeModuleLoadCount).toBe(0);
  });

  it("keeps Google unavailable and never loads native on sign-in attempt", async () => {
    const {
      isGoogleNativeSignInAvailable,
      getGoogleSignInUnavailableMessage,
      signInWithGoogleIdToken,
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- fresh module after Expo Go mock
    } = require("@/features/auth/google/googleSignIn") as typeof import("@/features/auth/google/googleSignIn");

    expect(isGoogleNativeSignInAvailable()).toBe(false);
    expect(getGoogleSignInUnavailableMessage()).toContain("development build");
    expect(getState().nativeModuleLoadCount).toBe(0);

    await expect(signInWithGoogleIdToken()).rejects.toThrow(/development build/);
    expect(getState().nativeModuleLoadCount).toBe(0);
  });
});
