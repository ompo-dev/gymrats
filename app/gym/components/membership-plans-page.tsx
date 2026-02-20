"use client";

import { Check, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DuoCard } from "@/components/ui/duo-card";
import { Input } from "@/components/ui/input";
import { OptionSelector } from "@/components/ui/option-selector";
import type { MembershipPlan } from "@/lib/types";
import { useRouter } from "next/navigation";

interface PlanFormData {
	name: string;
	type: string;
	price: string;
	duration: string;
	benefits: string; // CSV
}

const PLAN_TYPES = [
	{ value: "monthly", label: "Mensal" },
	{ value: "quarterly", label: "Trimestral" },
	{ value: "semi-annual", label: "Semestral" },
	{ value: "annual", label: "Anual" },
	{ value: "trial", label: "Trial / Experimental" },
];

export function MembershipPlansPage({
	plans: initialPlans,
}: {
	plans: MembershipPlan[];
}) {
	const router = useRouter();
	const [plans, setPlans] = useState(initialPlans);
	const [isCreating, setIsCreating] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [form, setForm] = useState<PlanFormData>({
		name: "",
		type: "monthly",
		price: "",
		duration: "30",
		benefits: "",
	});
	const [saving, setSaving] = useState(false);

	const handleCreate = async () => {
		try {
			setSaving(true);
			const url = editingId
				? `/api/gyms/plans/${editingId}`
				: "/api/gyms/plans";
			const method = editingId ? "PATCH" : "POST";

			const res = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...form,
					price: Number(form.price),
					duration: Number(form.duration),
					benefits: form.benefits
						.split(",")
						.map((b) => b.trim())
						.filter(Boolean),
				}),
			});

			const data = await res.json();
			if (res.ok) {
				if (editingId) {
					// Update local
					setPlans((prev) =>
						prev.map((p) => (p.id === editingId ? data.plan : p)),
					);
				} else {
					// Add new
					setPlans((prev) => [...prev, data.plan]);
				}
				resetForm();
				router.refresh(); // Refresh server data
			} else {
				alert(data.error || "Erro ao salvar plano");
			}
		} catch (error) {
			console.error("Erro ao salvar plano:", error);
			alert("Erro ao salvar plano");
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async (planId: string) => {
		if (!confirm("Tem certeza que deseja desativar este plano?")) return;
		try {
			const res = await fetch(`/api/gyms/plans/${planId}`, {
				method: "DELETE",
			});
			if (res.ok) {
				setPlans((prev) => prev.filter((p) => p.id !== planId));
				router.refresh();
			} else {
				const data = await res.json();
				alert(data.error || "Erro ao deletar plano");
			}
		} catch (error) {
			console.error("Erro ao deletar plano:", error);
			alert("Erro ao deletar plano");
		}
	};

	const startEditing = (plan: MembershipPlan) => {
		setEditingId(plan.id);
		setForm({
			name: plan.name,
			type: plan.type,
			price: String(plan.price),
			duration: String(plan.duration),
			benefits: plan.benefits?.join(", ") ?? "",
		});
		setIsCreating(true);
	};

	const resetForm = () => {
		setIsCreating(false);
		setEditingId(null);
		setForm({
			name: "",
			type: "monthly",
			price: "",
			duration: "30",
			benefits: "",
		});
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-xl font-bold text-duo-text">Planos de Matrícula</h2>
				{!isCreating && (
					<Button onClick={() => setIsCreating(true)} className="flex gap-2">
						<Plus className="h-4 w-4" />
						Novo Plano
					</Button>
				)}
			</div>

			{/* Lista de planos */}
			{!isCreating && (
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{plans.length === 0 && (
						<div className="col-span-full py-8 text-center text-duo-gray-dark">
							Nenhum plano cadastrado.
						</div>
					)}
					{plans.map((plan) => (
						<DuoCard key={plan.id} variant="default" size="default">
							<div className="mb-2 flex items-start justify-between">
								<div>
									<p className="font-bold text-duo-text">{plan.name}</p>
									<p className="text-sm capitalize text-duo-gray-dark">
										{PLAN_TYPES.find((t) => t.value === plan.type)?.label ||
											plan.type}
									</p>
								</div>
								<div className="text-right">
									<p className="text-xl font-bold text-duo-green">
										R$ {plan.price.toFixed(2)}
									</p>
									<p className="text-xs text-duo-gray-dark">
										{plan.duration} dias
									</p>
								</div>
							</div>
							{plan.benefits?.length > 0 && (
								<ul className="mb-3 space-y-1">
									{plan.benefits.slice(0, 3).map((b, i) => (
										<li
											key={i}
											className="flex items-center gap-1 text-xs text-duo-gray-dark"
										>
											<Check className="h-3 w-3 text-duo-green" />
											{b}
										</li>
									))}
									{plan.benefits.length > 3 && (
										<li className="text-xs text-duo-gray-dark italic">
											+{plan.benefits.length - 3} benefícios
										</li>
									)}
								</ul>
							)}
							<div className="mt-auto flex gap-2 pt-2">
								<Button
									size="sm"
									variant="outline"
									className="flex-1"
									onClick={() => startEditing(plan)}
								>
									Editar
								</Button>
								<Button
									size="sm"
									variant="outline"
									className="border-duo-red text-duo-red hover:bg-duo-red/10"
									onClick={() => handleDelete(plan.id)}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>
						</DuoCard>
					))}
				</div>
			)}

			{/* Form de criação / edição */}
			{isCreating && (
				<DuoCard variant="default" size="default" className="w-full max-w-md">
					<h3 className="mb-4 text-lg font-bold text-duo-text">
						{editingId ? "Editar Plano" : "Novo Plano"}
					</h3>
					<div className="space-y-3">
						<div>
							<label className="mb-1 block text-xs font-bold text-duo-gray-dark">
								Nome do Plano
							</label>
							<Input
								placeholder="Ex: Mensal Básico"
								value={form.name}
								onChange={(e) =>
									setForm((f) => ({ ...f, name: e.target.value }))
								}
							/>
						</div>
						<div>
							<label className="mb-1 block text-xs font-bold text-duo-gray-dark">
								Tipo
							</label>
							<OptionSelector
								options={PLAN_TYPES}
								value={form.type}
								onChange={(v) => setForm((f) => ({ ...f, type: v }))}
								layout="grid"
								size="sm"
							/>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<div>
								<label className="mb-1 block text-xs font-bold text-duo-gray-dark">
									Preço (R$)
								</label>
								<Input
									type="number"
									placeholder="0.00"
									value={form.price}
									onChange={(e) =>
										setForm((f) => ({ ...f, price: e.target.value }))
									}
								/>
							</div>
							<div>
								<label className="mb-1 block text-xs font-bold text-duo-gray-dark">
									Duração (dias)
								</label>
								<Input
									type="number"
									placeholder="30"
									value={form.duration}
									onChange={(e) =>
										setForm((f) => ({ ...f, duration: e.target.value }))
									}
								/>
							</div>
						</div>
						<div>
							<label className="mb-1 block text-xs font-bold text-duo-gray-dark">
								Benefícios (separados por vírgula)
							</label>
							<Input
								placeholder="Acesso total, Avaliação física..."
								value={form.benefits}
								onChange={(e) =>
									setForm((f) => ({ ...f, benefits: e.target.value }))
								}
							/>
						</div>
					</div>
					<div className="mt-6 flex gap-2">
						<Button variant="outline" className="flex-1" onClick={resetForm}>
							Cancelar
						</Button>
						<Button
							className="flex-1"
							onClick={handleCreate}
							disabled={saving || !form.name || !form.price}
						>
							{saving ? "Salvando..." : "Salvar"}
						</Button>
					</div>
				</DuoCard>
			)}
		</div>
	);
}
