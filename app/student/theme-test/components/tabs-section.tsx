"use client";

import { DuoTabs } from "@/components/duo";

export function TabsSection() {
	return (
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
	);
}
