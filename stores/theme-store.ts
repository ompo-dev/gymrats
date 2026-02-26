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

export const duolingoPresets: ThemePreset[] = [
	{
		id: "duo-green",
		name: "Duolingo Classic",
		colors: {
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
			background: "#131F24",
			backgroundCard: "#1A2D35",
			backgroundElevated: "#213C47",
			foreground: "#FFFFFF",
			foregroundMuted: "#8B9DA5",
			border: "#2B4550",
		},
	},
	{
		id: "duo-blue",
		name: "Ocean Blue",
		colors: {
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
			background: "#0D1B2A",
			backgroundCard: "#152238",
			backgroundElevated: "#1B2F4A",
			foreground: "#FFFFFF",
			foregroundMuted: "#7A8FA0",
			border: "#253B52",
		},
	},
	{
		id: "duo-purple",
		name: "Royal Purple",
		colors: {
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
			background: "#15101F",
			backgroundCard: "#1F1830",
			backgroundElevated: "#2A2040",
			foreground: "#FFFFFF",
			foregroundMuted: "#8B7FA5",
			border: "#352D50",
		},
	},
	{
		id: "duo-pink",
		name: "Flamingo Pink",
		colors: {
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
			background: "#1F1018",
			backgroundCard: "#301825",
			backgroundElevated: "#402030",
			foreground: "#FFFFFF",
			foregroundMuted: "#A58090",
			border: "#502838",
		},
	},
	{
		id: "duo-orange",
		name: "Sunset Orange",
		colors: {
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
			background: "#1F1508",
			backgroundCard: "#302010",
			backgroundElevated: "#402A18",
			foreground: "#FFFFFF",
			foregroundMuted: "#A59080",
			border: "#503820",
		},
	},
];

interface ThemeState {
	activePresetId: string;
	customPresets: ThemePreset[];
	getActiveColors: () => ThemeColors;
	setActivePreset: (id: string) => void;
	addCustomPreset: (preset: ThemePreset) => void;
	removeCustomPreset: (id: string) => void;
}

export const useThemeStore = create<ThemeState>()(
	persist(
		(set, get) => ({
			activePresetId: "duo-green",
			customPresets: [],
			getActiveColors: () => {
				const state = get();
				const allPresets = [...duolingoPresets, ...state.customPresets];
				const preset = allPresets.find((p) => p.id === state.activePresetId);
				return preset?.colors ?? duolingoPresets[0].colors;
			},
			setActivePreset: (id) => set({ activePresetId: id }),
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
