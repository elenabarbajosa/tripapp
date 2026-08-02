import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * Google iOS URL scheme is the reversed iOS OAuth client ID.
 * Kept inline here because Expo evaluates app.config in isolation.
 * Mirror: src/features/auth/googleConfig.ts
 */
function iosUrlSchemeFromClientId(iosClientId: string | undefined): string | undefined {
  const trimmed = (iosClientId ?? "").trim();
  if (!trimmed) {
    return undefined;
  }

  const suffix = ".apps.googleusercontent.com";
  if (!trimmed.endsWith(suffix)) {
    return undefined;
  }

  const id = trimmed.slice(0, -suffix.length);
  if (!id) {
    return undefined;
  }

  return `com.googleusercontent.apps.${id}`;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const iosUrlScheme = iosUrlSchemeFromClientId(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID);

  const googleSignInPlugin: NonNullable<ExpoConfig["plugins"]>[number] = iosUrlScheme
    ? ["@react-native-google-signin/google-signin", { iosUrlScheme }]
    : "@react-native-google-signin/google-signin";

  return {
    ...config,
    name: "TripApp",
    slug: "tripapp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    scheme: "tripapp",
    userInterfaceStyle: "light",
    // MapLibre RN v11 requires the New Architecture (typed as ExpoConfig cast).
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.tripapp.app",
      usesAppleSignIn: true,
      infoPlist: {
        CFBundleDisplayName: "TripApp",
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#2563EB",
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png",
      },
      package: "com.tripapp.app",
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro",
    },
    plugins: [
      "expo-router",
      "expo-secure-store",
      "expo-image",
      "expo-font",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#F7F9FC",
          image: "./assets/splash-icon.png",
          imageWidth: 200,
        },
      ],
      googleSignInPlugin,
      "expo-apple-authentication",
      "@maplibre/maplibre-react-native",
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: "replace-with-eas-project-id",
      },
    },
  } as ExpoConfig;
};
