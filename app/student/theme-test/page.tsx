"use client";

import Link from "next/link";
import {
	ColorPickerSection,
	TabsSection,
	CardsSection,
	StatCardsSection,
	AchievementCardsSection,
	StatsGridSection,
	ThemeTestSection,
} from "./components";

export default function StudentThemeTestPage() {
	return (
		<div className="space-y-8 p-4 pb-24">
			<div className="flex items-center justify-between gap-4">
				<h1 className="text-2xl font-extrabold text-[var(--duo-fg)]">
					Teste de Tema
				</h1>
				<Link
					href="/student"
					className="text-sm font-bold text-[var(--duo-primary)] hover:underline"
				>
					← Voltar
				</Link>
			</div>

			<ColorPickerSection />

			<ThemeTestSection title="Tabs">
				<TabsSection />
			</ThemeTestSection>

			<ThemeTestSection title="Cards">
				<CardsSection />
			</ThemeTestSection>

			<ThemeTestSection title="Stat Cards">
				<StatCardsSection />
			</ThemeTestSection>

			<ThemeTestSection title="Achievement Cards">
				<AchievementCardsSection />
			</ThemeTestSection>

			<ThemeTestSection title="Stats Grid (3 colunas)">
				<StatsGridSection />
			</ThemeTestSection>
		</div>
	);
}
