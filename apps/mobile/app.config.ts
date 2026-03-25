import type { ExpoConfig } from "expo/config";
import path from "path";

const config: ExpoConfig = {
  name: "GymRats",
  icon: "./assets/icon.png",
  slug: "gymrats-mobile",
  version: "1.0.0",
  scheme: "gymrats-mobile",
  orientation: "portrait",
  userInterfaceStyle: "light",
  splash: {
    resizeMode: "contain",
    backgroundColor: "#f7f7f0",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.gymrats.mobile",
    infoPlist: {
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: true,
        NSAllowsLocalNetworking: true
      },
      NSCameraUsageDescription:
        "A GymRats usa a camera para recursos exibidos pela plataforma web dentro do app.",
      NSPhotoLibraryUsageDescription:
        "A GymRats usa sua galeria para uploads e imagens de perfil dentro da plataforma.",
      NSLocationWhenInUseUsageDescription:
        "A GymRats usa sua localizacao para exibir academias, unidades e experiencias baseadas em mapa.",
      NSLocalNetworkUsageDescription:
        "A GymRats usa a rede local para conectar o app mobile aos ambientes web e API em desenvolvimento.",
      ITSAppUsesNonExemptEncryption: false
    }
  },
  android: {
    package: "com.gymrats.mobile",
    adaptiveIcon: {
      foregroundImage: "./assets/icon.png",
      backgroundColor: "#f7f7f0"
    },
    permissions: [
      "android.permission.INTERNET",
      "android.permission.CAMERA",
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.WRITE_EXTERNAL_STORAGE"
    ]
  },
  plugins: [
    [
      "expo-router",
      {
        root: "./app",
      },
    ],
    "expo-secure-store",
    [
      "expo-web-browser",
      {
        experimentalLauncherActivity: true
      }
    ]
  ],
  experiments: {
    typedRoutes: true
  },
  extra: {
    eas: {
      projectId: "e6e6bfee-0a68-4a22-b38c-fa9ac2657d60"
    },
    defaultWebUrl:
      process.env.EXPO_PUBLIC_WEB_URL || "https://gym-rats-testes.vercel.app",
    defaultApiUrl:
      process.env.EXPO_PUBLIC_API_URL ||
      "https://gymrats-production.up.railway.app"
  }
};

export default config;
