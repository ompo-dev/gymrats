"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Step1 } from "./steps/step1";
import { Step2 } from "./steps/step2";
import { Step3 } from "./steps/step3";
import { Step4 } from "./steps/step4";
import type { GymOnboardingData } from "./steps/types";

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
              "#FF9600",
              "#E68A00",
              "#FFB84D",
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

export default function GymOnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams?.get("mode"); // "new" para criar nova academia
  const isNewGymMode = mode === "new";

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [formData, setFormData] = useState<GymOnboardingData>({
    name: "",
    address: "",
    addressNumber: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    email: "",
    cnpj: "",
    equipment: [],
  });

  const handleNext = () => {
    if (canProceed()) {
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
      !formData.name ||
      !formData.address ||
      !formData.city ||
      !formData.state ||
      !formData.zipCode ||
      !formData.phone ||
      !formData.email
    ) {
      return;
    }

    setIsLoading(true);
    setShowConfetti(true);

    try {
      if (isNewGymMode) {
        // Criar nova academia (adicional)
        const { submitNewGym } = await import("./actions");
        const result = await submitNewGym(formData);

        if (!result.success) {
          throw new Error(result.error || "Erro ao criar nova academia");
        }

        // Sinalizar que precisa refresh das academias
        sessionStorage.setItem("refresh-gyms", "true");

        // Forçar revalidação dos dados do servidor
        router.refresh();

        setTimeout(() => {
          router.push("/gym/dashboard");
        }, 1500);
      } else {
        // Onboarding original (primeira academia)
        const { submitGymOnboarding } = await import("./actions");
        const result = await submitGymOnboarding(formData);

        if (!result.success) {
          throw new Error(result.error || "Erro ao salvar perfil");
        }

        // Sinalizar que precisa refresh das academias
        sessionStorage.setItem("refresh-gyms", "true");

        // Forçar revalidação dos dados do servidor
        router.refresh();

        setTimeout(() => {
          router.push("/gym/dashboard");
        }, 1500);
      }
    } catch (error: any) {
      alert(error.message || "Erro ao salvar. Tente novamente.");
      setIsLoading(false);
      setShowConfetti(false);
    }
  };

  const canProceed = () => {
    if (step === 1) {
      return formData.name && formData.phone && formData.email;
    }
    if (step === 2) {
      return (
        formData.address && formData.city && formData.state && formData.zipCode
      );
    }
    if (step === 3) {
      return true;
    }
    if (step === 4) {
      return formData.equipment.length > 0;
    }
    return false;
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-duo-orange scrollbar-hide">
      {showConfetti && <Confetti />}

      {/* Botão voltar para modo "nova academia" */}
      {isNewGymMode && (
        <div className="absolute top-4 left-4 z-50">
          <Button
            onClick={() => router.push("/gym/dashboard")}
            variant="white"
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </div>
      )}

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

      <div className="flex flex-1 items-center justify-center p-4 overflow-y-auto scrollbar-hide">
        <div className="relative mx-auto w-full max-w-2xl">
          {/* Título diferente para modo "nova academia" */}
          {isNewGymMode && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 text-center"
            >
              <h1 className="text-3xl font-black text-white">
                🏋️ Nova Academia
              </h1>
              <p className="text-lg text-white/90 mt-2">
                Configure sua nova unidade
              </p>
            </motion.div>
          )}

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

      <div
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/20 p-4 backdrop-blur-md"
        style={{ backgroundColor: "#FFE5CC" }}
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
