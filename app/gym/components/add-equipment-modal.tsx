"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { OptionSelector } from "@/components/ui/option-selector";
import type { Equipment } from "@/lib/types";

const EQUIPMENT_TYPES = [
	"Musculação",
	"Cardio",
	"Funcional",
	"Cross",
	"Pilates",
	"Pesos Livres",
];

interface AddEquipmentModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: (newEquipment: Equipment) => void;
	equipmentToEdit?: Equipment | null;
}

export function AddEquipmentModal({
	isOpen,
	onClose,
	onSuccess,
	equipmentToEdit,
}: AddEquipmentModalProps) {
	const [form, setForm] = useState({
		name: "",
		type: "Musculação",
		brand: "",
		model: "",
		serialNumber: "",
		purchaseDate: "",
	});
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		if (isOpen) {
			if (equipmentToEdit) {
				setForm({
					name: equipmentToEdit.name,
					type: equipmentToEdit.type.charAt(0).toUpperCase() + equipmentToEdit.type.slice(1).toLowerCase(), // Capitalize for OptionSelector match attempt
					brand: equipmentToEdit.brand || "",
					model: equipmentToEdit.model || "",
					serialNumber: equipmentToEdit.serialNumber || "",
					purchaseDate: equipmentToEdit.purchaseDate
						? new Date(equipmentToEdit.purchaseDate).toISOString().split("T")[0]
						: "",
				});
			} else {
				setForm({
					name: "",
					type: "Musculação",
					brand: "",
					model: "",
					serialNumber: "",
					purchaseDate: "",
				});
			}
			setError("");
		}
	}, [isOpen, equipmentToEdit]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!form.name.trim()) {
			setError("Nome é obrigatório");
			return;
		}

		setSaving(true);
		setError("");

		try {
			const url = equipmentToEdit
				? `/api/gyms/equipment/${equipmentToEdit.id}`
				: "/api/gyms/equipment";
			const method = equipmentToEdit ? "PATCH" : "POST";

			const res = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(form),
			});

			const data = await res.json();
			if (!res.ok) {
				setError(data.error || "Erro ao salvar equipamento");
				return;
			}

			onSuccess(data.equipment);
			onClose();
		} catch (err) {
			console.error(err);
			setError("Erro de conexão");
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>
						{equipmentToEdit ? "Editar Equipamento" : "Adicionar Equipamento"}
					</DialogTitle>
					<DialogDescription>
						{equipmentToEdit
							? "Atualize os dados do equipamento abaixo."
							: "Preencha os dados do novo equipamento."}
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<Label htmlFor="name">Nome *</Label>
						<Input
							id="name"
							value={form.name}
							onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
							placeholder="Ex: Supino Reto"
						/>
					</div>
					
					<div className="grid gap-2">
						<Label>Tipo *</Label>
						<OptionSelector
							options={EQUIPMENT_TYPES.map((t) => ({ value: t, label: t }))}
							value={form.type}
							onChange={(v) => setForm((f) => ({ ...f, type: v }))}
							layout="grid"
							size="sm"
							columns={3}
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="grid gap-2">
							<Label htmlFor="brand">Marca</Label>
							<Input
								id="brand"
								value={form.brand}
								onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
								placeholder="Ex: Technogym"
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="model">Modelo</Label>
							<Input
								id="model"
								value={form.model}
								onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
								placeholder="Ex: Selection 900"
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="grid gap-2">
							<Label htmlFor="serialNumber">Nº Série</Label>
							<Input
								id="serialNumber"
								value={form.serialNumber}
								onChange={(e) => setForm((f) => ({ ...f, serialNumber: e.target.value }))}
								placeholder="Ex: SN123456"
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="purchaseDate">Data Aquisição</Label>
							<Input
								id="purchaseDate"
								type="date"
								value={form.purchaseDate}
								onChange={(e) => setForm((f) => ({ ...f, purchaseDate: e.target.value }))}
							/>
						</div>
					</div>

					{error && <p className="text-sm text-red-500 font-medium">{error}</p>}
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={onClose} disabled={saving}>
						Cancelar
					</Button>
					<Button onClick={handleSubmit} disabled={saving}>
						{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						{equipmentToEdit ? "Salvar Alterações" : "Adicionar"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
