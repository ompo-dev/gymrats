import Constants from "expo-constants";
import * as Application from "expo-application";
import { Platform } from "react-native";

type RuntimeExtra = {
  defaultWebUrl?: string;
  defaultApiUrl?: string;
  mobileDebugToolsEnabled?: boolean;
};

function getExtra() {
  return (Constants.expoConfig?.extra as RuntimeExtra | undefined) ?? {};
}

export function isDebugToolsEnabled() {
  return __DEV__ || getExtra().mobileDebugToolsEnabled === true;
}

export function getAppVersionLabel() {
  const appVersion =
    Application.nativeApplicationVersion ||
    Constants.expoConfig?.version ||
    "1.0.0";
  const buildVersion = Application.nativeBuildVersion;

  return buildVersion ? `${appVersion} (${buildVersion})` : appVersion;
}

export function getAppOwnership() {
  return Constants.appOwnership ?? "standalone";
}

export function getPlatformName() {
  return Platform.OS;
}
