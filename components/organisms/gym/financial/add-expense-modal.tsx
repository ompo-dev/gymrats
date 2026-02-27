"use client";

import { Loader2, Receipt } from "lucide-react";
import { useEffect, useState } from "react";
import { DuoButton } from "@/components/duo";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { DuoInput } from "@/components/duo";
import { Label } from "@/components/molecules/forms/label";
import { DuoSelect } from "@/components/duo";
import { useGym } from "@/hooks/use-gym";

const EXPENSE_TYPES = [
	{ value: "maintenance", label: "Manutenção" },
	{ value: "equipment", label: "Equipamento" },
	{ value: "staff", label: "Funcionários" },
	{ value: "utilities", label: "Utilidades" },
	{ value: "rent", label: "Aluguel" },
	{ value: "consumables", label: "Consumíveis" },
	{ value: "marketing", label: "Marketing" },
	{ value: "other", label: "Outros" },
] as const;

interface AddExpenseModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess?: () => void;
}

export function AddExpenseModal({
	isOpen,
	onClose,
	onSuccess,
}: AddExpenseModalProps) {
	const { actions, loaders } = useGym("actions", "loaders");
	const [form, setForm] = useState({
		type: "other" as (typeof EXPENSE_TYPES)[number]["value"],
		description: "",
		amount: "",
		category: "",
	});
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		if (isOpen) {
			const today = new Date().toISOString().split("T")[0];
			setForm({
				type: "other",
				description: "",
				amount: "",
				category: "",
			});
			setError("");
		}
	}, [isOpen]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const amount = parseFloat(form.amount.replace(",", "."));
		if (isNaN(amount) || amount <= 0) {
			setError("Valor deve ser maior que zero");
			return;
		}

		setSaving(true);
		setError("");

		try {
			await actions.createExpense({
				type: form.type,
				description: form.description.trim() || null,
				amount,
				date: new Date().toISOString().split("T")[0],
				category: form.category.trim() || null,
			});
			await loaders.loadSection("expenses");
			await loaders.loadSection("financialSummary");
			onSuccess?.();
			onClose();
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Erro ao registrar despesa. Tente novamente.",
			);
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Receipt className="h-5 w-5" />
						Nova Despesa
					</DialogTitle>
					<DialogDescription>
						Registre uma despesa para manter o controle financeiro da academia.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<Label htmlFor="type">Tipo</Label>
						<DuoSelect.Simple
							options={EXPENSE_TYPES.map((t) => ({
								value: t.value,
								label: t.label,
							}))}
							value={form.type}
							onChange={(v) =>
								setForm((f) => ({
									...f,
									type: v as (typeof EXPENSE_TYPES)[number]["value"],
								}))
							}
							placeholder="Selecione o tipo"
							className="mt-1"
						/>
					</div>
					<DuoInput.Simple
						id="description"
						label="Descrição (opcional)"
						value={form.description}
						onChange={(e) =>
							setForm((f) => ({ ...f, description: e.target.value }))
						}
						placeholder="Ex: Conserto do ar condicionado"
					/>
					<DuoInput.Simple
						id="amount"
						label="Valor (R$)"
						type="text"
						inputMode="decimal"
						value={form.amount}
						onChange={(e) =>
							setForm((f) => ({
								...f,
								amount: e.target.value.replace(/[^\d,.-]/g, ""),
							}))
						}
						placeholder="0,00"
						required
					/>
					<DuoInput.Simple
						id="category"
						label="Categoria (opcional)"
						value={form.category}
						onChange={(e) =>
							setForm((f) => ({ ...f, category: e.target.value }))
						}
						placeholder="Ex: Manutenção geral"
					/>
					{error && (
						<p className="text-sm text-red-600">{error}</p>
					)}
					<DialogFooter>
						<DuoButton type="button" variant="outline" onClick={onClose}>
							Cancelar
						</DuoButton>
						<DuoButton type="submit" disabled={saving}>
							{saving ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								"Registrar"
							)}
						</DuoButton>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
