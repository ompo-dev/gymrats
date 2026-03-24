import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const CONFIG_KEY = "gymrats-mobile:config";
const SESSION_KEY = "gymrats_mobile_session";
const SESSION_FALLBACK_KEY = "gymrats-mobile:session";

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
