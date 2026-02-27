"use client";

import { Wrench } from "lucide-react";
import { DuoButton, DuoCard } from "@/components/duo";
import type { Equipment } from "@/lib/types";

export interface EquipmentMaintenanceTabProps {
	equipment: Equipment;
}

export function EquipmentMaintenanceTab({ equipment }: EquipmentMaintenanceTabProps) {
	return (
		<DuoCard.Root variant="orange" padding="md">
			<DuoCard.Header>
				<div className="flex items-center gap-2">
					<Wrench
						className="h-5 w-5 shrink-0"
						style={{ color: "var(--duo-secondary)" }}
						aria-hidden
					/>
					<h2 className="font-bold text-duo-fg">Histórico de Manutenção</h2>
				</div>
			</DuoCard.Header>
			{equipment.maintenanceHistory.length > 0 ? (
				<div className="space-y-3">
					{equipment.maintenanceHistory.map((record) => (
						<DuoCard.Root key={record.id} variant="default" size="default">
							<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
								<div className="min-w-0 flex-1">
									<p className="text-sm font-bold capitalize text-duo-text sm:text-base">
										{record.type}
									</p>
									<p className="text-xs text-duo-gray-dark sm:text-sm">
										{record.description}
									</p>
									<p className="text-xs text-duo-gray-dark">
										Por: {record.performedBy}
									</p>
								</div>
								<div className="text-left sm:text-right">
									<p className="text-xs font-bold text-duo-gray-dark sm:text-sm">
										{record.date.toLocaleDateString("pt-BR")}
									</p>
									{record.cost && (
										<p className="text-base font-bold text-duo-orange sm:text-lg">
											R$ {record.cost.toFixed(2)}
										</p>
									)}
								</div>
							</div>
						</DuoCard.Root>
					))}
				</div>
			) : (
				<DuoCard.Root variant="default" size="default">
					<div className="py-8 text-center">
						<Wrench className="mx-auto mb-3 h-12 w-12 text-duo-gray-dark" />
						<p className="font-bold text-duo-gray-dark">
							Nenhum registro de manutenção
						</p>
						<p className="text-sm text-duo-gray-dark">
							Esse equipamento ainda não teve manutenções registradas
						</p>
						<DuoButton className="mt-4">Registrar Manutenção</DuoButton>
					</div>
				</DuoCard.Root>
			)}
		</DuoCard.Root>
	);
}
