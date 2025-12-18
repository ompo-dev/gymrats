"use client";

import type { WorkoutSession } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useWorkoutStore } from "@/stores/workout-store";
import { ProgressRing } from "@/components/ui/progress-ring";
import { WorkoutNodeButton } from "@/components/ui/workout-node-button";

interface WorkoutNodeProps {
  workout: WorkoutSession;
  position: "left" | "center" | "right";
  onClick: () => void;
  isFirst?: boolean;
  previousWorkouts?: WorkoutSession[]; // Workouts anteriores na mesma unidade
  previousUnitsWorkouts?: WorkoutSession[]; // Todos os workouts de unidades anteriores
}

export function WorkoutNode({
  workout,
  position,
  onClick,
  isFirst = false,
  previousWorkouts = [],
  previousUnitsWorkouts = [],
}: WorkoutNodeProps) {
  // Usar o store diretamente para garantir re-renderização quando mudar
  // Selecionar especificamente o progresso deste workout para forçar re-renderização
  const workoutProgress = useWorkoutStore(
    (state) => state.workoutProgress[workout.id]
  );
  const completedWorkouts = useWorkoutStore((state) => state.completedWorkouts);
  const { isWorkoutCompleted, isWorkoutInProgress, getWorkoutProgress } =
    useWorkoutStore();

  const isCompleted = isWorkoutCompleted(workout.id);

  // Verificar progresso e bloqueio - ATUALIZADO
  // Verificar se todos os workouts anteriores na mesma unidade foram completados
  const allPreviousInUnitCompleted =
    previousWorkouts.length === 0
      ? true
      : previousWorkouts.every((prevWorkout) =>
          isWorkoutCompleted(prevWorkout.id)
        );

  // Verificar se todos os workouts de unidades anteriores foram completados
  const allPreviousUnitsCompleted =
    previousUnitsWorkouts.length === 0
      ? true
      : previousUnitsWorkouts.every((prevWorkout) =>
          isWorkoutCompleted(prevWorkout.id)
        );

  // REGRA DE BLOQUEIO: Um workout está bloqueado se:
  // 1. Está marcado como locked no mock OU
  // 2. Não é o primeiro da primeira unidade E nem todos os anteriores na mesma unidade foram completados OU
  // 3. É o primeiro de uma unidade E nem todos os workouts das unidades anteriores foram completados
  const shouldBeLocked =
    workout.locked ||
    (!isFirst && !allPreviousInUnitCompleted) ||
    (isFirst && previousUnitsWorkouts.length > 0 && !allPreviousUnitsCompleted);

  const isLocked = shouldBeLocked;

  // Só verifica progresso se NÃO está completo
  const hasProgress = !isCompleted && isWorkoutInProgress(workout.id);
  const totalSeenExercises = !isCompleted
    ? getWorkoutProgress(workout.id) // Retorna número de exercícios vistos (completados + pulados)
    : 0;
  const targetProgressPercent =
    totalSeenExercises > 0 && workout.exercises.length > 0
      ? Math.min(100, (totalSeenExercises / workout.exercises.length) * 100)
      : 0;

  // REGRA PRINCIPAL: Só pode mostrar progresso se:
  // - É o primeiro da primeira unidade (sem unidades anteriores) OU
  // - É o primeiro de outra unidade E todos os workouts das unidades anteriores foram completados OU
  // - Não é o primeiro E todos os anteriores na mesma unidade foram completados
  const canShowProgress =
    (isFirst && previousUnitsWorkouts.length === 0) ||
    (isFirst && allPreviousUnitsCompleted) ||
    (!isFirst && allPreviousInUnitCompleted);

  // Só considerar "em progresso" se pode mostrar E tem progresso salvo E NÃO está completo
  const inProgress = !isCompleted && canShowProgress && hasProgress;

  // isCurrent: está disponível para iniciar (não bloqueado, não completo, não em progresso)
  // Mas se está em progresso, ainda deve ter cor de fundo (verde)
  const isCurrent = !isLocked && !isCompleted && !inProgress;

  // Estado para o botão: se está em progresso, deve ter cor verde também
  const isInProgressState = inProgress && !isCompleted && !isLocked;

  // Só mostra barra de progresso circular se:
  // 1. NÃO está completo (se está completo, NUNCA mostra barra) - CRÍTICO
  // 2. Pode mostrar (é primeiro OU todos anteriores completos)
  // 3. NÃO está bloqueado (se está bloqueado, não mostra barra)
  // 4. Tem progresso salvo (hasProgress) OU pode mostrar progresso (está disponível para iniciar)
  // REGRA: Mostra ring se pode mostrar E NÃO está bloqueado E (tem progresso OU está disponível para iniciar)
  const shouldShowProgress =
    !isCompleted && // PRIMEIRO: Se está completo, nunca mostra - ABSOLUTO
    !isLocked && // SEGUNDO: Se está bloqueado, nunca mostra - ABSOLUTO
    canShowProgress && // Pode mostrar (primeiro OU anteriores completos)
    (hasProgress || !isLocked); // Mostra se tem progresso OU está desbloqueado (pode iniciar)

  // Forçar re-renderização quando o progresso ou completados mudarem
  useEffect(() => {
    // Este useEffect garante que o componente re-renderize quando o store mudar
  }, [workoutProgress, completedWorkouts]);

  // Estado para forçar re-renderização quando o progresso mudar
  const [, forceUpdate] = useState(0);

  // Listener para atualizar quando o progresso mudar (disparado pelo modal)
  useEffect(() => {
    const handleProgressUpdate = (event: CustomEvent) => {
      if (event.detail?.workoutId === workout.id) {
        // Forçar re-renderização ao receber atualização de progresso
        forceUpdate((prev) => prev + 1);
      }
    };

    window.addEventListener(
      "workoutProgressUpdate",
      handleProgressUpdate as EventListener
    );
    return () => {
      window.removeEventListener(
        "workoutProgressUpdate",
        handleProgressUpdate as EventListener
      );
    };
  }, [workout.id]);

  const getPositionClasses = () => {
    if (position === "left") return "mr-auto ml-[20%]";
    if (position === "right") return "ml-auto mr-[20%]";
    return "mx-auto";
  };

  return (
    <div
      className={cn(
        "relative flex w-fit flex-col items-center gap-3",
        getPositionClasses()
      )}
    >
      {/* START Badge - Estilo Duolingo exato */}
      {isFirst && isCurrent && (
        <div
          className="absolute -top-[72.59px] left-1/2 -translate-x-1/2 z-20"
          style={{ minWidth: "80px" }}
        >
          {/* Badge Container */}
          <div className="relative">
            {/* Badge Box - Exatamente como no Figma */}
            <div
              className="flex items-center justify-center bg-white border-2 border-[#E5E5E5] rounded-[10px]"
              style={{
                padding: "14.6px 15.24px 13.4px 14px",
                width: "81.24px",
                height: "45px",
              }}
            >
              <span
                className="font-bold text-center uppercase text-duo-green"
                style={{
                  width: "52px",
                  height: "17px",
                  fontSize: "15px",
                  lineHeight: "17px",
                  letterSpacing: "0.51px",
                }}
              >
                START
              </span>
            </div>
            {/* Seta apontando para baixo - Estilo Duolingo */}
            <div
              className="absolute left-1/2 -translate-x-1/2"
              style={{
                width: "20px",
                height: "10px",
                left: "30.61px",
                top: "44.67px",
                transform: "translateX(-50%) rotate(180deg)",
              }}
            >
              <div
                className="absolute bg-white border-2 border-[#E5E5E5]"
                style={{
                  width: "14.14px",
                  height: "14.14px",
                  left: "0px",
                  bottom: "5.46px",
                  borderRadius: "2px",
                  transform: "rotate(-135deg)",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {shouldShowProgress ? (
        <ProgressRing
          key={`progress-${workout.id}-${targetProgressPercent}-${hasProgress}`}
          showProgress={shouldShowProgress}
          progressPercent={targetProgressPercent}
          color="#58CC02"
        >
          <WorkoutNodeButton
            onClick={onClick}
            isLocked={isLocked}
            isCompleted={isCompleted}
            isCurrent={isCurrent || isInProgressState}
          />
        </ProgressRing>
      ) : (
        <WorkoutNodeButton
          onClick={onClick}
          isLocked={isLocked}
          isCompleted={isCompleted}
          isCurrent={isCurrent}
        />
      )}

      {/* Workout title and info */}
      <div className="max-w-[200px] text-center">
        <p
          className={cn(
            "text-sm font-bold leading-tight",
            isLocked ? "text-[#afafaf]" : "text-[#3c3c3c]"
          )}
        >
          {workout.title}
        </p>
        {!isLocked && (
          <div className="mt-1.5 flex items-center justify-center gap-2 text-xs text-[#afafaf]">
            <span>{workout.exercises.length} exercícios</span>
            <span>•</span>
            <span>{workout.estimatedTime}min</span>
          </div>
        )}
      </div>
    </div>
  );
}
