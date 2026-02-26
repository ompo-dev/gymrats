"use client";

import { useState } from "react";
import { DuoButton } from "@/components/duo";
import { DuoCard } from "@/components/duo";
import { DuoInput } from "@/components/duo";
import { DuoSelect } from "@/components/duo";
import { useGym } from "@/hooks/use-gym";
import type { MaintenanceRecord } from "@/lib/types";

interface MaintenanceModalProps {
	isOpen: boolean;
	onClose: () => void;
	equipmentId: string;
	onSuccess: (record: MaintenanceRecord) => void;
}

const MAINTENANCE_TYPES = [
	{ value: "preventive", label: "Preventiva" },
	{ value: "corrective", label: "Corretiva" },
	{ value: "inspection", label: "Inspeção" },
];

export function MaintenanceModal({
	isOpen,
	onClose,
	equipmentId,
	onSuccess,
}: MaintenanceModalProps) {
	const { actions, loaders } = useGym("actions", "loaders");
	const [form, setForm] = useState({
		type: "preventive",
		description: "",
		performedBy: "",
		cost: "",
		nextScheduled: "",
	});
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async () => {
		if (!form.description || !form.performedBy) {
			setError("Descrição e Responsável são obrigatórios");
			return;
		}
		setSaving(true);
		setError("");

		try {
			await actions.createMaintenance(equipmentId, {
				type: form.type,
				description: form.description,
				performedBy: form.performedBy,
				cost: form.cost,
				nextScheduled: form.nextScheduled,
			});
			await loaders.loadSection("equipment");
			onSuccess({
				id: `${Date.now()}`,
				date: new Date(),
				type: form.type,
				description: form.description,
				performedBy: form.performedBy,
				cost: form.cost ? Number(form.cost) : undefined,
				nextScheduled: form.nextScheduled ? new Date(form.nextScheduled) : null,
			} as MaintenanceRecord);
			onClose();
			setForm({
				type: "preventive",
				description: "",
				performedBy: "",
				cost: "",
				nextScheduled: "",
			});
		} catch (err) {
			console.error("Erro ao registrar manutenção:", err);
			setError("Erro de conexão");
		} finally {
			setSaving(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
			<DuoCard variant="default" size="default" className="w-full max-w-md">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="text-xl font-bold text-duo-text">
						Registrar Manutenção
					</h2>
					<DuoButton variant="ghost" size="sm" onClick={onClose}>
						✕
					</DuoButton>
				</div>

				<div className="space-y-3">
					<div>
						<p className="mb-1 text-sm font-bold text-duo-text">Tipo</p>
						<DuoSelect
							options={MAINTENANCE_TYPES}
							value={form.type}
							onChange={(v) => setForm((f) => ({ ...f, type: v }))}
							placeholder="Tipo"
						/>
					</div>

					<DuoInput
						label="Descrição do Serviço *"
						placeholder="O que foi feito?"
						value={form.description}
						onChange={(e) =>
							setForm((f) => ({ ...f, description: e.target.value }))
						}
					/>

					<DuoInput
						label="Realizado por *"
						placeholder="Nome do técnico ou empresa"
						value={form.performedBy}
						onChange={(e) =>
							setForm((f) => ({ ...f, performedBy: e.target.value }))
						}
					/>

					<div className="flex gap-2">
						<DuoInput
							label="Custo (R$)"
							type="number"
							placeholder="0.00"
							value={form.cost}
							onChange={(e) =>
								setForm((f) => ({ ...f, cost: e.target.value }))
							}
							className="flex-1"
						/>
						<DuoInput
							label="Próxima Visita"
							type="date"
							value={form.nextScheduled}
							onChange={(e) =>
								setForm((f) => ({ ...f, nextScheduled: e.target.value }))
							}
							className="flex-1"
						/>
					</div>

					{error && <p className="text-sm text-duo-red">{error}</p>}
				</div>

				<div className="mt-4 flex gap-2">
					<DuoButton
						variant="outline"
						className="flex-1"
						onClick={onClose}
						disabled={saving}
					>
						Cancelar
					</DuoButton>
					<DuoButton className="flex-1" onClick={handleSubmit} disabled={saving}>
						{saving ? "Salvar" : "Registrar"}
					</DuoButton>
				</div>
			</DuoCard>
		</div>
	);
}
