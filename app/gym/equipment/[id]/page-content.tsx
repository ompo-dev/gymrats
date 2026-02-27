"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { FadeIn } from "@/components/animations/fade-in";
import { DuoButton } from "@/components/duo";
import {
	EquipmentHeaderCard,
	EquipmentInUseCard,
	EquipmentNotFound,
	EquipmentStatsGrid,
	EquipmentTabs,
} from "./components";
import type { Equipment } from "@/lib/types";

interface EquipmentDetailPageProps {
	equipment: Equipment | null;
}

export default function EquipmentDetailPage({
	equipment,
}: EquipmentDetailPageProps) {
	if (!equipment) {
		return <EquipmentNotFound />;
	}

	return (
		<div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
			<FadeIn>
				<Link href="/gym/equipment">
					<DuoButton variant="ghost" className="mb-4 gap-2 font-bold">
						<ArrowLeft className="h-4 w-4" />
						<span className="hidden sm:inline">Voltar para Equipamentos</span>
						<span className="sm:hidden">Voltar</span>
					</DuoButton>
				</Link>
			</FadeIn>

			<EquipmentHeaderCard equipment={equipment} />
			<EquipmentInUseCard equipment={equipment} />
			<EquipmentStatsGrid equipment={equipment} />
			<EquipmentTabs equipment={equipment} />
		</div>
	);
}
