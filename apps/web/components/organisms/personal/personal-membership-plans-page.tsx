"use client";

import type { PersonalMembershipPlan } from "@gymrats/types/personal-module";
import { Check, Plus, Trash2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { DuoButton, DuoCard, DuoInput, DuoSelect } from "@/components/duo";
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
import { usePersonal } from "@/hooks/use-personal";

interface PlanFormData {
  name: string;
  type: string;
  price: string;
  duration: string;
  benefits: string;
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

function parseBenefits(plan: PersonalMembershipPlan): string[] {
  if (Array.isArray(plan.benefits)) {
    return plan.benefits;
  }

  if (typeof plan.benefits === "string") {
    try {
      const parsed = JSON.parse(plan.benefits);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return plan.benefits
        .split(",")
        .map((benefit) => benefit.trim())
        .filter(Boolean);
    }
  }

  return [];
}

export function PersonalMembershipPlansPage({
  plans: initialPlans,
}: {
  plans: PersonalMembershipPlan[];
  onRefresh?: () => Promise<void>;
}) {
  const membershipPlans = usePersonal("membershipPlans");
  const actions = usePersonal("actions");
  const [hasHydratedPlans, setHasHydratedPlans] = useState(
    initialPlans.length === 0,
  );
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);
  const [form, setForm] = useState<PlanFormData>({
    name: "",
    type: "monthly",
    price: "",
    duration: "30",
    benefits: "",
  });

  useEffect(() => {
    if (membershipPlans.length > 0 || initialPlans.length === 0) {
      setHasHydratedPlans(true);
    }
  }, [initialPlans.length, membershipPlans.length]);

  const plans = hasHydratedPlans ? membershipPlans : initialPlans;

  const updateFormType = (type: string) => {
    setForm((current) => ({
      ...current,
      type,
      duration: String(DURATION_BY_TYPE[type] ?? 30),
    }));
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

  const handleCreate = () => {
    startTransition(async () => {
      try {
        const payload = {
          name: form.name,
          type: form.type as PersonalMembershipPlan["type"],
          price: Number(form.price),
          duration: Number(form.duration),
          benefits: form.benefits
            .split(",")
            .map((benefit) => benefit.trim())
            .filter(Boolean),
        };

        if (editingId) {
          await actions.updateMembershipPlan(editingId, payload);
        } else {
          await actions.createMembershipPlan(payload);
        }

        resetForm();
      } catch {
        alert("Erro ao salvar plano");
      }
    });
  };

  const confirmDelete = () => {
    if (!planToDelete) {
      return;
    }

    startTransition(async () => {
      try {
        await actions.deleteMembershipPlan(planToDelete);
      } catch {
        alert("Erro ao deletar plano");
      } finally {
        setPlanToDelete(null);
      }
    });
  };

  const startEditing = (plan: PersonalMembershipPlan) => {
    setEditingId(plan.id);
    setForm({
      name: plan.name,
      type: plan.type,
      price: String(plan.price),
      duration: String(plan.duration),
      benefits: parseBenefits(plan).join(", "),
    });
    setIsCreating(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[var(--duo-fg)]">
          Planos de Assinatura
        </h2>
        {!isCreating && (
          <DuoButton variant="primary" onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4" />
            Novo Plano
          </DuoButton>
        )}
      </div>

      {!isCreating && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {plans.length === 0 && (
            <div className="col-span-full py-8 text-center text-[var(--duo-fg-muted)]">
              Nenhum plano cadastrado.
            </div>
          )}
          {plans.map((plan) => {
            const parsedBenefits = parseBenefits(plan);

            return (
              <DuoCard.Root key={plan.id} variant="default" size="default">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <p className="font-bold text-[var(--duo-fg)]">
                      {plan.name}
                    </p>
                    <p className="text-sm text-[var(--duo-fg-muted)]">
                      {PLAN_TYPES.find((type) => type.value === plan.type)?.label ??
                        plan.type}{" "}
                      • {plan.duration} dias
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-[var(--duo-primary)]">
                      R$ {plan.price.toFixed(2)}
                    </p>
                  </div>
                </div>
                {parsedBenefits.length > 0 && (
                  <ul className="mb-3 space-y-1">
                    {parsedBenefits.slice(0, 3).map((benefit, index) => (
                      <li
                        key={`${plan.id}-benefit-${index}`}
                        className="flex items-center gap-1 text-xs text-[var(--duo-fg-muted)]"
                      >
                        <Check className="h-3 w-3 text-[var(--duo-primary)]" />
                        {benefit}
                      </li>
                    ))}
                    {parsedBenefits.length > 3 && (
                      <li className="text-xs italic text-[var(--duo-fg-muted)]">
                        +{parsedBenefits.length - 3} beneficios
                      </li>
                    )}
                  </ul>
                )}
                <div className="mt-auto flex gap-2 pt-2">
                  <DuoButton
                    size="sm"
                    variant="outline"
                    fullWidth
                    onClick={() => startEditing(plan)}
                  >
                    Editar
                  </DuoButton>
                  <DuoButton
                    size="sm"
                    variant="danger"
                    onClick={() => setPlanToDelete(plan.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </DuoButton>
                </div>
              </DuoCard.Root>
            );
          })}
        </div>
      )}

      {isCreating && (
        <DuoCard.Root
          variant="default"
          size="default"
          className="w-full max-w-md"
        >
          <h3 className="mb-4 text-lg font-bold text-[var(--duo-fg)]">
            {editingId ? "Editar Plano" : "Novo Plano"}
          </h3>
          <div className="space-y-3">
            <DuoInput.Simple
              label="Nome do Plano"
              placeholder="Ex: Consultoria Mensal"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
            <div>
              <DuoSelect.Simple
                label="Tipo"
                options={PLAN_TYPES}
                value={form.type}
                onChange={updateFormType}
                placeholder="Tipo"
              />
              <p className="mt-1 text-[10px] text-[var(--duo-fg-muted)]">
                {form.type && `${DURATION_BY_TYPE[form.type] ?? 30} dias`}
              </p>
            </div>
            <DuoInput.Simple
              label="Preco (R$)"
              type="number"
              placeholder="0.00"
              value={form.price}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  price: event.target.value,
                }))
              }
            />
            <DuoInput.Simple
              label="Beneficios (separados por virgula)"
              placeholder="Treino personalizado, Avaliacao fisica..."
              value={form.benefits}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  benefits: event.target.value,
                }))
              }
            />
          </div>
          <div className="mt-6 flex gap-2">
            <DuoButton variant="outline" fullWidth onClick={resetForm}>
              Cancelar
            </DuoButton>
            <DuoButton
              variant="primary"
              fullWidth
              onClick={handleCreate}
              disabled={isPending || !form.name || !form.price}
              isLoading={isPending}
            >
              Salvar
            </DuoButton>
          </div>
        </DuoCard.Root>
      )}

      <AlertDialog
        open={Boolean(planToDelete)}
        onOpenChange={(open) => !open && setPlanToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao ira desativar o plano de assinatura. Usuarios ja
              inscritos nao serao afetados, mas novos alunos nao poderao
              escolher este plano.
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
