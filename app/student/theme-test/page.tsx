"use client";

import {
	Dumbbell,
	Flame,
	Target,
	Trophy,
	TrendingUp,
	Zap,
} from "lucide-react";
import Link from "next/link";
import {
	DuoAchievementCard,
	DuoCard,
	DuoColorPicker,
	DuoStatCard,
	DuoStatsGrid,
	DuoTabs,
} from "@/components/duo";

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

			{/* Color Picker Full */}
			<DuoCard.Root variant="elevated" padding="lg">
				<DuoColorPicker />
			</DuoCard.Root>

			{/* Tabs */}
			<section>
				<h2 className="mb-3 text-lg font-bold text-[var(--duo-fg)]">Tabs</h2>
				<DuoTabs.Simple
					tabs={[
						{
							id: "pill",
							label: "Pill",
							content: (
								<p className="text-sm text-[var(--duo-fg-muted)]">
									Conteúdo da tab Pill. Variante padrão.
								</p>
							),
						},
						{
							id: "underline",
							label: "Underline",
							content: (
								<p className="text-sm text-[var(--duo-fg-muted)]">
									Conteúdo da tab Underline.
								</p>
							),
						},
						{
							id: "button",
							label: "Button",
							content: (
								<p className="text-sm text-[var(--duo-fg-muted)]">
									Conteúdo da tab Button.
								</p>
							),
						},
					]}
					variant="pill"
				/>
			</section>

			{/* Cards */}
			<section>
				<h2 className="mb-3 text-lg font-bold text-[var(--duo-fg)]">Cards</h2>
				<div className="grid gap-4 sm:grid-cols-2">
					<DuoCard.Root variant="default">
						<DuoCard.Header>
							<span className="font-bold">Card Default</span>
						</DuoCard.Header>
						<DuoCard.Content>
							<p className="text-sm text-[var(--duo-fg-muted)]">
								Card com borda e fundo padrão.
							</p>
						</DuoCard.Content>
					</DuoCard.Root>
					<DuoCard.Root variant="elevated">
						<DuoCard.Header>
							<span className="font-bold">Card Elevated</span>
						</DuoCard.Header>
						<DuoCard.Content>
							<p className="text-sm text-[var(--duo-fg-muted)]">
								Card com sombra elevada.
							</p>
						</DuoCard.Content>
					</DuoCard.Root>
					<DuoCard.Root variant="outlined">
						<DuoCard.Header>
							<span className="font-bold">Card Outlined</span>
						</DuoCard.Header>
						<DuoCard.Content>
							<p className="text-sm text-[var(--duo-fg-muted)]">
								Card apenas com borda.
							</p>
						</DuoCard.Content>
					</DuoCard.Root>
					<DuoCard.Root variant="interactive">
						<DuoCard.Header>
							<span className="font-bold">Card Interactive</span>
						</DuoCard.Header>
						<DuoCard.Content>
							<p className="text-sm text-[var(--duo-fg-muted)]">
								Card clicável com hover.
							</p>
						</DuoCard.Content>
					</DuoCard.Root>
				</div>
			</section>

			{/* Stat Cards */}
			<section>
				<h2 className="mb-3 text-lg font-bold text-[var(--duo-fg)]">
					Stat Cards
				</h2>
				<DuoStatsGrid.Root columns={2}>
					<DuoStatCard.Simple
						icon={Flame}
						value={12}
						label="Streak"
						iconColor="var(--duo-accent)"
					/>
					<DuoStatCard.Simple
						icon={Zap}
						value={450}
						label="XP"
						iconColor="var(--duo-primary)"
					/>
					<DuoStatCard.Simple
						icon={Trophy}
						value={3}
						label="Nível"
						badge="Novo"
					/>
					<DuoStatCard.Simple
						icon={TrendingUp}
						value="#42"
						label="Ranking"
					/>
				</DuoStatsGrid.Root>
			</section>

			{/* Achievement Cards */}
			<section>
				<h2 className="mb-3 text-lg font-bold text-[var(--duo-fg)]">
					Achievement Cards
				</h2>
				<div className="space-y-3">
					<DuoAchievementCard.Simple
						icon={Dumbbell}
						title="Primeiro Treino"
						description="Complete seu primeiro treino"
						current={1}
						total={1}
						level={1}
					/>
					<DuoAchievementCard.Simple
						icon={Target}
						title="Meta Semanal"
						description="Complete 5 treinos esta semana"
						current={3}
						total={5}
						level={2}
					/>
					<DuoAchievementCard.Simple
						icon={Flame}
						title="Streak de 7 dias"
						description="Treine 7 dias seguidos"
						current={2}
						total={7}
					/>
				</div>
			</section>

			{/* Stats Grid */}
			<section>
				<h2 className="mb-3 text-lg font-bold text-[var(--duo-fg)]">
					Stats Grid (3 colunas)
				</h2>
				<DuoStatsGrid.Root columns={3}>
					<DuoStatCard.Simple icon={Flame} value={12} label="Streak" />
					<DuoStatCard.Simple icon={Zap} value={450} label="XP" />
					<DuoStatCard.Simple icon={Trophy} value={3} label="Nível" />
				</DuoStatsGrid.Root>
			</section>
		</div>
	);
}
