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
import { OnboardingData } from "./steps/types";

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
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
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
  });

  const handleNext = () => {
    if (canProceed()) {
      setCompletedSteps([...completedSteps, step]);
      setShowConfetti(true);
      setTimeout(() => {
        setShowConfetti(false);
        setStep(step + 1);
      }, 800);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (
      !formData.age ||
      !formData.gender ||
      !formData.height ||
      !formData.weight ||
      !formData.fitnessLevel
    ) {
      return;
    }

    setIsLoading(true);
    setShowConfetti(true);

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/students/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao salvar perfil");
      }

      setTimeout(() => {
        localStorage.setItem("student_onboarding_completed", "true");
        router.push("/student");
      }, 1500);
    } catch (error: any) {
      console.error("Erro ao salvar perfil:", error);
      alert(error.message || "Erro ao salvar perfil. Tente novamente.");
      setIsLoading(false);
      setShowConfetti(false);
    }
  };

  const canProceed = () => {
    if (step === 1) {
      return (
        formData.age &&
        formData.gender &&
        formData.height &&
        formData.weight &&
        formData.fitnessLevel
      );
    }
    if (step === 2) {
      return formData.goals.length > 0;
    }
    if (step === 3) {
      return true;
    }
    if (step === 4) {
      return formData.gymType;
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
      <div className="flex flex-1 items-center justify-center p-4 pb-24 overflow-y-auto scrollbar-hide">
        <div className="relative mx-auto w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <Step1 formData={formData} setFormData={setFormData} />
            )}
            {step === 2 && (
              <Step2 formData={formData} setFormData={setFormData} />
            )}
            {step === 3 && (
              <Step3 formData={formData} setFormData={setFormData} />
            )}
            {step === 4 && (
              <Step4 formData={formData} setFormData={setFormData} />
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
            {step < 4 ? (
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
