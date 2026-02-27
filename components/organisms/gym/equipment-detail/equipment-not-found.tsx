"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { FadeIn } from "@/components/animations/fade-in";
import { DuoButton, DuoCard } from "@/components/duo";

export function EquipmentNotFound() {
	return (
		<div className="flex flex-1 items-center justify-center p-8">
			<FadeIn>
				<DuoCard.Root variant="default" padding="md" className="text-center">
					<DuoCard.Header>
						<div className="flex items-center gap-2">
							<AlertTriangle
								className="h-5 w-5 shrink-0"
								style={{ color: "var(--duo-secondary)" }}
								aria-hidden
							/>
							<h2 className="font-bold text-duo-fg">Equipamento não encontrado</h2>
						</div>
					</DuoCard.Header>
					<p className="mb-4 text-xl font-bold text-duo-gray-dark">
						Equipamento não encontrado
					</p>
					<Link href="/gym/equipment">
						<DuoButton className="mt-4">Voltar para Equipamentos</DuoButton>
					</Link>
				</DuoCard.Root>
			</FadeIn>
		</div>
	);
}
