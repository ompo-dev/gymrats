"use client";

import { Check, Moon, Palette, Plus, Sun, Trash2 } from "lucide-react";
import { useState, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import {
	duolingoPresets,
	duolingoPresetsLight,
	presetModeMap,
	useThemeStore,
	type ThemePreset,
} from "@/stores/theme-store";
import { DuoButton } from "../atoms/duo-button";
import { DuoModal } from "../molecules/duo-modal";

const BASE_PRESET_IDS = ["duo-green", "duo-blue", "duo-purple", "duo-pink", "duo-orange"] as const;
const BASE_PRESET_NAMES: Record<(typeof BASE_PRESET_IDS)[number], string> = {
	"duo-green": "Duolingo Classic",
	"duo-blue": "Ocean Blue",
	"duo-purple": "Royal Purple",
	"duo-pink": "Flamingo Pink",
	"duo-orange": "Sunset Orange",
};

interface DuoColorPickerProps extends HTMLAttributes<HTMLDivElement> {
	compact?: boolean;
}

function adjustBrightness(hex: string, amount: number): string {
	const num = parseInt(hex.replace("#", ""), 16);
	const r = Math.min(255, Math.max(0, (num >> 16) + amount));
	const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
	const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
	return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function DuoColorPickerSimple({
	compact = false,
	className,
	...props
}: DuoColorPickerProps) {
	const {
		activePresetId,
		colorMode: rawColorMode,
		setActivePreset,
		setColorMode,
		toggleColorMode,
		customPresets,
		addCustomPreset,
		removeCustomPreset,
	} = useThemeStore();
	const colorMode = rawColorMode ?? "light";
	const [isOpen, setIsOpen] = useState(false);
	const [customColor, setCustomColor] = useState("#58CC02");
	const [customName, setCustomName] = useState("");

	const activeBaseId = presetModeMap[activePresetId]?.dark ?? activePresetId;

	function handleAddCustom() {
		if (!customName.trim()) return;
		const preset: ThemePreset = {
			id: `custom-${Date.now()}`,
			name: customName,
			colors: {
				primary: customColor,
				primaryDark: adjustBrightness(customColor, -20),
				primaryLight: adjustBrightness(customColor, 30),
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
		};
		addCustomPreset(preset);
		setActivePreset(preset.id);
		setColorMode("dark");
		setCustomName("");
		setIsOpen(false);
	}

	if (compact) {
		return (
			<div className={cn("flex items-center gap-2", className)} {...props}>
				<button
					onClick={toggleColorMode}
					className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[var(--duo-border)] text-[var(--duo-fg-muted)] transition-all hover:scale-110 hover:border-[var(--duo-primary)] hover:text-[var(--duo-primary)]"
					aria-label={colorMode === "light" ? "Modo escuro" : "Modo claro"}
					title={colorMode === "light" ? "Mudar para escuro" : "Mudar para claro"}
				>
					{colorMode === "light" ? <Moon size={14} /> : <Sun size={14} />}
				</button>
				{BASE_PRESET_IDS.map((baseId) => {
					const map = presetModeMap[baseId];
					const resolvedId = colorMode === "light" ? map.light : map.dark;
					const preset = [...duolingoPresets, ...duolingoPresetsLight].find((p) => p.id === resolvedId);
					if (!preset) return null;
					const isActive = activeBaseId === baseId;
					return (
						<button
							key={baseId}
							onClick={() => setActivePreset(baseId)}
							className={cn(
								"flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all duration-200 hover:scale-110 active:scale-90",
								isActive ? "scale-110 border-white shadow-lg" : "border-transparent",
							)}
							style={{ backgroundColor: preset.colors.primary }}
							aria-label={`Tema: ${preset.name}`}
							title={preset.name}
						>
							{isActive && (
								<Check size={14} className="mx-auto text-white drop-shadow-sm" />
							)}
						</button>
					);
				})}
				{customPresets.map((preset) => (
					<button
						key={preset.id}
						onClick={() => setActivePreset(preset.id)}
						className={cn(
							"flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all duration-200 hover:scale-110 active:scale-90",
							activePresetId === preset.id ? "scale-110 border-white shadow-lg" : "border-transparent",
						)}
						style={{ backgroundColor: preset.colors.primary }}
						aria-label={`Tema: ${preset.name}`}
						title={preset.name}
					>
						{activePresetId === preset.id && (
							<Check size={14} className="mx-auto text-white drop-shadow-sm" />
						)}
					</button>
				))}
				<button
					onClick={() => setIsOpen(true)}
					className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-dashed border-[var(--duo-fg-muted)] text-[var(--duo-fg-muted)] transition-all duration-200 hover:scale-110 hover:border-[var(--duo-primary)] hover:text-[var(--duo-primary)]"
					aria-label="Adicionar tema personalizado"
				>
					<Plus size={12} />
				</button>

				<DuoModal.Simple
					isOpen={isOpen}
					onClose={() => setIsOpen(false)}
					title="Tema Personalizado"
					size="sm"
				>
					<div className="flex flex-col gap-4">
						<div className="flex flex-col gap-1.5">
							<label className="text-sm font-bold uppercase tracking-wider text-[var(--duo-fg-muted)]">
								Nome
							</label>
							<input
								value={customName}
								onChange={(e) => setCustomName(e.target.value)}
								placeholder="Meu Tema"
								className="w-full rounded-xl border-2 border-[var(--duo-border)] bg-[var(--duo-bg-card)] px-4 py-2.5 text-sm text-[var(--duo-fg)] focus:border-[var(--duo-primary)] focus:outline-none"
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<label className="text-sm font-bold uppercase tracking-wider text-[var(--duo-fg-muted)]">
								Cor primária
							</label>
							<div className="flex items-center gap-3">
								<input
									type="color"
									value={customColor}
									onChange={(e) => setCustomColor(e.target.value)}
									className="h-10 w-10 cursor-pointer rounded-lg border-0"
								/>
								<span className="font-mono text-sm text-[var(--duo-fg)]">
									{customColor}
								</span>
							</div>
						</div>
						<DuoButton
							onClick={handleAddCustom}
							fullWidth
							disabled={!customName.trim()}
						>
							Criar Tema
						</DuoButton>
					</div>
				</DuoModal.Simple>
			</div>
		);
	}

	return (
		<div className={cn("flex flex-col gap-4", className)} {...props}>
			{/* Toggle Light / Dark */}
			<div className="flex items-center justify-between gap-4">
				<div className="flex items-center gap-2">
					<Palette size={18} className="text-[var(--duo-primary)]" />
					<span className="text-sm font-bold uppercase tracking-wider text-[var(--duo-fg)]">
						Tema
					</span>
				</div>
				<button
					onClick={toggleColorMode}
					className={cn(
						"flex items-center gap-2 rounded-xl border-2 px-3 py-2 transition-all duration-200",
						"border-[var(--duo-border)] hover:border-[var(--duo-primary)]",
						"text-[var(--duo-fg-muted)] hover:text-[var(--duo-primary)]",
					)}
					aria-label={colorMode === "light" ? "Mudar para modo escuro" : "Mudar para modo claro"}
				>
					{colorMode === "light" ? (
						<>
							<Sun size={16} />
							<span className="text-xs font-bold">Claro</span>
						</>
					) : (
						<>
							<Moon size={16} />
							<span className="text-xs font-bold">Escuro</span>
						</>
					)}
				</button>
			</div>

			<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
				{BASE_PRESET_IDS.map((baseId) => {
					const map = presetModeMap[baseId];
					const resolvedId = colorMode === "light" ? map.light : map.dark;
					const preset = [...duolingoPresets, ...duolingoPresetsLight].find((p) => p.id === resolvedId);
					if (!preset) return null;
					const isActive = activeBaseId === baseId;

					return (
						<button
							key={baseId}
							onClick={() => setActivePreset(baseId)}
							className={cn(
								"relative flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 transition-all duration-200",
								"hover:scale-[1.02] active:scale-[0.98]",
								isActive
									? "border-[var(--duo-primary)] bg-[var(--duo-primary)]/10"
									: "border-[var(--duo-border)] hover:border-[var(--duo-fg-muted)]",
							)}
						>
							<span
								className="h-6 w-6 shrink-0 rounded-full shadow-sm"
								style={{ backgroundColor: preset.colors.primary }}
							/>
							<span
								className={cn(
									"truncate text-xs font-bold",
									isActive ? "text-[var(--duo-primary)]" : "text-[var(--duo-fg)]",
								)}
							>
								{BASE_PRESET_NAMES[baseId]}
							</span>
							{isActive && (
								<Check
									size={14}
									className="ml-auto shrink-0 text-[var(--duo-primary)]"
								/>
							)}
						</button>
					);
				})}
				{customPresets.map((preset) => {
					const isActive = activePresetId === preset.id;
					return (
						<button
							key={preset.id}
							onClick={() => setActivePreset(preset.id)}
							className={cn(
								"relative flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 transition-all duration-200",
								"hover:scale-[1.02] active:scale-[0.98]",
								isActive
									? "border-[var(--duo-primary)] bg-[var(--duo-primary)]/10"
									: "border-[var(--duo-border)] hover:border-[var(--duo-fg-muted)]",
							)}
						>
							<span
								className="h-6 w-6 shrink-0 rounded-full shadow-sm"
								style={{ backgroundColor: preset.colors.primary }}
							/>
							<span
								className={cn(
									"truncate text-xs font-bold",
									isActive ? "text-[var(--duo-primary)]" : "text-[var(--duo-fg)]",
								)}
							>
								{preset.name}
							</span>
							{isActive && (
								<Check size={14} className="ml-auto shrink-0 text-[var(--duo-primary)]" />
							)}
							<button
								onClick={(e) => {
									e.stopPropagation();
									removeCustomPreset(preset.id);
								}}
								className="ml-auto shrink-0 text-[var(--duo-danger)] opacity-50 transition-opacity hover:opacity-100"
								aria-label={`Remover tema ${preset.name}`}
							>
								<Trash2 size={12} />
							</button>
						</button>
					);
				})}
			</div>

			<button
				onClick={() => setIsOpen(true)}
				className="flex items-center gap-2 rounded-xl border-2 border-dashed border-[var(--duo-border)] px-3 py-2.5 text-[var(--duo-fg-muted)] transition-all duration-200 hover:border-[var(--duo-primary)] hover:text-[var(--duo-primary)] active:scale-[0.98]"
			>
				<Plus size={16} />
				<span className="text-xs font-bold">Adicionar Tema Personalizado</span>
			</button>

			<DuoModal.Simple
				isOpen={isOpen}
				onClose={() => setIsOpen(false)}
				title="Tema Personalizado"
				size="sm"
			>
				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-1.5">
						<label className="text-sm font-bold uppercase tracking-wider text-[var(--duo-fg-muted)]">
							Nome
						</label>
						<input
							value={customName}
							onChange={(e) => setCustomName(e.target.value)}
							placeholder="Meu Tema"
							className="w-full rounded-xl border-2 border-[var(--duo-border)] bg-[var(--duo-bg-card)] px-4 py-2.5 text-sm text-[var(--duo-fg)] focus:border-[var(--duo-primary)] focus:outline-none"
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<label className="text-sm font-bold uppercase tracking-wider text-[var(--duo-fg-muted)]">
							Cor primária
						</label>
						<div className="flex items-center gap-3">
							<input
								type="color"
								value={customColor}
								onChange={(e) => setCustomColor(e.target.value)}
								className="h-10 w-10 cursor-pointer rounded-lg border-0"
							/>
							<span className="font-mono text-sm text-[var(--duo-fg)]">
								{customColor}
							</span>
							<div
								className="h-10 flex-1 rounded-xl"
								style={{ backgroundColor: customColor }}
							/>
						</div>
					</div>
					<DuoButton
						onClick={handleAddCustom}
						fullWidth
						disabled={!customName.trim()}
					>
						Criar Tema
					</DuoButton>
				</div>
			</DuoModal.Simple>
		</div>
	);
}

export const DuoColorPicker = {
	Simple: DuoColorPickerSimple,
};
