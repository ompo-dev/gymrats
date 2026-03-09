"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Trash2,
  Edit,
  Check,
  Loader2,
  Dumbbell,
  Plus,
} from "lucide-react";

import { DuoButton, DuoCard, DuoText } from "@/components/duo";
import { Modal } from "./modal";

import { useModalState } from "@/hooks/use-modal-state";
import { useStudent } from "@/hooks/use-student";
import { apiClient } from "@/lib/api/client";
import type { WeeklyPlanData } from "@/lib/types";

import { EditUnitModal } from "./edit-unit-modal";

export function TrainingLibraryModal() {
  const { isOpen, close } = useModalState("training-library");
  // @ts-ignore - Zustand types might complain about array vs object, ignoring for now
  const libraryPlans = useStudent("libraryPlans") as unknown as WeeklyPlanData[] | null;
  const actions = useStudent("actions");
  const { loadLibraryPlans } = useStudent("loaders");

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<WeeklyPlanData | null>(null);
  const [creatingPlan, setCreatingPlan] = useState(false);

  useEffect(() => {
    if (isOpen) loadLibraryPlans();
  }, [isOpen, loadLibraryPlans]);

  const handleDelete = async (planId: string) => {
    if (!confirm("Tem certeza que deseja excluir este treino da biblioteca?")) return;
    
    setLoadingId(planId);
    try {
      await actions.deleteLibraryPlan(planId);
      toast.success("Treino excluído da biblioteca!");
    } catch (error) {
      toast.error("Erro ao excluir o treino da biblioteca.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleActivate = async (planId: string) => {
    if (!confirm("Isso irá substituir seu treino atual da semana. Deseja continuar?")) return;

    setActivatingId(planId);
    try {
      await actions.activateLibraryPlan(planId);
      toast.success("Treino ativado com sucesso!");
      close();
    } catch (error) {
      toast.error("Erro ao ativar o treino.");
    } finally {
      setActivatingId(null);
    }
  };

  const handleCreateNewPlan = async () => {
    setCreatingPlan(true);
    try {
      const response = await apiClient.post("/api/workouts/library", {
        title: "Novo Plano Semanal",
        isLibraryTemplate: true,
      });
      const body = (response as { data?: { data?: WeeklyPlanData } }).data;
      const newPlan = body?.data;
      if (!newPlan?.id) {
        toast.error("Plano criado, mas não foi possível abrir a edição.");
        await loadLibraryPlans();
        return;
      }
      await loadLibraryPlans();
      setEditingPlan(newPlan);
      toast.success("Plano criado! Preencha os dias da semana.");
    } catch (error) {
      toast.error("Erro ao criar o plano.");
    } finally {
      setCreatingPlan(false);
    }
  };

  const plans = Array.isArray(libraryPlans) ? libraryPlans : [];

  return (
    <>
      <Modal.Root isOpen={isOpen} onClose={close} maxWidth="lg">
        <Modal.Header title="Biblioteca de Treinos" onClose={close}>
          <DuoText variant="body-sm" muted>Seus planos de treino salvos para uso rápido.</DuoText>
        </Modal.Header>

        <Modal.Content>
          {plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-500">
              <Dumbbell className="mb-4 size-10 opacity-20" />
              <DuoText variant="h4">Nenhum treino salvo</DuoText>
              <DuoText variant="body-sm" className="mt-2 text-sm max-w-sm">
                Você ainda não tem treinos na biblioteca. Crie um novo plano ou salve o treino atual como modelo.
              </DuoText>
              <DuoButton
                onClick={handleCreateNewPlan}
                disabled={creatingPlan}
                size="md"
                color="orange"
                className="mt-6 font-bold"
              >
                {creatingPlan ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <>
                    <Plus className="size-5 mr-2" />
                    Criar Treino
                  </>
                )}
              </DuoButton>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <DuoCard.Root
                className="p-4 flex items-center justify-center border-2 border-dashed border-duo-border hover:border-duo-green/50 cursor-pointer transition-colors min-h-[100px]"
                onClick={handleCreateNewPlan}
              >
                <DuoButton
                  variant="ghost"
                  disabled={creatingPlan}
                  className="w-full h-full flex flex-col items-center justify-center gap-2 py-6 text-duo-fg-muted hover:text-duo-green"
                >
                  {creatingPlan ? (
                    <Loader2 className="size-8 animate-spin" />
                  ) : (
                    <>
                      <Plus className="size-8" />
                      <span className="font-bold">Criar novo treino</span>
                    </>
                  )}
                </DuoButton>
              </DuoCard.Root>
              {plans.map((plan) => (
                <DuoCard.Root key={plan.id} className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                  <div className="flex-1 min-w-0">
                    <DuoText variant="h4" className="truncate">
                      {plan.title || "Treino sem título"}
                    </DuoText>
                    {plan.description && (
                      <DuoText variant="label" className="text-zinc-500 truncate block mt-1">
                        {plan.description}
                      </DuoText>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-medium text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-md">
                        {plan.slots?.filter(s => s.type === "workout").length || 0} dias de treino
                      </span>
                      {plan.creatorType === "PERSONAL" && (
                        <span className="text-xs font-medium text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-md">
                          Personal
                        </span>
                      )}
                      {plan.creatorType === "GYM" && (
                        <span className="text-xs font-medium text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded-md">
                          Academia
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <DuoButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingPlan(plan)}
                      className="text-zinc-400 hover:text-white"
                    >
                      <Edit className="size-4" />
                    </DuoButton>
                    <DuoButton
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(plan.id)}
                      disabled={loadingId === plan.id}
                      className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                    >
                      {loadingId === plan.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </DuoButton>
                    <DuoButton
                      size="sm"
                      color="orange"
                      onClick={() => handleActivate(plan.id)}
                      disabled={activatingId === plan.id}
                      className="ml-2 w-full sm:w-auto"
                    >
                      {activatingId === plan.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="size-4 mr-2" />
                          Usar Treino
                        </>
                      )}
                    </DuoButton>
                  </div>
                </DuoCard.Root>
              ))}
            </div>
          )}
        </Modal.Content>
      </Modal.Root>

      {editingPlan && (
        <EditUnitModal
          isWeeklyPlanMode
          isLibraryMode
          isOpen={!!editingPlan}
          onClose={() => {
            setEditingPlan(null);
            loadLibraryPlans();
          }}
          onPlanUpdated={() => loadLibraryPlans()}
          weeklyPlan={editingPlan}
        />
      )}
    </>
  );
}
