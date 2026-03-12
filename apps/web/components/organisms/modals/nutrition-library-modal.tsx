"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Apple, Check, Edit, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DuoButton, DuoCard, DuoText } from "@/components/duo";
import { useModalState } from "@/hooks/use-modal-state";
import { useStudent } from "@/hooks/use-student";
import type { NutritionPlanData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useStudentUnifiedStore } from "@/stores/student-unified-store";
import { useStudentDetailStore } from "@/stores/student-detail-store";
import { DeleteConfirmationModal } from "./delete-confirmation-modal";
import { EditNutritionPlanModal } from "./edit-nutrition-plan-modal";
import { Modal } from "./modal";

interface NutritionLibraryModalProps {
  apiMode?: "student" | "gym" | "personal";
  studentId?: string;
  isOpen?: boolean;
  onClose?: () => void;
  onPlansSynced?: () => void | Promise<void>;
}

const EMPTY_NUTRITION_PLANS: NutritionPlanData[] = [];

export function NutritionLibraryModal({
  apiMode = "student",
  studentId,
  isOpen,
  onClose,
  onPlansSynced,
}: NutritionLibraryModalProps = {}) {
  const internalModal = useModalState("nutrition-library");
  const isControlled = isOpen !== undefined || onClose !== undefined;
  const resolvedOpen = isControlled ? !!isOpen : internalModal.isOpen;
  const resolvedClose = isControlled ? (onClose ?? (() => {})) : internalModal.close;
  const loadStudentNutritionLibraryPlans = useStudentUnifiedStore(
    (state) => state.loadNutritionLibraryPlans,
  );
  const loadStudentActiveNutritionPlan = useStudentUnifiedStore(
    (state) => state.loadActiveNutritionPlan,
  );
  const loadStudentNutrition = useStudentUnifiedStore(
    (state) => state.loadNutrition,
  );
  const createStudentNutritionLibraryPlan = useStudentUnifiedStore(
    (state) => state.createNutritionLibraryPlan,
  );
  const deleteStudentNutritionLibraryPlan = useStudentUnifiedStore(
    (state) => state.deleteNutritionLibraryPlan,
  );
  const activateStudentNutritionLibraryPlan = useStudentUnifiedStore(
    (state) => state.activateNutritionLibraryPlan,
  );
  const studentPlans = useStudent("nutritionLibraryPlans") as unknown as NutritionPlanData[];
  const activeStudentPlan =
    useStudent("activeNutritionPlan") as unknown as NutritionPlanData | null;
  const loadDetailNutritionLibraryPlans = useStudentDetailStore(
    (state) => state.loadNutritionLibraryPlans,
  );
  const loadDetailActiveNutritionPlan = useStudentDetailStore(
    (state) => state.loadActiveNutritionPlan,
  );
  const createDetailNutritionLibraryPlan = useStudentDetailStore(
    (state) => state.createNutritionLibraryPlan,
  );
  const deleteDetailNutritionLibraryPlan = useStudentDetailStore(
    (state) => state.deleteNutritionLibraryPlan,
  );
  const activateDetailNutritionLibraryPlan = useStudentDetailStore(
    (state) => state.activateNutritionLibraryPlan,
  );
  const detailKey =
    apiMode !== "student" && studentId
      ? `${apiMode}:${studentId}` as const
      : null;
  const detailPlans = useStudentDetailStore((state) =>
    detailKey
      ? state.nutritionLibraryPlans[detailKey] ?? EMPTY_NUTRITION_PLANS
      : EMPTY_NUTRITION_PLANS,
  );
  const activeDetailPlan = useStudentDetailStore((state) =>
    detailKey ? state.activeNutritionPlans[detailKey] ?? null : null,
  );

  const libraryPlans = apiMode === "student" ? studentPlans : detailPlans;
  const activePlan = apiMode === "student" ? activeStudentPlan : activeDetailPlan;
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<NutritionPlanData | null>(null);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [deletePlanId, setDeletePlanId] = useState<string | null>(null);
  const hasLoadedForOpenRef = useRef(false);
  const lastOpenKeyRef = useRef<string | null>(null);

  const activeSourcePlanId = activePlan?.sourceLibraryPlanId ?? null;

  const loadData = useCallback(async () => {
    if (apiMode === "student") {
      await Promise.all([
        loadStudentNutritionLibraryPlans(),
        loadStudentActiveNutritionPlan(),
      ]);
      return;
    }

    if (!studentId) return;
    await Promise.all([
      loadDetailNutritionLibraryPlans(apiMode, studentId),
      loadDetailActiveNutritionPlan(apiMode, studentId),
    ]);
  }, [
    apiMode,
    loadDetailActiveNutritionPlan,
    loadDetailNutritionLibraryPlans,
    loadStudentActiveNutritionPlan,
    loadStudentNutrition,
    loadStudentNutritionLibraryPlans,
    studentId,
  ]);

  const syncAfterPlanChange = useCallback(async () => {
    await loadData();
    if (apiMode === "student") {
      await loadStudentNutrition();
    }
    await onPlansSynced?.();
  }, [apiMode, loadData, loadStudentNutrition, onPlansSynced]);

  useEffect(() => {
    if (!resolvedOpen) {
      hasLoadedForOpenRef.current = false;
      lastOpenKeyRef.current = null;
      return;
    }

    const openKey = `${apiMode}:${studentId ?? "self"}`;
    if (
      hasLoadedForOpenRef.current &&
      lastOpenKeyRef.current === openKey
    ) {
      return;
    }

    hasLoadedForOpenRef.current = true;
    lastOpenKeyRef.current = openKey;
    void loadData();
  }, [apiMode, loadData, resolvedOpen, studentId]);

  const handleCreate = async () => {
    setCreatingPlan(true);
    try {
      const planId =
        apiMode === "student"
          ? await createStudentNutritionLibraryPlan({
              title: "Novo Plano Alimentar",
            })
          : studentId
            ? await createDetailNutritionLibraryPlan({
                scope: apiMode,
                studentId,
                payload: {
                  title: "Novo Plano Alimentar",
                },
              })
            : null;

      await loadData();
      const nextPlan =
        apiMode === "student"
          ? (useStudentUnifiedStore
              .getState()
              .data.nutritionLibraryPlans.find((plan) => plan.id === planId) ??
            null)
          : detailKey
            ? ((useStudentDetailStore
                .getState()
                .nutritionLibraryPlans[detailKey] ?? []
              ).find((plan) => plan.id === planId) ?? null)
            : null;
      setEditingPlan(nextPlan);
      toast.success("Plano alimentar criado!");
    } catch {
      toast.error("Erro ao criar plano alimentar.");
    } finally {
      setCreatingPlan(false);
    }
  };

  const handleDelete = async () => {
    if (!deletePlanId) return;
    const planId = deletePlanId;
    setDeletePlanId(null);
    setLoadingId(planId);

    try {
      if (apiMode === "student") {
        await deleteStudentNutritionLibraryPlan(planId);
      } else if (studentId) {
        await deleteDetailNutritionLibraryPlan({
          scope: apiMode,
          studentId,
          planId,
        });
      }
      toast.success("Plano alimentar removido!");
      await syncAfterPlanChange();
    } catch {
      toast.error("Erro ao remover plano alimentar.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleActivate = async (planId: string) => {
    setActivatingId(planId);
    try {
      if (apiMode === "student") {
        await activateStudentNutritionLibraryPlan(planId);
      } else if (studentId) {
        await activateDetailNutritionLibraryPlan({
          scope: apiMode,
          studentId,
          planId,
        });
      }
      await syncAfterPlanChange();
      toast.success("Plano alimentar ativado!");
      resolvedClose();
    } catch {
      toast.error("Erro ao ativar o plano alimentar.");
    } finally {
      setActivatingId(null);
    }
  };

  const sortedPlans = useMemo(
    () => [...libraryPlans].sort((a, b) => a.title.localeCompare(b.title)),
    [libraryPlans],
  );

  return (
    <>
      <Modal.Root isOpen={resolvedOpen} onClose={resolvedClose} maxWidth="lg">
        <Modal.Header title="Biblioteca de Alimentação" onClose={resolvedClose}>
          <DuoText variant="body-sm" muted>
            Planos salvos para ativar rápido no dia a dia do aluno.
          </DuoText>
        </Modal.Header>

        <Modal.Content>
          {sortedPlans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-duo-gray/20 text-duo-fg-muted">
                <Apple className="size-8" />
              </div>
              <DuoText variant="h4" className="text-duo-fg">
                Nenhum plano salvo
              </DuoText>
              <DuoText variant="body-sm" className="mt-2 max-w-sm text-duo-fg-muted">
                Crie um plano alimentar em branco e monte as refeições da biblioteca.
              </DuoText>
              <DuoButton
                onClick={handleCreate}
                disabled={creatingPlan}
                size="md"
                className="mt-6 font-bold bg-duo-green hover:bg-duo-green-dark text-white"
              >
                {creatingPlan ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <>
                    <Plus className="mr-2 size-5" />
                    Criar Plano
                  </>
                )}
              </DuoButton>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <DuoCard.Root
                variant="default"
                padding="md"
                className={cn(
                  "cursor-pointer border-2 border-dashed border-duo-border bg-duo-gray/5 transition-all hover:border-duo-green/50",
                  creatingPlan && "pointer-events-none opacity-70",
                )}
                onClick={handleCreate}
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
                        Criar novo plano
                      </span>
                    )}
                    <span className="text-sm text-duo-fg-muted">
                      Plano alimentar em branco
                    </span>
                  </div>
                </div>
              </DuoCard.Root>

              {sortedPlans.map((plan) => (
                <DuoCard.Root
                  key={plan.id}
                  variant="highlighted"
                  padding="md"
                  className="bg-duo-bg-card transition-colors hover:border-duo-green/50"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div
                      className="min-w-0 flex-1 cursor-pointer"
                      onClick={() => setEditingPlan(plan)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-duo-green/10 text-duo-green font-bold">
                          {plan.meals.length}
                        </div>
                        <div className="min-w-0">
                          <h4 className="truncate text-lg font-bold text-duo-fg">
                            {plan.title || "Plano sem título"}
                          </h4>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className="text-sm text-duo-fg-muted">
                              {plan.description?.trim() || `${plan.meals.length} refeições`}
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
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <DuoButton
                        variant="ghost"
                        size="icon"
                        className="text-duo-fg-muted hover:bg-duo-green/10 hover:text-duo-green"
                        onClick={() => setEditingPlan(plan)}
                        title="Editar plano"
                      >
                        <Edit className="size-4" />
                      </DuoButton>
                      <DuoButton
                        variant="ghost"
                        size="icon"
                        className="text-duo-fg-muted hover:bg-duo-danger/10 hover:text-duo-danger"
                        onClick={() => setDeletePlanId(plan.id)}
                        disabled={loadingId === plan.id}
                        title="Excluir plano"
                      >
                        {loadingId === plan.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                      </DuoButton>
                      {plan.id === activeSourcePlanId ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-duo-green/40 bg-duo-green/20 px-3 py-1.5 text-sm font-bold text-duo-green">
                          <Check className="size-4" />
                          EM USO
                        </span>
                      ) : (
                        <DuoButton
                          variant="secondary"
                          size="sm"
                          className="font-bold bg-duo-green/20 text-duo-green hover:bg-duo-green hover:text-white"
                          onClick={() => handleActivate(plan.id)}
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
              ))}
            </div>
          )}
        </Modal.Content>
      </Modal.Root>

      {editingPlan && (
        <EditNutritionPlanModal
          isOpen={!!editingPlan}
          nutritionPlan={editingPlan}
          apiMode={apiMode}
          studentId={studentId}
          onClose={() => setEditingPlan(null)}
          onPlanUpdated={async () => {
            await syncAfterPlanChange();
          }}
        />
      )}

      <DeleteConfirmationModal
        isOpen={!!deletePlanId}
        onConfirm={handleDelete}
        onCancel={() => setDeletePlanId(null)}
        title="Excluir plano alimentar?"
        message="Tem certeza que deseja excluir este plano da biblioteca?"
      />
    </>
  );
}
