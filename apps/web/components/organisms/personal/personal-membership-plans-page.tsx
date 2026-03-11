"use client";

import { Check, Plus, Trash2, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
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
import {
  createPersonalMembershipPlanRequest,
  deletePersonalMembershipPlanRequest,
  updatePersonalMembershipPlanRequest,
} from "@/lib/api/personal-client";
import type { PersonalMembershipPlan } from "@gymrats/types/personal-module";

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

export function PersonalMembershipPlansPage({
  plans,
  onRefresh,
}: {
  plans: PersonalMembershipPlan[];
  onRefresh?: () => Promise<void>;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
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
            .map((b) => b.trim())
            .filter(Boolean),
        };

        if (editingId) {
          await updatePersonalMembershipPlanRequest(editingId, payload);
        } else {
          await createPersonalMembershipPlanRequest(payload);
        }
        await onRefresh?.();
        resetForm();
      } catch (error) {
        console.error("Erro ao salvar plano:", error);
        alert("Erro ao salvar plano");
      }
    });
  };

  const [planToDelete, setPlanToDelete] = useState<string | null>(null);

  const confirmDelete = () => {
    if (!planToDelete) return;
    startTransition(async () => {
      try {
        await deletePersonalMembershipPlanRequest(planToDelete);
        await onRefresh?.();
      } catch (error) {
        console.error("Erro ao deletar plano:", error);
        alert("Erro ao deletar plano");
      } finally {
        setPlanToDelete(null);
      }
    });
  };

  const startEditing = (plan: PersonalMembershipPlan) => {
    setEditingId(plan.id);
    let benefitsStr = "";
    if (Array.isArray(plan.benefits)) {
      benefitsStr = plan.benefits.join(", ");
    } else if (typeof plan.benefits === "string") {
       try {
           const parsed = JSON.parse(plan.benefits);
           if (Array.isArray(parsed)) benefitsStr = parsed.join(", ");
       } catch {
           benefitsStr = plan.benefits;
       }
    }
    setForm({
      name: plan.name,
      type: plan.type,
      price: String(plan.price),
      duration: String(plan.duration),
      benefits: benefitsStr,
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

      {/* Lista de planos */}
      {!isCreating && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {plans.length === 0 && (
            <div className="col-span-full py-8 text-center text-[var(--duo-fg-muted)]">
              Nenhum plano cadastrado.
            </div>
          )}
          {plans.map((plan) => {
            let parsedBenefits: string[] = [];
            if (Array.isArray(plan.benefits)) {
              parsedBenefits = plan.benefits;
            } else if (typeof plan.benefits === "string") {
              try {
                parsedBenefits = JSON.parse(plan.benefits);
              } catch {}
            }

            return (
              <DuoCard.Root key={plan.id} variant="default" size="default">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <p className="font-bold text-[var(--duo-fg)]">{plan.name}</p>
                    <p className="text-sm text-[var(--duo-fg-muted)]">
                      {PLAN_TYPES.find((t) => t.value === plan.type)?.label ||
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
                    {parsedBenefits.slice(0, 3).map((b, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-1 text-xs text-[var(--duo-fg-muted)]"
                      >
                        <Check className="h-3 w-3 text-[var(--duo-primary)]" />
                        {b}
                      </li>
                    ))}
                    {parsedBenefits.length > 3 && (
                      <li className="text-xs text-[var(--duo-fg-muted)] italic">
                        +{parsedBenefits.length - 3} benefícios
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

      {/* Form de criação / edição */}
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
            <div>
              <label className="mb-1 block text-xs font-bold text-[var(--duo-fg-muted)]">
                Nome do Plano
              </label>
              <DuoInput.Simple
                placeholder="Ex: Consultoria Mensal"
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
              <DuoSelect.Simple
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
              <DuoInput.Simple
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
              <DuoInput.Simple
                placeholder="Treino personalizado, Avaliação física..."
                value={form.benefits}
                onChange={(e) =>
                  setForm((f) => ({ ...f, benefits: e.target.value }))
                }
              />
            </div>
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
        open={!!planToDelete}
        onOpenChange={(open) => !open && setPlanToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá desativar o plano de assinatura. Usuários já
              inscritos não serão afetados, mas novos alunos não poderão
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
