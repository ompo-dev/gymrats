"use client";

import { Apple, Check, Edit, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DuoButton, DuoCard, DuoText } from "@/components/duo";
import { useModalState } from "@/hooks/use-modal-state";
import { useStudent } from "@/hooks/use-student";
import { actionClient as apiClient } from "@/lib/actions/client";
import type { NutritionPlanData } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  type StudentDetailScope,
  useStudentDetailStore,
} from "@/stores/student-detail-store";
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

interface NutritionLibraryShellProps {
  isOpen: boolean;
  onClose: () => void;
  libraryPlans: NutritionPlanData[];
  activeSourcePlanId: string | null;
  creatingPlan: boolean;
  loadingId: string | null;
  activatingId: string | null;
  onCreate: () => Promise<void>;
  onDeleteRequest: (planId: string) => void;
  onEditRequest: (planId: string) => Promise<void>;
  onActivate: (planId: string) => Promise<void>;
}

function NutritionLibraryShell({
  isOpen,
  onClose,
  libraryPlans,
  activeSourcePlanId,
  creatingPlan,
  loadingId,
  activatingId,
  onCreate,
  onDeleteRequest,
  onEditRequest,
  onActivate,
}: NutritionLibraryShellProps) {
  const sortedPlans = useMemo(
    () => [...libraryPlans].sort((a, b) => a.title.localeCompare(b.title)),
    [libraryPlans],
  );

  const getMealCount = (plan: NutritionPlanData) =>
    Number((plan as NutritionPlanData & { mealCount?: number }).mealCount) ||
    plan.meals.length;

  const getPreview = (plan: NutritionPlanData) =>
    (plan as NutritionPlanData & { preview?: string }).preview?.trim() ||
    plan.description?.trim() ||
    `${getMealCount(plan)} refeicoes`;

  return (
    <Modal.Root isOpen={isOpen} onClose={onClose} maxWidth="lg">
      <Modal.Header title="Biblioteca de Alimentacao" onClose={onClose}>
        <DuoText variant="body-sm" muted>
          Planos salvos para ativar rapido no dia a dia do aluno.
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
            <DuoText
              variant="body-sm"
              className="mt-2 max-w-sm text-duo-fg-muted"
            >
              Crie um plano alimentar em branco e monte as refeicoes da
              biblioteca.
            </DuoText>
            <DuoButton
              onClick={() => void onCreate()}
              disabled={creatingPlan}
              size="md"
              className="mt-6 bg-duo-green font-bold text-white hover:bg-duo-green-dark"
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
              onClick={() => void onCreate()}
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
                  <button
                    type="button"
                    className="min-w-0 flex-1 cursor-pointer text-left"
                    onClick={() => void onEditRequest(plan.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-duo-green/10 font-bold text-duo-green">
                        {getMealCount(plan)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="truncate text-lg font-bold text-duo-fg">
                          {plan.title || "Plano sem titulo"}
                        </h4>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="text-sm text-duo-fg-muted">
                            {getPreview(plan)}
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
                  </button>

                  <div className="flex items-center gap-2">
                    <DuoButton
                      variant="ghost"
                      size="icon"
                      className="text-duo-fg-muted hover:bg-duo-green/10 hover:text-duo-green"
                      onClick={() => void onEditRequest(plan.id)}
                      title="Editar plano"
                    >
                      <Edit className="size-4" />
                    </DuoButton>
                    <DuoButton
                      variant="ghost"
                      size="icon"
                      className="text-duo-fg-muted hover:bg-duo-danger/10 hover:text-duo-danger"
                      onClick={() => onDeleteRequest(plan.id)}
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
                        className="bg-duo-green/20 font-bold text-duo-green hover:bg-duo-green hover:text-white"
                        onClick={() => void onActivate(plan.id)}
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
  );
}

function StudentNutritionLibraryModal() {
  const { isOpen, close } = useModalState("nutrition-library");
  const libraryPlans =
    (useStudent("nutritionLibraryPlans") as unknown as NutritionPlanData[]) ??
    EMPTY_NUTRITION_PLANS;
  const activePlan =
    (useStudent(
      "activeNutritionPlan",
    ) as unknown as NutritionPlanData | null) ?? null;
  const {
    createNutritionLibraryPlan,
    deleteNutritionLibraryPlan,
    activateNutritionLibraryPlan,
  } = useStudent("actions");
  const { loadNutritionLibraryPlans, loadActiveNutritionPlan, loadNutrition } =
    useStudent("loaders");

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<NutritionPlanData | null>(
    null,
  );
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [deletePlanId, setDeletePlanId] = useState<string | null>(null);

  const activeSourcePlanId = activePlan?.sourceLibraryPlanId ?? null;

  useEffect(() => {
    if (!isOpen) return;

    void loadNutritionLibraryPlans();
    if (!activePlan) {
      void loadActiveNutritionPlan();
    }
  }, [activePlan, isOpen, loadActiveNutritionPlan, loadNutritionLibraryPlans]);

  const loadStudentPlanDetail = async (planId: string) => {
    const response = await apiClient.get<{
      data?: NutritionPlanData | null;
    }>(`/api/nutrition/library/${planId}?fresh=1`);
    return response.data.data ?? null;
  };

  const syncStudentNutrition = async () => {
    await Promise.allSettled([
      loadNutritionLibraryPlans(),
      loadActiveNutritionPlan(),
      loadNutrition(),
    ]);
  };

  const handleCreate = async () => {
    setCreatingPlan(true);
    try {
      const planId = await createNutritionLibraryPlan({
        title: "Novo Plano Alimentar",
      });
      await loadNutritionLibraryPlans();
      const nextPlan = planId ? await loadStudentPlanDetail(planId) : null;
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
      await deleteNutritionLibraryPlan(planId);
      await syncStudentNutrition();
      toast.success("Plano alimentar removido!");
    } catch {
      toast.error("Erro ao remover plano alimentar.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleActivate = async (planId: string) => {
    setActivatingId(planId);
    try {
      await activateNutritionLibraryPlan(planId);
      toast.success("Plano alimentar ativado!");
      close();
    } catch {
      toast.error("Erro ao ativar o plano alimentar.");
    } finally {
      setActivatingId(null);
    }
  };

  const handleEditRequest = async (planId: string) => {
    try {
      const plan = await loadStudentPlanDetail(planId);
      if (!plan) {
        toast.error("Nao foi possivel carregar o plano alimentar.");
        return;
      }
      setEditingPlan(plan);
    } catch {
      toast.error("Erro ao abrir o plano alimentar.");
    }
  };

  return (
    <>
      <NutritionLibraryShell
        isOpen={isOpen}
        onClose={close}
        libraryPlans={libraryPlans}
        activeSourcePlanId={activeSourcePlanId}
        creatingPlan={creatingPlan}
        loadingId={loadingId}
        activatingId={activatingId}
        onCreate={handleCreate}
        onDeleteRequest={setDeletePlanId}
        onEditRequest={handleEditRequest}
        onActivate={handleActivate}
      />

      {editingPlan && (
        <EditNutritionPlanModal
          isOpen={!!editingPlan}
          nutritionPlan={editingPlan}
          onClose={() => setEditingPlan(null)}
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

function ScopedNutritionLibraryModal({
  apiMode,
  studentId,
  isOpen,
  onClose,
  onPlansSynced,
}: Required<
  Pick<
    NutritionLibraryModalProps,
    "apiMode" | "studentId" | "isOpen" | "onClose"
  >
> &
  Pick<NutritionLibraryModalProps, "onPlansSynced">) {
  const scope = apiMode as StudentDetailScope;
  const detailKey = `${scope}:${studentId}` as const;

  const loadNutritionLibraryPlans = useStudentDetailStore(
    (state) => state.loadNutritionLibraryPlans,
  );
  const loadActiveNutritionPlan = useStudentDetailStore(
    (state) => state.loadActiveNutritionPlan,
  );
  const createNutritionLibraryPlan = useStudentDetailStore(
    (state) => state.createNutritionLibraryPlan,
  );
  const deleteNutritionLibraryPlan = useStudentDetailStore(
    (state) => state.deleteNutritionLibraryPlan,
  );
  const activateNutritionLibraryPlan = useStudentDetailStore(
    (state) => state.activateNutritionLibraryPlan,
  );
  const libraryPlans = useStudentDetailStore(
    (state) => state.nutritionLibraryPlans[detailKey] ?? EMPTY_NUTRITION_PLANS,
  );
  const activePlan = useStudentDetailStore(
    (state) => state.activeNutritionPlans[detailKey] ?? null,
  );

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<NutritionPlanData | null>(
    null,
  );
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [deletePlanId, setDeletePlanId] = useState<string | null>(null);

  const activeSourcePlanId = activePlan?.sourceLibraryPlanId ?? null;

  useEffect(() => {
    if (!isOpen) return;

    void loadNutritionLibraryPlans(scope, studentId);
    if (!activePlan) {
      void loadActiveNutritionPlan(scope, studentId);
    }
  }, [
    activePlan,
    isOpen,
    loadActiveNutritionPlan,
    loadNutritionLibraryPlans,
    scope,
    studentId,
  ]);

  const loadScopedPlanDetail = async (planId: string) => {
    const response = await apiClient.get<{
      data?: NutritionPlanData | null;
    }>(
      `/api/${scope}/students/${studentId}/nutrition/library/${planId}?fresh=1`,
    );
    return response.data.data ?? null;
  };

  const syncScopedPlans = async () => {
    await Promise.allSettled([
      loadNutritionLibraryPlans(scope, studentId),
      loadActiveNutritionPlan(scope, studentId),
      onPlansSynced?.(),
    ]);
  };

  const handleCreate = async () => {
    setCreatingPlan(true);
    try {
      const planId = await createNutritionLibraryPlan({
        scope,
        studentId,
        payload: {
          title: "Novo Plano Alimentar",
        },
      });
      await loadNutritionLibraryPlans(scope, studentId);
      const nextPlan = planId ? await loadScopedPlanDetail(planId) : null;
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
      await deleteNutritionLibraryPlan({
        scope,
        studentId,
        planId,
      });
      await syncScopedPlans();
      toast.success("Plano alimentar removido!");
    } catch {
      toast.error("Erro ao remover plano alimentar.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleActivate = async (planId: string) => {
    setActivatingId(planId);
    try {
      await activateNutritionLibraryPlan({
        scope,
        studentId,
        planId,
      });
      toast.success("Plano alimentar ativado!");
      onClose();
    } catch {
      toast.error("Erro ao ativar o plano alimentar.");
    } finally {
      setActivatingId(null);
    }
  };

  const handleEditRequest = async (planId: string) => {
    try {
      const plan = await loadScopedPlanDetail(planId);
      if (!plan) {
        toast.error("Nao foi possivel carregar o plano alimentar.");
        return;
      }
      setEditingPlan(plan);
    } catch {
      toast.error("Erro ao abrir o plano alimentar.");
    }
  };

  return (
    <>
      <NutritionLibraryShell
        isOpen={isOpen}
        onClose={onClose}
        libraryPlans={libraryPlans}
        activeSourcePlanId={activeSourcePlanId}
        creatingPlan={creatingPlan}
        loadingId={loadingId}
        activatingId={activatingId}
        onCreate={handleCreate}
        onDeleteRequest={setDeletePlanId}
        onEditRequest={handleEditRequest}
        onActivate={handleActivate}
      />

      {editingPlan && (
        <EditNutritionPlanModal
          isOpen={!!editingPlan}
          nutritionPlan={editingPlan}
          apiMode={scope}
          studentId={studentId}
          onClose={() => setEditingPlan(null)}
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

export function NutritionLibraryModal(props: NutritionLibraryModalProps = {}) {
  if (props.apiMode && props.apiMode !== "student") {
    if (!props.studentId || props.isOpen === undefined || !props.onClose) {
      return null;
    }

    return (
      <ScopedNutritionLibraryModal
        apiMode={props.apiMode}
        studentId={props.studentId}
        isOpen={props.isOpen}
        onClose={props.onClose}
        onPlansSynced={props.onPlansSynced}
      />
    );
  }

  return <StudentNutritionLibraryModal />;
}
