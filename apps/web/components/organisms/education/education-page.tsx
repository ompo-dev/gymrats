"use client";

import { motion } from "motion/react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoCard } from "@/components/duo";
import { cn } from "@/lib/utils";

interface EducationPageProps {
  onSelectView: (view: "muscles" | "lessons") => void;
}

function EducationPageSimple({ onSelectView }: EducationPageProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-6  ">
      <FadeIn>
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold text-duo-text">
            Central de Aprendizado
          </h1>
          <p className="text-sm text-duo-gray-dark">
            Conhecimento baseado em ciência
          </p>
        </div>
      </FadeIn>

      <SlideIn delay={0.1}>
        <div className="grid gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <DuoCard.Root
              variant="default"
              size="default"
              onClick={() => onSelectView("muscles")}
              className={cn(
                "cursor-pointer transition-all hover:border-duo-blue active:scale-[0.98]",
              )}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-duo-blue text-4xl">
                  💪
                </div>
                <div className="flex-1">
                  <h3 className="mb-2 text-xl font-bold text-duo-text">
                    Anatomia e Exercícios
                  </h3>
                  <p className="text-sm text-duo-gray-dark">
                    Explore músculos, funções e técnicas corretas de execução
                  </p>
                </div>
              </div>
            </DuoCard.Root>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <DuoCard.Root
              variant="default"
              size="default"
              onClick={() => onSelectView("lessons")}
              className={cn(
                "cursor-pointer transition-all hover:border-duo-green active:scale-[0.98]",
              )}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-duo-green text-4xl">
                  📚
                </div>
                <div className="flex-1">
                  <h3 className="mb-2 text-xl font-bold text-duo-text">
                    Lições de Ciência
                  </h3>
                  <p className="text-sm text-duo-gray-dark">
                    Aprenda sobre hipertrofia, nutrição e recuperação com
                    evidências
                  </p>
                </div>
              </div>
            </DuoCard.Root>
          </motion.div>
        </div>
      </SlideIn>
    </div>
  );
}

export const EducationPage = {
  Simple: EducationPageSimple,
};
