"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { motion } from "motion/react";
import {
  Trash2,
  Edit,
  Check,
  Loader2,
  Dumbbell,
  Plus,
} from "lucide-react";

import { DuoButton, DuoCard, DuoText } from "@/components/duo";
import { cn } from "@/lib/utils";
import { Modal } from "./modal";

import { useModalState } from "@/hooks/use-modal-state";
import { useStudent } from "@/hooks/use-student";
import type { WeeklyPlanData } from "@/lib/types";
import { useStudentUnifiedStore } from "@/stores/student-unified-store";

import { DeleteConfirmationModal } from "./delete-confirmation-modal";
import { EditUnitModal } from "./edit-unit-modal";

export function TrainingLibraryModal() {
  const { isOpen, close } = useModalState("training-library");
  const libraryPlans = useStudent("libraryPlans") as unknown as WeeklyPlanData[] | null;
  const weeklyPlan = (
    useStudent("weeklyPlan") as unknown
  ) as WeeklyPlanData | null;
  const actions = useStudent("actions");
  const { loadLibraryPlans, loadWeeklyPlan } = useStudent("loaders");

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<WeeklyPlanData | null>(null);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [deleteConfirmPlanId, setDeleteConfirmPlanId] = useState<string | null>(null);

  const activeSourcePlanId = weeklyPlan?.sourceLibraryPlanId ?? null;

  useEffect(() => {
    if (isOpen) {
      void loadLibraryPlans();
      void loadWeeklyPlan(true);
    }
  }, [isOpen, loadLibraryPlans, loadWeeklyPlan]);

  const confirmDelete = async () => {
    if (!deleteConfirmPlanId) return;
    const planId = deleteConfirmPlanId;
    setDeleteConfirmPlanId(null);
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
      const planId = await actions.createLibraryPlan({
        title: "Novo Plano Semanal",
        isLibraryTemplate: true,
      });
      await loadLibraryPlans();
      const newPlan =
        useStudentUnifiedStore
          .getState()
          .data.libraryPlans?.find((plan) => plan.id === planId) ?? null;
      if (!newPlan?.id) {
        toast.error("Plano criado, mas não foi possível abrir a edição.");
        return;
      }
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
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-duo-gray/20 text-duo-fg-muted mb-4">
                <Dumbbell className="size-8" />
              </div>
              <DuoText variant="h4" className="text-duo-fg">Nenhum treino salvo</DuoText>
              <DuoText variant="body-sm" className="mt-2 text-duo-fg-muted max-w-sm">
                Você ainda não tem treinos na biblioteca. Crie um novo plano ou salve o treino atual como modelo.
              </DuoText>
              <DuoButton
                onClick={handleCreateNewPlan}
                disabled={creatingPlan}
                size="md"
                className="mt-6 font-bold bg-duo-green hover:bg-duo-green-dark text-white"
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
            </motion.div>
          ) : (
            <div className="space-y-4 pt-2">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <DuoCard.Root
                  variant="default"
                  padding="md"
                  className={cn(
                    "group border-2 border-dashed bg-duo-gray/5 border-duo-border hover:border-duo-green/50 cursor-pointer transition-all active:scale-[0.99]",
                    creatingPlan && "pointer-events-none opacity-70",
                  )}
                  onClick={handleCreateNewPlan}
                >
                  <div className="flex items-center justify-center gap-4 py-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-duo-gray/20 text-duo-fg-muted">
                      <Plus className="size-6" />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      {creatingPlan ? (
                        <Loader2 className="size-6 animate-spin text-duo-green" />
                      ) : (
                        <span className="font-bold text-duo-fg text-lg">
                          Criar novo treino
                        </span>
                      )}
                      <span className="text-sm text-duo-fg-muted">
                        Plano semanal em branco
                      </span>
                    </div>
                  </div>
                </DuoCard.Root>
              </motion.div>

              {plans.map((plan, index) => {
                const workoutDays = plan.slots?.filter((s) => s.type === "workout").length ?? 0;
                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.05 }}
                  >
                    <DuoCard.Root
                      variant="highlighted"
                      padding="md"
                      className="group hover:border-duo-green/50 transition-colors bg-duo-bg-card"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="flex-none flex items-center justify-center w-10 h-10 rounded-2xl bg-duo-green/10 text-duo-green font-bold text-lg shrink-0">
                            {workoutDays}
                          </div>
                          <div
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => setEditingPlan(plan)}
                          >
                          <h4 className="font-bold text-duo-fg text-lg truncate">
                            {plan.title || "Treino sem título"}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-sm text-duo-fg-muted">
                              {plan.description?.trim() || `${workoutDays} dias de treino`}
                            </span>
                            {plan.creatorType === "PERSONAL" && (
                              <span className="text-xs font-medium text-duo-green bg-duo-green/10 px-2 py-0.5 rounded-lg">
                                Personal
                              </span>
                            )}
                            {plan.creatorType === "GYM" && (
                              <span className="text-xs font-medium text-duo-green bg-duo-green/10 px-2 py-0.5 rounded-lg">
                                Academia
                              </span>
                            )}
                          </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 z-10 relative shrink-0 sm:flex-none">
                          <DuoButton
                            variant="ghost"
                            size="icon"
                            className="text-duo-fg-muted hover:text-duo-green hover:bg-duo-green/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingPlan(plan);
                            }}
                            title="Editar treino"
                          >
                            <Edit className="size-4" />
                          </DuoButton>
                          <DuoButton
                            variant="ghost"
                            size="icon"
                            className="text-duo-fg-muted hover:text-duo-danger hover:bg-duo-danger/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmPlanId(plan.id);
                            }}
                            disabled={loadingId === plan.id}
                            title="Excluir da biblioteca"
                          >
                            {loadingId === plan.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Trash2 className="size-4" />
                            )}
                          </DuoButton>
                          {plan.id === activeSourcePlanId ? (
                            <span
                              className={cn(
                                "ml-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold",
                                "bg-duo-green/20 text-duo-green border border-duo-green/40 cursor-default",
                              )}
                            >
                              <Check className="size-4" />
                              EM USO
                            </span>
                          ) : (
                            <DuoButton
                              variant="secondary"
                              size="sm"
                              className="ml-2 font-bold gap-1.5 bg-duo-green/20 text-duo-green hover:bg-duo-green hover:text-white border-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleActivate(plan.id);
                              }}
                              disabled={activatingId === plan.id}
                            >
                              {activatingId === plan.id ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <>
                                  <Check className="size-4" />
                                  Usar
                                </>
                              )}
                            </DuoButton>
                          )}
                        </div>
                      </div>
                    </DuoCard.Root>
                  </motion.div>
                );
              })}
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
            const editedPlanId = editingPlan.id;
            setEditingPlan(null);
            void (async () => {
              await loadLibraryPlans();
              if (activeSourcePlanId === editedPlanId) {
                try {
                  await actions.activateLibraryPlan(editedPlanId);
                  await loadWeeklyPlan(true);
                } catch (error) {
                  console.error(
                    "[TrainingLibraryModal] Erro ao sincronizar plano ativo:",
                    error,
                  );
                  toast.error(
                    "O treino da semana nao foi sincronizado automaticamente.",
                  );
                }
              }
            })();
          }}
          onPlanUpdated={() => loadLibraryPlans()}
          weeklyPlan={editingPlan}
        />
      )}

      <DeleteConfirmationModal
        isOpen={!!deleteConfirmPlanId}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmPlanId(null)}
        title="Excluir treino da biblioteca?"
        message="Tem certeza que deseja excluir este treino da biblioteca? Essa ação não pode ser desfeita."
      />
    </>
  );
}
