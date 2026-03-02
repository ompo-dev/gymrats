import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  secondaryDark: string;
  accent: string;
  accentDark: string;
  success: string;
  successDark: string;
  warning: string;
  warningDark: string;
  danger: string;
  dangerDark: string;
  background: string;
  backgroundCard: string;
  backgroundElevated: string;
  foreground: string;
  foregroundMuted: string;
  border: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  colors: ThemeColors;
}

/** Cores base (primárias, accent, etc.) - compartilhadas entre light e dark */
const baseColors = {
  duoGreen: {
    primary: "#58CC02",
    primaryDark: "#46A302",
    primaryLight: "#89E219",
    secondary: "#1CB0F6",
    secondaryDark: "#1899D6",
    accent: "#FF9600",
    accentDark: "#E08600",
    success: "#58CC02",
    successDark: "#46A302",
    warning: "#FFC800",
    warningDark: "#E0B000",
    danger: "#FF4B4B",
    dangerDark: "#E04040",
  },
  duoBlue: {
    primary: "#1CB0F6",
    primaryDark: "#1899D6",
    primaryLight: "#4DC4F9",
    secondary: "#58CC02",
    secondaryDark: "#46A302",
    accent: "#FF9600",
    accentDark: "#E08600",
    success: "#58CC02",
    successDark: "#46A302",
    warning: "#FFC800",
    warningDark: "#E0B000",
    danger: "#FF4B4B",
    dangerDark: "#E04040",
  },
  duoPurple: {
    primary: "#A560E8",
    primaryDark: "#8B47CC",
    primaryLight: "#BE84F0",
    secondary: "#1CB0F6",
    secondaryDark: "#1899D6",
    accent: "#FF9600",
    accentDark: "#E08600",
    success: "#58CC02",
    successDark: "#46A302",
    warning: "#FFC800",
    warningDark: "#E0B000",
    danger: "#FF4B4B",
    dangerDark: "#E04040",
  },
  duoPink: {
    primary: "#FF86D0",
    primaryDark: "#E070B8",
    primaryLight: "#FFA4DD",
    secondary: "#1CB0F6",
    secondaryDark: "#1899D6",
    accent: "#FF9600",
    accentDark: "#E08600",
    success: "#58CC02",
    successDark: "#46A302",
    warning: "#FFC800",
    warningDark: "#E0B000",
    danger: "#FF4B4B",
    dangerDark: "#E04040",
  },
  duoOrange: {
    primary: "#FF9600",
    primaryDark: "#E08600",
    primaryLight: "#FFB040",
    secondary: "#1CB0F6",
    secondaryDark: "#1899D6",
    accent: "#58CC02",
    accentDark: "#46A302",
    success: "#58CC02",
    successDark: "#46A302",
    warning: "#FFC800",
    warningDark: "#E0B000",
    danger: "#FF4B4B",
    dangerDark: "#E04040",
  },
} as const;

const lightSurfaces = {
  duoGreen: {
    background: "#F5F7F6",
    backgroundCard: "#FFFFFF",
    backgroundElevated: "#E8ECEA",
    foreground: "#131F24",
    foregroundMuted: "#5A6B63",
    border: "#D1D9D6",
  },
  duoBlue: {
    background: "#F0F7FC",
    backgroundCard: "#FFFFFF",
    backgroundElevated: "#E1EEF6",
    foreground: "#0D1B2A",
    foregroundMuted: "#4A6B7C",
    border: "#C5D9E8",
  },
  duoPurple: {
    background: "#F5F2F8",
    backgroundCard: "#FFFFFF",
    backgroundElevated: "#E8E2F0",
    foreground: "#15101F",
    foregroundMuted: "#5A5270",
    border: "#D4CCE0",
  },
  duoPink: {
    background: "#FDF5F9",
    backgroundCard: "#FFFFFF",
    backgroundElevated: "#F5E5EE",
    foreground: "#1F1018",
    foregroundMuted: "#7A5A6A",
    border: "#E8D4DE",
  },
  duoOrange: {
    background: "#FFF9F2",
    backgroundCard: "#FFFFFF",
    backgroundElevated: "#F5EDE2",
    foreground: "#1F1508",
    foregroundMuted: "#7A6A4A",
    border: "#E8DCC8",
  },
} as const;

const darkSurfaces = {
  duoGreen: {
    background: "#131F24",
    backgroundCard: "#1A2D35",
    backgroundElevated: "#213C47",
    foreground: "#FFFFFF",
    foregroundMuted: "#8B9DA5",
    border: "#2B4550",
  },
  duoBlue: {
    background: "#0D1B2A",
    backgroundCard: "#152238",
    backgroundElevated: "#1B2F4A",
    foreground: "#FFFFFF",
    foregroundMuted: "#7A8FA0",
    border: "#253B52",
  },
  duoPurple: {
    background: "#15101F",
    backgroundCard: "#1F1830",
    backgroundElevated: "#2A2040",
    foreground: "#FFFFFF",
    foregroundMuted: "#8B7FA5",
    border: "#352D50",
  },
  duoPink: {
    background: "#1F1018",
    backgroundCard: "#301825",
    backgroundElevated: "#402030",
    foreground: "#FFFFFF",
    foregroundMuted: "#A58090",
    border: "#502838",
  },
  duoOrange: {
    background: "#1F1508",
    backgroundCard: "#302010",
    backgroundElevated: "#402A18",
    foreground: "#FFFFFF",
    foregroundMuted: "#A59080",
    border: "#503820",
  },
} as const;

