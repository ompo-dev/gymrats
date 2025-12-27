"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Step1 } from "./steps/step1";
import { Step2 } from "./steps/step2";
import { Step3 } from "./steps/step3";
import { Step4 } from "./steps/step4";
import { Step5 } from "./steps/step5";
import { Step6 } from "./steps/step6";
import { Step7 } from "./steps/step7";
import type { OnboardingData } from "./steps/types";
import {
  validateStep1,
  validateStep2,
  validateStep3,
  validateStep4,
  validateStep5,
  validateStep6,
  validateStep7,
} from "./schemas";

function Confetti() {
  if (typeof window === "undefined") return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
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
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [forceValidation, setForceValidation] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Reseta forceValidation quando o step muda
  useEffect(() => {
    setForceValidation(false);
  }, [step]);

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
    setShowConfetti(true);

    try {
      const { submitOnboarding } = await import("./actions");
      const result = await submitOnboarding(formData);

      if (!result.success) {
        throw new Error(result.error || "Erro ao salvar perfil");
      }

      setTimeout(() => {
        router.push("/student");
      }, 1500);
    } catch (error: any) {
      alert(error.message || "Erro ao salvar perfil. Tente novamente.");
      setIsLoading(false);
      setShowConfetti(false);
    }
  };

  const canProceed = () => {
    if (step === 1) {
      const validation = validateStep1({
        age: typeof formData.age === "number" ? formData.age : undefined,
        gender: formData.gender || undefined,
        isTrans: formData.isTrans,
        usesHormones: formData.usesHormones,
        hormoneType: formData.hormoneType || undefined,
        height: typeof formData.height === "number" ? formData.height : undefined,
        weight: typeof formData.weight === "number" ? formData.weight : undefined,
        fitnessLevel: formData.fitnessLevel || undefined,
      });
      return validation.success;
    }
    if (step === 2) {
      const validation = validateStep2({
        goals: formData.goals,
        weeklyWorkoutFrequency: formData.weeklyWorkoutFrequency,
        workoutDuration: formData.workoutDuration,
      });
      return validation.success;
    }
    if (step === 3) {
      const validation = validateStep3({
        preferredSets: formData.preferredSets,
        preferredRepRange: formData.preferredRepRange,
        restTime: formData.restTime,
      });
      return validation.success;
    }
    if (step === 4) {
      const validation = validateStep4({
        gymType: formData.gymType || undefined,
      });
      return validation.success;
    }
    if (step === 5) {
      // Step 5 - Nível de atividade física
      const validation = validateStep5({
        activityLevel: formData.activityLevel,
        hormoneTreatmentDuration: formData.hormoneTreatmentDuration,
      });
      return validation.success;
    }
    if (step === 6) {
      // Step 6 sempre pode prosseguir (valores calculados automaticamente)
      return true;
    }
    if (step === 7) {
      // Step 7 sempre pode prosseguir (limitações são opcionais)
      return true;
    }
    return false;
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-duo-green scrollbar-hide">
      {showConfetti && <Confetti />}

      <div className="absolute inset-0 overflow-hidden">
        {isMounted &&
          [...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 rounded-full bg-white/20"
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

      {/* Conteúdo centralizado */}
      <div className="flex flex-1 items-center justify-center p-4   overflow-y-auto scrollbar-hide">
        <div className="relative mx-auto w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <Step1 formData={formData} setFormData={setFormData} forceValidation={forceValidation} />
            )}
            {step === 2 && (
              <Step2 formData={formData} setFormData={setFormData} forceValidation={forceValidation} />
            )}
            {step === 3 && (
              <Step3 formData={formData} setFormData={setFormData} forceValidation={forceValidation} />
            )}
            {step === 4 && (
              <Step4 formData={formData} setFormData={setFormData} forceValidation={forceValidation} />
            )}
            {step === 5 && (
              <Step6 formData={formData} setFormData={setFormData} forceValidation={forceValidation} />
            )}
            {step === 6 && (
              <Step5 formData={formData} setFormData={setFormData} />
            )}
            {step === 7 && (
              <Step7 formData={formData} setFormData={setFormData} forceValidation={forceValidation} />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Botões fixos na parte inferior */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/20 p-4 backdrop-blur-md"
        style={{ backgroundColor: "#D7FFB8" }}
      >
        <div className="mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex gap-3"
          >
            {step > 1 && (
              <div className="flex-1">
                <Button onClick={handleBack} variant="white" className="w-full">
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  VOLTAR
                </Button>
              </div>
            )}
            {step < 7 ? (
              <div className="flex-1">
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  variant={canProceed() ? "default" : "disabled"}
                  className="w-full"
                >
                  CONTINUAR
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex-1">
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || !canProceed()}
                  variant={canProceed() && !isLoading ? "default" : "disabled"}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      SALVANDO...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      FINALIZAR
                      <Check className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
