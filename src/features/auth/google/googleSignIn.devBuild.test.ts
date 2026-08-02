jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    expoGoConfig: null,
  },
}));

const mockSignInNative = jest.fn(async () => undefined);

jest.mock("@/features/auth/google/googleSignInNative", () => ({
  signInWithGoogleIdTokenNative: mockSignInNative,
  resetGoogleNativeConfigurationForTests: jest.fn(),
}));

jest.mock("@/constants/config", () => ({
  isSupabaseConfigured: () => true,
  isGoogleSignInConfigured: () => true,
  getGoogleConfigMessage: () => "Google sign-in is not configured yet.",
}));

describe("Google development-build path", () => {
  beforeEach(() => {
    mockSignInNative.mockClear();
  });

  it("reports available and dynamically loads the native adapter", async () => {
    jest.resetModules();
    jest.doMock("expo-constants", () => ({
      __esModule: true,
      default: { expoGoConfig: null },
    }));
    jest.doMock("@/features/auth/google/googleSignInNative", () => ({
      signInWithGoogleIdTokenNative: mockSignInNative,
    }));
    jest.doMock("@/constants/config", () => ({
      isSupabaseConfigured: () => true,
      isGoogleSignInConfigured: () => true,
      getGoogleConfigMessage: () => "Google sign-in is not configured yet.",
    }));

    const {
      isGoogleNativeSignInAvailable,
      signInWithGoogleIdToken,
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- fresh module after mocks
    } = require("@/features/auth/google/googleSignIn") as typeof import("@/features/auth/google/googleSignIn");

    expect(isGoogleNativeSignInAvailable()).toBe(true);
    await signInWithGoogleIdToken();
    expect(mockSignInNative).toHaveBeenCalledTimes(1);
  });
});
