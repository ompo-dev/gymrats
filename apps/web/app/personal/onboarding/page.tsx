"use client";

import { ArrowLeft, Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DuoButton } from "@/components/duo";
import { usePersonal } from "@/hooks/use-personal";
import { submitPersonalOnboarding } from "./actions";
import { Step1 } from "./steps/step1";
import { Step2 } from "./steps/step2";
import type { PersonalOnboardingData } from "./steps/types";

const TOTAL_STEPS = 2;

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
            backgroundColor: ["#1CB0F6", "#58CC02", "#FF9600", "#FF4B4B"][
              Math.floor(Math.random() * 4)
            ],
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

export default function PersonalOnboardingPage() {
  const router = useRouter();
  const { profile, loaders } = usePersonal("profile", "loaders");
  const [step, setStep] = useState(1);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<PersonalOnboardingData>({
    name: "",
    phone: "",
    bio: "",
    atendimentoPresencial: true,
    atendimentoRemoto: true,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    let isChecking = false;

    const checkProfileAndRedirect = async () => {
      if (!isMounted || loading || isChecking) return;
      if (typeof window === "undefined") return;
      if (sessionStorage.getItem("gymrats:onboarding-intent") === "personal") {
        return;
      }

      isChecking = true;
      try {
        await loaders.loadSection("profile");
        if (profile?.id) {
          window.location.href = "/personal";
          return;
        }
      } catch {
        // Fluxo segue normalmente quando ainda não existe personal ou sessão.
      } finally {
        isChecking = false;
      }
    };

    const timeoutId = setTimeout(checkProfileAndRedirect, 100);

    return () => {
      clearTimeout(timeoutId);
      isChecking = false;
    };
  }, [isMounted, loading, loaders, profile?.id]);

  const canProceed = () => {
    if (step === 1) return formData.name.trim().length >= 2;
    if (step === 2) return true;
    return false;
  };

  const handleNext = () => {
    if (!canProceed()) return;
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
      setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
    }, 700);
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (formData.name.trim().length < 2) return;
    setLoading(true);
    setShowConfetti(true);
    setError(null);

    const result = await submitPersonalOnboarding({
      name: formData.name,
      phone: formData.phone || undefined,
      bio: formData.bio || undefined,
      atendimentoPresencial: formData.atendimentoPresencial,
      atendimentoRemoto: formData.atendimentoRemoto,
    });

    if (!result.success) {
      setError(result.error || "Erro ao salvar onboarding");
      setLoading(false);
      setShowConfetti(false);
      return;
    }

    sessionStorage.removeItem("gymrats:onboarding-intent");
    window.location.href = "/personal";
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-duo-bg scrollbar-hide">
      {showConfetti && <Confetti />}

      {step === 1 && (
        <div className="absolute top-4 left-4 z-50">
          <DuoButton
            onClick={() => router.push("/auth/register/user-type")}
            variant="white"
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </DuoButton>
        </div>
      )}

      <div className="absolute inset-0 overflow-hidden">
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

      <div className="flex flex-1 items-center justify-center overflow-y-auto p-4 scrollbar-hide">
        <div className="relative mx-auto w-full max-w-2xl">
          <div className="mb-4 text-center">
            <span className="text-sm font-bold text-duo-fg-muted">
              {step} de {TOTAL_STEPS}
            </span>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && <Step1 formData={formData} setFormData={setFormData} />}
            {step === 2 && <Step2 formData={formData} setFormData={setFormData} />}
          </AnimatePresence>

          {error && (
            <div className="mt-4 rounded-lg border border-duo-danger/40 bg-duo-danger/10 px-3 py-2 text-sm text-duo-danger">
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-duo-border bg-duo-bg-card p-4 backdrop-blur-md">
        <div className="mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex gap-3"
          >
            {step > 1 && (
              <div className="flex-1">
                <DuoButton onClick={handleBack} variant="white" className="w-full">
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
              <div className="flex-1">
                <DuoButton
                  onClick={handleSubmit}
                  disabled={loading || !canProceed()}
                  variant={canProceed() && !loading ? "primary" : "locked"}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      SALVANDO...
                    </>
                  ) : (
                    <>
                      FINALIZAR
                      <Check className="ml-2 h-4 w-4" />
                    </>
                  )}
                </DuoButton>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
