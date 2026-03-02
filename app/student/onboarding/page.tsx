"use client";

import { ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DuoButton } from "@/components/duo";
import { validateConsolidatedStep1 } from "./schemas";
import { ConsolidatedStep1 } from "./steps/consolidated-step1";
import { ConsolidatedStep2 } from "./steps/consolidated-step2";
import { ConsolidatedStep3 } from "./steps/consolidated-step3";
import type { OnboardingData } from "./steps/types";

const TOTAL_STEPS = 3;

function Confetti() {
  if (typeof window === "undefined") return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      {Array.from({ length: 50 }, (_, i) => `confetti-${i}`).map((id) => (
        <motion.div
          key={id}
          className="absolute h-2 w-2 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: "-10px",
            backgroundColor: [
              "#58CC02",
              "#1CB0F6",
              "#FF9600",
              "#FF4B4B",
              "#FFC800",
            ][Math.floor(Math.random() * 5)],
          }}
          initial={{ y: 0, rotate: 0, opacity: 1 }}
          animate={{
            y: window.innerHeight + 100,
            rotate: 360,
            opacity: 0,
            x: (Math.random() - 0.5) * 200,
          }}
          transition={{
            duration: Math.random() * 2 + 2,
            delay: Math.random() * 0.5,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

export default function StudentOnboardingPage() {
  const _router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [forceValidation, setForceValidation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Verificar se já tem perfil e redirecionar para /student
  // Pula verificação quando usuário veio do user-type (PENDING explorando) - evita 401
  useEffect(() => {
    let isChecking = false;

    const checkProfileAndRedirect = async () => {
      if (!isMounted || isSubmitting || isChecking) return;
      if (sessionStorage.getItem("gymrats:onboarding-intent") === "student") {
        return; // PENDING explorando, não chamar API (retornaria 401)
      }
      isChecking = true;

      try {
        const { apiClient } = await import("@/lib/api/client");
        const response = await apiClient.get<{ hasProfile: boolean }>(
          "/api/students/profile",
        );

        if (response.data.hasProfile === true) {
          window.location.href = "/student";
          return;
        }
      } catch (error) {
        console.error("Erro ao verificar perfil:", error);
      } finally {
        isChecking = false;
      }
    };

    const timeoutId = setTimeout(checkProfileAndRedirect, 100);

    return () => {
      clearTimeout(timeoutId);
      isChecking = false;
    };
  }, [isMounted, isSubmitting]);

  // Reseta forceValidation quando o step muda
  useEffect(() => {
    setForceValidation(false);
  }, []);

  const [formData, setFormData] = useState<OnboardingData>({
    age: "",
    gender: "",
    isTrans: false,
    usesHormones: false,
    hormoneType: "",
    height: "",
    weight: "",
    fitnessLevel: "",
    weeklyWorkoutFrequency: 3,
    workoutDuration: 60,
    goals: [],
    gymType: "",
    preferredSets: 3,
    preferredRepRange: "hipertrofia",
    restTime: "medio",
    activityLevel: 4,
    dailyAvailableHours: 1,
    physicalLimitations: [],
    motorLimitations: [],
    medicalConditions: [],
  });

  const handleNext = () => {
    // Força validação de todos os campos
    setForceValidation(true);

    // Valida todos os campos antes de avançar
    if (canProceed()) {
      setForceValidation(false); // Reseta para o próximo step
      setShowConfetti(true);
      setTimeout(() => {
        setShowConfetti(false);
        setStep(step + 1);
      }, 800);
    } else {
      // Se não pode prosseguir, os erros já serão exibidos pelos componentes dos steps
      // Mantém forceValidation true para mostrar os erros
    }
  };

  const handleBack = () => {
    setForceValidation(false); // Reseta validação ao voltar
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (
      !formData.age ||
      !formData.gender ||
      !formData.height ||
      !formData.weight ||
      !formData.fitnessLevel ||
      !formData.targetCalories
    ) {
      return;
    }

    setIsLoading(true);
    setIsSubmitting(true);
    setShowConfetti(true);

    try {
      const { submitOnboarding } = await import("./actions");

      // Iniciar salvamento - retorna imediatamente após salvar perfil básico
      // A geração de treinos roda em background e não bloqueia
      const result = await submitOnboarding(formData);

      if (!result.success) {
        console.error("[Onboarding] Erro ao salvar:", result.error);
        throw new Error(result.error || "Erro ao salvar perfil");
      }

      sessionStorage.removeItem("gymrats:onboarding-intent");

      // Redirecionar imediatamente após salvar o perfil
      // A geração de treinos continuará em background
      // Usar window.location.href para forçar navegação completa e revalidar hasProfile no layout
      // Não usar setTimeout - redirecionar imediatamente
      window.location.href = "/student";
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : "Erro ao salvar perfil. Tente novamente.";
      alert(msg);
      setIsLoading(false);
      setIsSubmitting(false);
      setShowConfetti(false);
    }
  };

  const canProceed = () => {
    if (step === 1) {
      const validation = validateConsolidatedStep1({
        age: typeof formData.age === "number" ? formData.age : undefined,
        gender: formData.gender || undefined,
        isTrans: formData.isTrans,
        usesHormones: formData.usesHormones,
        hormoneType: formData.hormoneType || undefined,
        height:
          typeof formData.height === "number" ? formData.height : undefined,
        weight:
          typeof formData.weight === "number" ? formData.weight : undefined,
        fitnessLevel: formData.fitnessLevel || undefined,
        goals: formData.goals,
        weeklyWorkoutFrequency: formData.weeklyWorkoutFrequency,
        workoutDuration: formData.workoutDuration,
        gymType: formData.gymType || undefined,
        activityLevel: formData.activityLevel,
        hormoneTreatmentDuration: formData.hormoneTreatmentDuration,
      });
      return validation.success;
    }
    // Etapa 2: valores metabólicos calculados automaticamente
    if (step === 2) {
      return true;
    }
    // Etapa 3: opcional, sempre pode prosseguir (pular ou completar)
    if (step === 3) {
      return true;
    }
    return false;
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-duo-bg scrollbar-hide">
      {showConfetti && <Confetti />}

      {step === 1 && (
        <div className="absolute top-4 left-4 z-50">
          <DuoButton
            onClick={() => _router.push("/auth/register/user-type")}
            variant="white"
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </DuoButton>
        </div>
      )}

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {isMounted &&
          Array.from({ length: 20 }, (_, i) => `particle-${i}`).map((id) => (
            <motion.div
              key={id}
              className="absolute h-1 w-1 rounded-full bg-duo-fg/20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 0.5, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
      </div>

      {/* Conteúdo com scroll */}
      <div className="flex-1 overflow-y-auto scrollbar-hide pb-24">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative mx-auto w-full max-w-2xl py-8">
            <div className="mb-4 text-center">
              <span className="text-sm font-bold text-duo-fg-muted">
                {step} de {TOTAL_STEPS}
              </span>
            </div>
            <AnimatePresence mode="wait">
              {step === 1 && (
                <ConsolidatedStep1
                  formData={formData}
                  setFormData={setFormData}
                  forceValidation={forceValidation}
                />
              )}
              {step === 2 && (
                <ConsolidatedStep2
                  formData={formData}
                  setFormData={setFormData}
                  forceValidation={forceValidation}
                />
              )}
              {step === 3 && (
                <ConsolidatedStep3
                  formData={formData}
                  setFormData={setFormData}
                  forceValidation={forceValidation}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Botões fixos na parte inferior */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-duo-border p-4 backdrop-blur-md bg-duo-bg-card">
        <div className="mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex gap-3"
          >
            {step > 1 && (
              <div className="flex-1">
                <DuoButton
                  onClick={handleBack}
                  variant="white"
                  className="w-full"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  VOLTAR
                </DuoButton>
              </div>
            )}
            {step < TOTAL_STEPS ? (
              <div className="flex-1">
                <DuoButton
                  onClick={handleNext}
                  disabled={!canProceed()}
                  variant={canProceed() ? "primary" : "locked"}
                  className="w-full"
                >
                  CONTINUAR
                  <ChevronRight className="ml-2 h-4 w-4" />
                </DuoButton>
              </div>
            ) : (
              <>
                <div className="flex-1">
                  <DuoButton
                    onClick={handleSubmit}
                    disabled={isLoading}
                    variant="white"
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        SALVANDO...
                      </>
                    ) : (
                      "PULAR"
                    )}
                  </DuoButton>
                </div>
                <div className="flex-1">
                  <DuoButton
                    onClick={handleSubmit}
                    disabled={isLoading}
                    variant={!isLoading ? "primary" : "locked"}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        SALVANDO...
                      </>
                    ) : (
                      <>COMPLETAR</>
                    )}
                  </DuoButton>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
