import type { ExpoConfig } from "expo/config";

const debugToolsEnabled =
  process.env.EXPO_PUBLIC_ENABLE_MOBILE_DEBUG === "true" ||
  process.env.NODE_ENV !== "production";

const config: ExpoConfig = {
  name: "GymRats",
  icon: "./assets/icon.png",
  slug: "gymrats-mobile",
  version: "1.0.0",
  scheme: "gymrats-mobile",
  orientation: "portrait",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/icon.png",
    resizeMode: "contain",
    backgroundColor: "#f7f7f0",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.gymrats.mobile",
    infoPlist: {
      NSAppTransportSecurity: debugToolsEnabled
        ? {
            NSAllowsArbitraryLoads: true,
            NSAllowsLocalNetworking: true,
          }
        : undefined,
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: "com.gymrats.mobile",
    adaptiveIcon: {
      foregroundImage: "./assets/icon.png",
      backgroundColor: "#f7f7f0",
    },
    permissions: ["android.permission.INTERNET"],
  },
  plugins: [
    [
      "expo-router",
      {
        root: "./app",
      },
    ],
    "expo-secure-store",
    "expo-notifications",
    [
      "expo-web-browser",
      {
        experimentalLauncherActivity: true,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: "e6e6bfee-0a68-4a22-b38c-fa9ac2657d60",
    },
    defaultWebUrl:
      process.env.EXPO_PUBLIC_WEB_URL || "https://gymrats.up.railway.app",
    defaultApiUrl:
      process.env.EXPO_PUBLIC_API_URL ||
      "https://gymrats-production.up.railway.app",
    mobileDebugToolsEnabled: debugToolsEnabled,
  },
};

export default config;
