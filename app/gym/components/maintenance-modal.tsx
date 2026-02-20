"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DuoCard } from "@/components/ui/duo-card";
import { Input } from "@/components/ui/input";
import { OptionSelector } from "@/components/ui/option-selector";
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
			const res = await fetch(`/api/gyms/equipment/${equipmentId}/maintenance`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(form),
			});

			const data = await res.json();
			if (!res.ok) {
				setError(data.error ?? "Erro ao registrar manutenção");
				return;
			}
			onSuccess(data.record);
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
					<Button variant="ghost" size="sm" onClick={onClose}>
						✕
					</Button>
				</div>

				<div className="space-y-3">
					<div>
						<p className="mb-1 text-sm font-bold text-duo-text">Tipo</p>
						<OptionSelector
							options={MAINTENANCE_TYPES}
							value={form.type}
							onChange={(v) => setForm((f) => ({ ...f, type: v }))}
							layout="grid"
							size="sm"
						/>
					</div>

					<div>
						<p className="mb-1 text-sm font-bold text-duo-text">
							Descrição do Serviço *
						</p>
						<Input
							placeholder="O que foi feito?"
							value={form.description}
							onChange={(e) =>
								setForm((f) => ({ ...f, description: e.target.value }))
							}
						/>
					</div>

					<div>
						<p className="mb-1 text-sm font-bold text-duo-text">
							Realizado por *
						</p>
						<Input
							placeholder="Nome do técnico ou empresa"
							value={form.performedBy}
							onChange={(e) =>
								setForm((f) => ({ ...f, performedBy: e.target.value }))
							}
						/>
					</div>

					<div className="flex gap-2">
						<div className="flex-1">
							<p className="mb-1 text-sm text-duo-gray-dark">Custo (R$)</p>
							<Input
								type="number"
								placeholder="0.00"
								value={form.cost}
								onChange={(e) =>
									setForm((f) => ({ ...f, cost: e.target.value }))
								}
							/>
						</div>
						<div className="flex-1">
							<p className="mb-1 text-sm text-duo-gray-dark">Próxima Visita</p>
							<Input
								type="date"
								value={form.nextScheduled}
								onChange={(e) =>
									setForm((f) => ({ ...f, nextScheduled: e.target.value }))
								}
							/>
						</div>
					</div>

					{error && <p className="text-sm text-duo-red">{error}</p>}
				</div>

				<div className="mt-4 flex gap-2">
					<Button
						variant="outline"
						className="flex-1"
						onClick={onClose}
						disabled={saving}
					>
						Cancelar
					</Button>
					<Button className="flex-1" onClick={handleSubmit} disabled={saving}>
						{saving ? "Salvar" : "Registrar"}
					</Button>
				</div>
			</DuoCard>
		</div>
	);
}
