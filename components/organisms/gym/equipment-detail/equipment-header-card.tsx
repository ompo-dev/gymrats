"use client";

import { Dumbbell, Edit, QrCode, Wrench } from "lucide-react";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoButton, DuoCard } from "@/components/duo";
import type { Equipment } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getStatusColor, getStatusIcon, getStatusText } from "./utils/equipment-status";

export interface EquipmentHeaderCardProps {
	equipment: Equipment;
}

export function EquipmentHeaderCard({ equipment }: EquipmentHeaderCardProps) {
	return (
		<SlideIn delay={0.1}>
			<DuoCard.Root variant="highlighted" padding="md">
				<DuoCard.Header>
					<div className="flex items-center gap-2">
						<Dumbbell
							className="h-5 w-5 shrink-0"
							style={{ color: "var(--duo-secondary)" }}
							aria-hidden
						/>
						<h2 className="font-bold text-duo-fg">{equipment.name}</h2>
					</div>
				</DuoCard.Header>
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
					<div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-duo-green sm:h-32 sm:w-32">
						<Dumbbell className="h-12 w-12 text-white sm:h-16 sm:w-16" />
					</div>
					<div className="min-w-0 flex-1">
						<div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
							<span
								className={cn(
									"flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold sm:px-4 sm:py-2 sm:text-base",
									getStatusColor(equipment.status),
								)}
							>
								{getStatusIcon(equipment.status)}
								{getStatusText(equipment.status)}
							</span>
						</div>
						<div className="mb-4 space-y-1 text-duo-gray-dark">
							<p className="text-sm sm:text-base lg:text-lg">
								<span className="font-bold">Marca:</span> {equipment.brand}
							</p>
							<p className="text-sm sm:text-base lg:text-lg">
								<span className="font-bold">Modelo:</span> {equipment.model}
							</p>
							<p className="text-sm">
								<span className="font-bold">Número de Série:</span>{" "}
								{equipment.serialNumber}
							</p>
							<p className="text-sm">
								<span className="font-bold">Tipo:</span>{" "}
								<span className="capitalize">{equipment.type}</span>
							</p>
						</div>
						<div className="flex flex-col gap-2 sm:flex-row">
							<DuoButton className="w-full gap-2 sm:w-auto">
								<Edit className="h-4 w-4" />
								<span className="hidden sm:inline">Editar Equipamento</span>
								<span className="sm:hidden">Editar</span>
							</DuoButton>
							<DuoButton variant="outline" className="w-full gap-2 sm:w-auto">
								<Wrench className="h-4 w-4" />
								<span className="hidden sm:inline">Agendar Manutenção</span>
								<span className="sm:hidden">Manutenção</span>
							</DuoButton>
							<DuoButton variant="outline" className="w-full gap-2 sm:w-auto">
								<QrCode className="h-4 w-4" />
								<span className="hidden sm:inline">Gerar QR Code</span>
								<span className="sm:hidden">QR Code</span>
							</DuoButton>
						</div>
					</div>
				</div>
			</DuoCard.Root>
		</SlideIn>
	);
}
