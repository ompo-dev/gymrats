"use client";

import { Loader2, Moon, Plus, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { DuoButton, DuoCard } from "@/components/duo";
import { useStudent } from "@/hooks/use-student";
import { useToast } from "@/hooks/use-toast";
import type { PlanSlotData } from "@/lib/types";
import { Modal } from "./modal";
import { WorkoutChat } from "./workout-chat";

const DAY_NAMES = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
];

interface EditWeeklyPlanModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onPlanUpdated?: () => void;
  onAddWorkoutToSlot?: (slotId: string, dayName: string) => void;
}

export function EditWeeklyPlanModal({
  isOpen = true,
  onClose,
  onPlanUpdated,
  onAddWorkoutToSlot,
}: EditWeeklyPlanModalProps) {
  const weeklyPlan = useStudent("weeklyPlan") as
    | { title?: string; slots?: PlanSlotData[] }
    | null
    | undefined;
  const slotsArray = Array.isArray(weeklyPlan?.slots) ? weeklyPlan.slots : [];
  const planTitle =
    typeof weeklyPlan?.title === "string" ? weeklyPlan.title : "Plano semanal";
  const { loadWeeklyPlan } = useStudent("loaders");
  const { resetWeeklyPlan, deleteWorkout, addWeeklyPlanWorkout } =
    useStudent("actions");
  const [loadingSlotId, setLoadingSlotId] = useState<string | null>(null);
  const [chatSlotId, setChatSlotId] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const { toast } = useToast();

  const handleResetWeek = async () => {
    setResetting(true);
    try {
      await resetWeeklyPlan();
      onPlanUpdated?.();
      toast({
        title: "Semana resetada",
        description: "Os treinos estão disponíveis novamente!",
      });
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível resetar a semana.",
        variant: "destructive",
      });
    } finally {
      setResetting(false);
    }
  };

  const handleRemoveWorkout = async (slotId: string) => {
    const slot = slotsArray.find((s) => s.id === slotId);
    if (!slot?.workout) return;

    setLoadingSlotId(slotId);
    try {
      await deleteWorkout(slot.workout.id);
      await loadWeeklyPlan(true);
      onPlanUpdated?.();
      toast({
        title: "Treino removido",
        description: "O dia foi marcado como descanso.",
      });
    } catch (error) {
      console.error("Erro ao remover treino:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o treino.",
        variant: "destructive",
      });
    } finally {
      setLoadingSlotId(null);
    }
  };

  const handleAddWorkout = async (slotId: string, dayName: string) => {
    if (onAddWorkoutToSlot) {
      onAddWorkoutToSlot(slotId, dayName);
      return;
    }

    setLoadingSlotId(slotId);
    try {
      await addWeeklyPlanWorkout({
        planSlotId: slotId,
        title: `Treino ${dayName}`,
        description: "",
        type: "strength",
        muscleGroup: "full-body",
        difficulty: "iniciante",
        estimatedTime: 0,
      });
      onPlanUpdated?.();
      toast({
        title: "Treino adicionado",
        description: `Adicione exercícios clicando no treino na grade ou use o Chat IA.`,
      });
    } catch (error) {
      console.error("Erro ao adicionar treino:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o treino.",
        variant: "destructive",
      });
    } finally {
      setLoadingSlotId(null);
    }
  };

  if (!weeklyPlan) {
    return null;
  }

  return (
    <Modal.Root isOpen={isOpen} onClose={onClose}>
      <Modal.Header title={planTitle} onClose={onClose}>
        <div className="flex flex-col gap-1">
          <p className="text-sm text-duo-gray">Edite os treinos de cada dia</p>
          <DuoButton
            variant="ghost"
            size="sm"
            onClick={handleResetWeek}
            disabled={resetting}
            className="mt-1 w-fit gap-1 self-start"
          >
            {resetting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            Resetar semana
          </DuoButton>
        </div>
      </Modal.Header>
      <Modal.Content>
        <div className="space-y-4">
          {slotsArray.map((slot) => (
            <DuoCard.Root key={slot.id} variant="default" padding="md">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-duo-gray-dark">
                    {DAY_NAMES[slot.dayOfWeek]}
                  </span>
                  {slot.type === "rest" ? (
                    <span className="flex items-center gap-1 text-duo-gray">
                      <Moon className="h-4 w-4" />
                      Descanso
                    </span>
                  ) : (
                    <span className="font-medium text-duo-text">
                      {slot.workout?.title}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {slot.type === "workout" && slot.workout && (
                    <DuoButton
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveWorkout(slot.id)}
                      disabled={loadingSlotId === slot.id}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </DuoButton>
                  )}
                  {slot.type === "rest" && (
                    <>
                      <DuoButton
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          handleAddWorkout(slot.id, DAY_NAMES[slot.dayOfWeek])
                        }
                        disabled={loadingSlotId === slot.id}
                      >
                        {loadingSlotId === slot.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        Treino
                      </DuoButton>
                      <DuoButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setChatSlotId(slot.id)}
                        className="gap-1"
                      >
                        <Sparkles className="h-4 w-4" />
                        Chat IA
                      </DuoButton>
                    </>
                  )}
                </div>
              </div>
            </DuoCard.Root>
          ))}
          <p className="text-center text-sm text-duo-gray">
            Clique em &quot;Treino&quot; para adicionar um dia vazio ou
            &quot;Chat IA&quot; para criar com exercícios.
          </p>
        </div>
      </Modal.Content>

      {chatSlotId && (
        <WorkoutChat
          planSlotId={chatSlotId}
          slotContext={
            DAY_NAMES[
              slotsArray.find((s) => s.id === chatSlotId)?.dayOfWeek ?? 0
            ]
          }
          onClose={() => {
            setChatSlotId(null);
            loadWeeklyPlan(true);
            onPlanUpdated?.();
          }}
        />
      )}
    </Modal.Root>
  );
}
