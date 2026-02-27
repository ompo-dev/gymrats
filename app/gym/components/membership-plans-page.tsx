"use client";

import { Check, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { DuoButton } from "@/components/duo";
import { DuoCard } from "@/components/duo";
import { DuoInput } from "@/components/duo";
import { DuoSelect } from "@/components/duo";
import { useGym } from "@/hooks/use-gym";
import type { MembershipPlan } from "@/lib/types";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

const DURATION_BY_TYPE: Record<string, number> = {
	monthly: 30,
	quarterly: 90,
	"semi-annual": 180,
	annual: 365,
	trial: 7,
};

export function MembershipPlansPage({
	plans: initialPlans,
}: {
	plans: MembershipPlan[];
}) {
	const { actions, loaders } = useGym("actions", "loaders");
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

	const updateFormType = (type: string) => {
		setForm((f) => ({
			...f,
			type,
			duration: String(DURATION_BY_TYPE[type] ?? 30),
		}));
	};
	const [saving, setSaving] = useState(false);

	const handleCreate = async () => {
		try {
			setSaving(true);
			const payload = {
				...form,
				price: Number(form.price),
				duration: Number(form.duration),
				benefits: form.benefits
					.split(",")
					.map((b) => b.trim())
					.filter(Boolean),
			};
			if (editingId) {
				await actions.updateMembershipPlan(editingId, payload);
				setPlans((prev) =>
					prev.map((p) =>
						p.id === editingId
							? ({
									...p,
									...payload,
									type: payload.type as MembershipPlan["type"],
								} as MembershipPlan)
							: p,
					),
				);
			} else {
				await actions.createMembershipPlan(payload);
				setPlans((prev) => [
					...prev,
					{
						id: `${Date.now()}`,
						name: payload.name,
						type: payload.type as MembershipPlan["type"],
						price: payload.price,
						duration: payload.duration,
						benefits: payload.benefits,
						isActive: true,
					} as MembershipPlan,
				]);
			}
			await loaders.loadSection("membershipPlans");
			resetForm();
		} catch (error) {
			console.error("Erro ao salvar plano:", error);
			alert("Erro ao salvar plano");
		} finally {
			setSaving(false);
		}
	};

	const [planToDelete, setPlanToDelete] = useState<string | null>(null);

	const handleDelete = (planId: string) => {
		setPlanToDelete(planId);
	};

	const confirmDelete = async () => {
		if (!planToDelete) return;

		try {
			await actions.deleteMembershipPlan(planToDelete);
			setPlans((prev) => prev.filter((p) => p.id !== planToDelete));
			await loaders.loadSection("membershipPlans");
		} catch (error) {
			console.error("Erro ao deletar plano:", error);
			alert("Erro ao deletar plano");
		} finally {
			setPlanToDelete(null);
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
				<h2 className="text-xl font-bold text-[var(--duo-fg)]">Planos de Matrícula</h2>
				{!isCreating && (
					<DuoButton onClick={() => setIsCreating(true)} className="flex gap-2">
						<Plus className="h-4 w-4" />
						Novo Plano
					</DuoButton>
				)}
			</div>

			{/* Lista de planos */}
			{!isCreating && (
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{plans.length === 0 && (
						<div className="col-span-full py-8 text-center text-[var(--duo-fg-muted)]">
							Nenhum plano cadastrado.
						</div>
					)}
					{plans.map((plan) => (
						<DuoCard.Root key={plan.id} variant="default" size="default">
							<div className="mb-2 flex items-start justify-between">
								<div>
									<p className="font-bold text-[var(--duo-fg)]">{plan.name}</p>
									<p className="text-sm text-[var(--duo-fg-muted)]">
										{PLAN_TYPES.find((t) => t.value === plan.type)?.label ||
											plan.type} • {plan.duration} dias
									</p>
								</div>
								<div className="text-right">
									<p className="text-xl font-bold text-[var(--duo-primary)]">
										R$ {plan.price.toFixed(2)}
									</p>
								</div>
							</div>
							{plan.benefits?.length > 0 && (
								<ul className="mb-3 space-y-1">
									{plan.benefits.slice(0, 3).map((b, i) => (
										<li
											key={i}
											className="flex items-center gap-1 text-xs text-[var(--duo-fg-muted)]"
										>
											<Check className="h-3 w-3 text-[var(--duo-primary)]" />
											{b}
										</li>
									))}
									{plan.benefits.length > 3 && (
										<li className="text-xs text-[var(--duo-fg-muted)] italic">
											+{plan.benefits.length - 3} benefícios
										</li>
									)}
								</ul>
							)}
							<div className="mt-auto flex gap-2 pt-2">
								<DuoButton
									size="sm"
									variant="outline"
									className="flex-1"
									onClick={() => startEditing(plan)}
								>
									Editar
								</DuoButton>
								<DuoButton
									size="sm"
									variant="outline"
									className="border-[var(--duo-danger)] text-[var(--duo-danger)] hover:bg-[var(--duo-danger)]/10"
									onClick={() => handleDelete(plan.id)}
								>
									<Trash2 className="h-4 w-4" />
								</DuoButton>
							</div>
						</DuoCard.Root>
					))}
				</div>
			)}

			{/* Form de criação / edição */}
			{isCreating && (
				<DuoCard.Root variant="default" size="default" className="w-full max-w-md">
					<h3 className="mb-4 text-lg font-bold text-[var(--duo-fg)]">
						{editingId ? "Editar Plano" : "Novo Plano"}
					</h3>
					<div className="space-y-3">
						<div>
							<label className="mb-1 block text-xs font-bold text-[var(--duo-fg-muted)]">
								Nome do Plano
							</label>
							<DuoInput
								placeholder="Ex: Mensal Básico"
								value={form.name}
								onChange={(e) =>
									setForm((f) => ({ ...f, name: e.target.value }))
								}
							/>
						</div>
						<div>
							<label className="mb-1 block text-xs font-bold text-[var(--duo-fg-muted)]">
								Tipo (duração definida automaticamente)
							</label>
							<DuoSelect
								options={PLAN_TYPES}
								value={form.type}
								onChange={updateFormType}
								placeholder="Tipo"
							/>
							<p className="mt-1 text-[10px] text-[var(--duo-fg-muted)]">
								{form.type && `${DURATION_BY_TYPE[form.type] ?? 30} dias`}
							</p>
						</div>
						<div>
							<label className="mb-1 block text-xs font-bold text-[var(--duo-fg-muted)]">
								Preço (R$)
							</label>
							<DuoInput
								type="number"
								placeholder="0.00"
								value={form.price}
								onChange={(e) =>
									setForm((f) => ({ ...f, price: e.target.value }))
								}
							/>
						</div>
						<div>
							<label className="mb-1 block text-xs font-bold text-[var(--duo-fg-muted)]">
								Benefícios (separados por vírgula)
							</label>
							<DuoInput
								placeholder="Acesso total, Avaliação física..."
								value={form.benefits}
								onChange={(e) =>
									setForm((f) => ({ ...f, benefits: e.target.value }))
								}
							/>
						</div>
					</div>
					<div className="mt-6 flex gap-2">
						<DuoButton variant="outline" className="flex-1" onClick={resetForm}>
							Cancelar
						</DuoButton>
						<DuoButton
							className="flex-1"
							onClick={handleCreate}
							disabled={saving || !form.name || !form.price}
						>
							{saving ? "Salvando..." : "Salvar"}
						</DuoButton>
					</div>
				</DuoCard.Root>
			)}


			<AlertDialog
				open={!!planToDelete}
				onOpenChange={(open) => !open && setPlanToDelete(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
						<AlertDialogDescription>
							Esta ação irá desativar o plano de matrícula. Usuários já inscritos
							não serão afetados, mas novos alunos não poderão escolher este
							plano.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmDelete}
							className="bg-duo-red hover:bg-duo-red/90"
						>
							Sim, desativar
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
