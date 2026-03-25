import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import type { NativeStorageNamespace } from "../store/types";

const CONFIG_KEY = "gymrats-mobile:config";
const SESSION_KEY = "gymrats_mobile_session";
const SESSION_FALLBACK_KEY = "gymrats-mobile:session";
const INSTALLATION_KEY = "gymrats-mobile:installation-id";
const NATIVE_NAMESPACE_PREFIX = "gymrats-mobile:native";

function getNamespaceKey(namespace: NativeStorageNamespace) {
  return `${NATIVE_NAMESPACE_PREFIX}:${namespace}`;
}

export async function loadJsonStorage<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function saveJsonStorage(key: string, value: unknown) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function removeJsonStorage(key: string) {
  await AsyncStorage.removeItem(key);
}

export async function readStoredConfig<T>() {
  return loadJsonStorage<T>(CONFIG_KEY);
}

export async function writeStoredConfig(value: unknown) {
  await saveJsonStorage(CONFIG_KEY, value);
}

export async function readStoredSession<T>() {
  let raw: string | null = null;

  try {
    raw = await SecureStore.getItemAsync(SESSION_KEY);
  } catch {
    raw = await AsyncStorage.getItem(SESSION_FALLBACK_KEY);
  }

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function writeStoredSession(value: unknown) {
  const payload = JSON.stringify(value);

  try {
    await SecureStore.setItemAsync(SESSION_KEY, payload);
    await AsyncStorage.removeItem(SESSION_FALLBACK_KEY);
  } catch {
    await AsyncStorage.setItem(SESSION_FALLBACK_KEY, payload);
  }
}

export async function clearStoredSession() {
  try {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  } catch {
    // noop
  }

  await AsyncStorage.removeItem(SESSION_FALLBACK_KEY);
}

export async function readNativeNamespace<T>(namespace: NativeStorageNamespace) {
  return loadJsonStorage<T>(getNamespaceKey(namespace));
}

export async function writeNativeNamespace(
  namespace: NativeStorageNamespace,
  value: unknown,
) {
  await saveJsonStorage(getNamespaceKey(namespace), value);
}

export async function clearNativeNamespace(namespace: NativeStorageNamespace) {
  await removeJsonStorage(getNamespaceKey(namespace));
}

export async function readStoredInstallationId() {
  return AsyncStorage.getItem(INSTALLATION_KEY);
}

export async function writeStoredInstallationId(installationId: string) {
  await AsyncStorage.setItem(INSTALLATION_KEY, installationId);
}

export async function clearStoredInstallationId() {
  await AsyncStorage.removeItem(INSTALLATION_KEY);
}
