/* eslint-disable @typescript-eslint/no-require-imports -- Jest mock factories require sync require() */
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

jest.mock("expo-crypto", () => ({
  CryptoDigestAlgorithm: { SHA256: "SHA-256" },
  randomUUID: jest.fn(() => "test-raw-nonce"),
  digestStringAsync: jest.fn(async () => "test-hashed-nonce"),
}));

jest.mock("expo-apple-authentication", () => ({
  AppleAuthenticationScope: {
    FULL_NAME: 0,
    EMAIL: 1,
  },
  AppleAuthenticationButtonType: {
    CONTINUE: 1,
    SIGN_IN: 0,
  },
  AppleAuthenticationButtonStyle: {
    BLACK: 0,
    WHITE: 1,
  },
  AppleAuthenticationButton: "AppleAuthenticationButton",
  isAvailableAsync: jest.fn(async () => false),
  signInAsync: jest.fn(),
}));

jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(async () => true),
    signIn: jest.fn(),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: "SIGN_IN_CANCELLED",
    IN_PROGRESS: "IN_PROGRESS",
    PLAY_SERVICES_NOT_AVAILABLE: "PLAY_SERVICES_NOT_AVAILABLE",
  },
  isErrorWithCode: (error: unknown) =>
    Boolean(error && typeof error === "object" && "code" in error),
  isSuccessResponse: (response: { type?: string }) => response?.type === "success",
}));
