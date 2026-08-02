jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    expoGoConfig: { debuggerHost: "localhost" },
  },
}));

describe("runtimeEnvironment", () => {
  it("detects Expo Go via expoGoConfig", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- load after Constants mock
    const { isExpoGo } = require("@/features/auth/runtimeEnvironment") as typeof import("@/features/auth/runtimeEnvironment");
    expect(isExpoGo()).toBe(true);
  });

  it("leaves Preview mode development-only and unaffected", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- keep import order free of lint noise
    const { shouldShowDevPreviewButton } = require("@/features/auth/authState") as typeof import("@/features/auth/authState");
    expect(shouldShowDevPreviewButton(true)).toBe(true);
    expect(shouldShowDevPreviewButton(false)).toBe(false);
  });
});
