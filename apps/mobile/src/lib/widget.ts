import { Platform } from "react-native";
import { clearNativeNamespace, readNativeNamespace, writeNativeNamespace } from "./storage";
import type {
  SessionUser,
  StoredWidgetState,
  WidgetPreset,
  WidgetSnapshot,
} from "../store/types";
import { getRoleHomePath } from "../utils/role";

export function getDefaultWidgetState(): StoredWidgetState {
  return {
    preset: "home",
    supportStatus: "unavailable",
    supportReason: "Este build ainda nao inclui a extensao nativa do widget.",
    lastSnapshotAt: null,
    lastSnapshotStatus: "never",
    lastError: null,
    snapshot: null,
  };
}

async function writeStoredWidgetState(state: StoredWidgetState) {
  await writeNativeNamespace("widget", state);
}

export async function readStoredWidgetState() {
  return (
    (await readNativeNamespace<StoredWidgetState>("widget")) ??
    getDefaultWidgetState()
  );
}

export function getWidgetCapability() {
  if (Platform.OS !== "ios" && Platform.OS !== "android") {
    return {
      status: "not-supported" as const,
      reason: "Widgets so fazem sentido em iOS e Android.",
    };
  }

  return {
    status: "unavailable" as const,
    reason: "Este build ainda nao inclui a extensao nativa do widget.",
  };
}

function resolveWidgetRoute(preset: WidgetPreset, user: SessionUser | null) {
  const roleHomePath = getRoleHomePath(user?.role ?? null);
  if (!user) {
    return "/welcome";
  }

  if (preset === "home") {
    return roleHomePath || "/welcome";
  }

  if (user.role === "STUDENT" || user.role === "ADMIN") {
    return "/student";
  }

  if (user.role === "GYM") {
    return "/gym";
  }

  if (user.role === "PERSONAL") {
    return "/personal";
  }

  return roleHomePath || "/welcome";
}

function resolveWidgetSummary(preset: WidgetPreset, user: SessionUser | null) {
  if (!user) {
    return "Abra o app para configurar seu widget.";
  }

  if (preset === "workout") {
    return "Atalho rapido para voltar aos seus treinos dentro do app.";
  }

  if (preset === "nutrition") {
    return "Atalho rapido para voltar ao acompanhamento alimentar.";
  }

  return `Resumo principal da conta ${user.name}.`;
}

function createWidgetSnapshot(
  preset: WidgetPreset,
  user: SessionUser | null,
): WidgetSnapshot {
  return {
    generatedAt: new Date().toISOString(),
    preset,
    route: resolveWidgetRoute(preset, user),
    user: user
      ? {
          name: user.name,
          role: user.role,
        }
      : null,
    summary: resolveWidgetSummary(preset, user),
  };
}

export async function getWidgetStateSnapshot() {
  const currentState = await readStoredWidgetState();
  const capability = getWidgetCapability();
  const nextState: StoredWidgetState = {
    ...currentState,
    supportStatus: capability.status,
    supportReason: capability.reason,
  };

  await writeStoredWidgetState(nextState);
  return nextState;
}

export async function configureWidgetPreset(preset: WidgetPreset) {
  const currentState = await readStoredWidgetState();
  const nextState: StoredWidgetState = {
    ...currentState,
    preset,
    lastError: null,
  };
  await writeStoredWidgetState(nextState);
  return nextState;
}

export async function refreshWidgetSnapshot(user: SessionUser | null) {
  const currentState = await readStoredWidgetState();
  const snapshot = createWidgetSnapshot(currentState.preset, user);
  const nextState: StoredWidgetState = {
    ...currentState,
    snapshot,
    lastSnapshotAt: snapshot.generatedAt,
    lastSnapshotStatus: "updated",
    lastError: null,
  };
  await writeStoredWidgetState(nextState);
  return nextState;
}

export async function clearWidgetSnapshot() {
  const currentState = await readStoredWidgetState();
  const nextState: StoredWidgetState = {
    ...currentState,
    lastSnapshotAt: null,
    lastSnapshotStatus: "never",
    lastError: null,
    snapshot: null,
  };
  await writeStoredWidgetState(nextState);
  return nextState;
}

export async function resetWidgetState() {
  await clearNativeNamespace("widget");
}
