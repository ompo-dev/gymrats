"use client";

import { Check, Dumbbell, Edit, Loader2, Plus, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DuoButton, DuoCard, DuoText } from "@/components/duo";
import { useModalState } from "@/hooks/use-modal-state";
import { useStudent } from "@/hooks/use-student";
import { actionClient as apiClient } from "@/lib/actions/client";
import type { WeeklyPlanData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DeleteConfirmationModal } from "./delete-confirmation-modal";
import { EditUnitModal } from "./edit-unit-modal";
import { Modal } from "./modal";

export function TrainingLibraryModal() {
  const { isOpen, close } = useModalState("training-library");
  const libraryPlans = useStudent("libraryPlans") as unknown as
    | WeeklyPlanData[]
    | null;
  const weeklyPlan = useStudent(
    "weeklyPlan",
  ) as unknown as WeeklyPlanData | null;
  const actions = useStudent("actions");
  const { loadLibraryPlans, loadWeeklyPlan } = useStudent("loaders");

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<WeeklyPlanData | null>(null);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [deleteConfirmPlanId, setDeleteConfirmPlanId] = useState<string | null>(
    null,
  );

  const activeSourcePlanId = weeklyPlan?.sourceLibraryPlanId ?? null;

  useEffect(() => {
    if (isOpen) {
      void loadLibraryPlans();
    }
  }, [isOpen, loadLibraryPlans]);

  const loadPlanDetail = async (planId: string) => {
    const response = await apiClient.get<{
      data?: WeeklyPlanData | null;
    }>(`/api/workouts/library/${planId}?fresh=1`);
    return response.data.data ?? null;
  };

  const openPlanEditor = async (planId: string) => {
    setOpeningId(planId);
    try {
      const plan = await loadPlanDetail(planId);
      if (!plan) {
        toast.error("Nao foi possivel carregar o treino.");
        return;
      }
      setEditingPlan(plan);
    } catch (error) {
      console.error("[TrainingLibraryModal] erro ao carregar detalhe:", error);
      toast.error("Erro ao abrir o treino.");
    } finally {
      setOpeningId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmPlanId) return;

    const planId = deleteConfirmPlanId;
    setDeleteConfirmPlanId(null);
    setLoadingId(planId);

    try {
      await actions.deleteLibraryPlan(planId);
      toast.success("Treino excluido da biblioteca!");
    } catch (_error) {
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
    } catch (_error) {
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
      const newPlan = planId ? await loadPlanDetail(planId) : null;
      if (!newPlan?.id) {
        toast.error("Plano criado, mas nao foi possivel abrir a edicao.");
        return;
      }
      setEditingPlan(newPlan);
      toast.success("Plano criado! Preencha os dias da semana.");
    } catch (_error) {
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
          <DuoText variant="body-sm" muted>
            Seus planos de treino salvos para uso rapido.
          </DuoText>
        </Modal.Header>

        <Modal.Content>
          {plans.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-duo-gray/20 text-duo-fg-muted">
                <Dumbbell className="size-8" />
              </div>
              <DuoText variant="h4" className="text-duo-fg">
                Nenhum treino salvo
              </DuoText>
              <DuoText
                variant="body-sm"
                className="mt-2 max-w-sm text-duo-fg-muted"
              >
                Voce ainda nao tem treinos na biblioteca. Crie um novo plano ou
                salve o treino atual como modelo.
              </DuoText>
              <DuoButton
                onClick={handleCreateNewPlan}
                disabled={creatingPlan}
                size="md"
                className="mt-6 bg-duo-green font-bold text-white hover:bg-duo-green-dark"
              >
                {creatingPlan ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <>
                    <Plus className="mr-2 size-5" />
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
                    "group cursor-pointer border-2 border-dashed border-duo-border bg-duo-gray/5 transition-all hover:border-duo-green/50 active:scale-[0.99]",
                    creatingPlan && "pointer-events-none opacity-70",
                  )}
                  onClick={handleCreateNewPlan}
                >
                  <div className="flex items-center justify-center gap-4 py-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-duo-gray/20 text-duo-fg-muted">
                      <Plus className="size-6" />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      {creatingPlan ? (
                        <Loader2 className="size-6 animate-spin text-duo-green" />
                      ) : (
                        <span className="text-lg font-bold text-duo-fg">
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
                const workoutDays =
                  plan.slots?.filter((slot) => slot.type === "workout")
                    .length ?? 0;

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
                      className="group bg-duo-bg-card transition-colors hover:border-duo-green/50"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="flex min-w-0 flex-1 items-center gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-duo-green/10 text-lg font-bold text-duo-green">
                            {workoutDays}
                          </div>
                          <button
                            type="button"
                            className="min-w-0 flex-1 cursor-pointer text-left"
                            onClick={() => void openPlanEditor(plan.id)}
                          >
                            <h4 className="truncate text-lg font-bold text-duo-fg">
                              {plan.title || "Treino sem titulo"}
                            </h4>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <span className="text-sm text-duo-fg-muted">
                                {plan.description?.trim() ||
                                  `${workoutDays} dias de treino`}
                              </span>
                              {plan.creatorType === "PERSONAL" && (
                                <span className="rounded-lg bg-duo-green/10 px-2 py-0.5 text-xs font-medium text-duo-green">
                                  Personal
                                </span>
                              )}
                              {plan.creatorType === "GYM" && (
                                <span className="rounded-lg bg-duo-green/10 px-2 py-0.5 text-xs font-medium text-duo-green">
                                  Academia
                                </span>
                              )}
                            </div>
                          </button>
                        </div>

                        <div className="relative z-10 flex shrink-0 items-center gap-1 sm:flex-none">
                          <DuoButton
                            variant="ghost"
                            size="icon"
                            className="text-duo-fg-muted hover:bg-duo-green/10 hover:text-duo-green"
                            onClick={(event) => {
                              event.stopPropagation();
                              void openPlanEditor(plan.id);
                            }}
                            disabled={openingId === plan.id}
                            title="Editar treino"
                          >
                            {openingId === plan.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Edit className="size-4" />
                            )}
                          </DuoButton>
                          <DuoButton
                            variant="ghost"
                            size="icon"
                            className="text-duo-fg-muted hover:bg-duo-danger/10 hover:text-duo-danger"
                            onClick={(event) => {
                              event.stopPropagation();
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
                                "ml-2 inline-flex items-center gap-1.5 rounded-lg border border-duo-green/40 bg-duo-green/20 px-3 py-1.5 text-sm font-bold text-duo-green",
                                "cursor-default",
                              )}
                            >
                              <Check className="size-4" />
                              EM USO
                            </span>
                          ) : (
                            <DuoButton
                              variant="secondary"
                              size="sm"
                              className="ml-2 gap-1.5 border-0 bg-duo-green/20 font-bold text-duo-green hover:bg-duo-green hover:text-white"
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleActivate(plan.id);
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
                    "[TrainingLibraryModal] erro ao sincronizar plano ativo:",
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
        message="Tem certeza que deseja excluir este treino da biblioteca? Essa acao nao pode ser desfeita."
      />
    </>
  );
}