type PresetKey = keyof typeof baseColors;

type SurfaceShape = {
  background: string;
  backgroundCard: string;
  backgroundElevated: string;
  foreground: string;
  foregroundMuted: string;
  border: string;
};

function buildPreset(
  id: string,
  name: string,
  baseKey: PresetKey,
  surfaces: SurfaceShape,
): ThemePreset {
  const base = baseColors[baseKey];
  return {
    id,
    name,
    colors: {
      ...base,
      ...surfaces,
    },
  };
}

export const duolingoPresets: ThemePreset[] = [
  buildPreset(
    "duo-green",
    "Duolingo Classic",
    "duoGreen",
    darkSurfaces.duoGreen,
  ),
  buildPreset("duo-blue", "Ocean Blue", "duoBlue", darkSurfaces.duoBlue),
  buildPreset(
    "duo-purple",
    "Royal Purple",
    "duoPurple",
    darkSurfaces.duoPurple,
  ),
  buildPreset("duo-pink", "Flamingo Pink", "duoPink", darkSurfaces.duoPink),
  buildPreset(
    "duo-orange",
    "Sunset Orange",
    "duoOrange",
    darkSurfaces.duoOrange,
  ),
];

/** Presets light - fundo claro, texto escuro */
export const duolingoPresetsLight: ThemePreset[] = [
  buildPreset(
    "duo-green-light",
    "Duolingo Classic (Claro)",
    "duoGreen",
    lightSurfaces.duoGreen,
  ),
  buildPreset(
    "duo-blue-light",
    "Ocean Blue (Claro)",
    "duoBlue",
    lightSurfaces.duoBlue,
  ),
  buildPreset(
    "duo-purple-light",
    "Royal Purple (Claro)",
    "duoPurple",
    lightSurfaces.duoPurple,
  ),
  buildPreset(
    "duo-pink-light",
    "Flamingo Pink (Claro)",
    "duoPink",
    lightSurfaces.duoPink,
  ),
  buildPreset(
    "duo-orange-light",
    "Sunset Orange (Claro)",
    "duoOrange",
    lightSurfaces.duoOrange,
  ),
];

/** Mapeamento preset base → ids light/dark */
export const presetModeMap: Record<string, { light: string; dark: string }> = {
  "duo-green": { light: "duo-green-light", dark: "duo-green" },
  "duo-blue": { light: "duo-blue-light", dark: "duo-blue" },
  "duo-purple": { light: "duo-purple-light", dark: "duo-purple" },
  "duo-pink": { light: "duo-pink-light", dark: "duo-pink" },
  "duo-orange": { light: "duo-orange-light", dark: "duo-orange" },
  "duo-green-light": { light: "duo-green-light", dark: "duo-green" },
  "duo-blue-light": { light: "duo-blue-light", dark: "duo-blue" },
  "duo-purple-light": { light: "duo-purple-light", dark: "duo-purple" },
  "duo-pink-light": { light: "duo-pink-light", dark: "duo-pink" },
  "duo-orange-light": { light: "duo-orange-light", dark: "duo-orange" },
};

export type ColorMode = "light" | "dark";

interface ThemeState {
  activePresetId: string;
  colorMode: ColorMode;
  customPresets: ThemePreset[];
  getActiveColors: () => ThemeColors;
  setActivePreset: (id: string) => void;
  setColorMode: (mode: ColorMode) => void;
  toggleColorMode: () => void;
  addCustomPreset: (preset: ThemePreset) => void;
  removeCustomPreset: (id: string) => void;
}

const allBuiltInPresets = [...duolingoPresets, ...duolingoPresetsLight];

function resolvePresetId(activePresetId: string, colorMode: ColorMode): string {
  const map = presetModeMap[activePresetId];
  if (!map) return activePresetId; // custom preset, sem mapeamento
  return colorMode === "light" ? map.light : map.dark;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      activePresetId: "duo-green",
      colorMode: "light",
      customPresets: [],
      getActiveColors: () => {
        const state = get();
        const colorMode = state.colorMode ?? "light";
        const resolvedId = resolvePresetId(state.activePresetId, colorMode);
        const allPresets = [...allBuiltInPresets, ...state.customPresets];
        const preset = allPresets.find((p) => p.id === resolvedId);
        if (preset) return preset.colors;
        // Fallback: preset custom ou id antigo → usar light por padrão
        const fallback = duolingoPresetsLight[0];
        return fallback?.colors ?? duolingoPresets[0].colors;
      },
      setActivePreset: (id) => set({ activePresetId: id }),
      setColorMode: (mode) => set({ colorMode: mode }),
      toggleColorMode: () =>
        set((s) => ({ colorMode: s.colorMode === "light" ? "dark" : "light" })),
      addCustomPreset: (preset) =>
        set((state) => ({
          customPresets: [...state.customPresets, preset],
        })),
      removeCustomPreset: (id) =>
        set((state) => ({
          customPresets: state.customPresets.filter((p) => p.id !== id),
          activePresetId:
            state.activePresetId === id ? "duo-green" : state.activePresetId,
        })),
    }),
    {
      name: "duo-theme-storage",
    },
  ),
);
