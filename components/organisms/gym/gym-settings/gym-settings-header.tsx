"use client";

import { FadeIn } from "@/components/animations/fade-in";

export function GymSettingsHeader() {
	return (
		<FadeIn>
			<div className="text-center">
				<h1 className="mb-2 text-3xl font-bold text-duo-fg">
					Configurações
				</h1>
				<p className="text-sm text-duo-fg-muted">
					Gerencie o perfil e configurações da academia
				</p>
			</div>
		</FadeIn>
	);
}
