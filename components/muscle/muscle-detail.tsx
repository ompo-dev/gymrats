"use client";

import type { MuscleInfo } from "@/lib/types";
import { ArrowLeft, Book, Dumbbell } from "lucide-react";
import { SectionCard } from "@/components/ui/section-card";
import { DuoCard } from "@/components/ui/duo-card";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";

interface MuscleDetailProps {
  muscle: MuscleInfo;
  onBack: () => void;
}

export function MuscleDetail({ muscle, onBack }: MuscleDetailProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-6  ">
      <FadeIn>
        <button
          onClick={onBack}
          className="mb-4 flex items-center gap-2 font-bold text-duo-blue hover:underline"
        >
          <ArrowLeft className="h-5 w-5" />
          Voltar
        </button>
      </FadeIn>

      <SlideIn delay={0.1}>
        <SectionCard title={muscle.name} icon={Book} variant="blue">
          <div className="mb-4 text-sm font-bold italic text-duo-gray-dark">
            {muscle.scientificName}
          </div>
          <p className="leading-relaxed text-duo-text">{muscle.description}</p>
        </SectionCard>
      </SlideIn>

      <SlideIn delay={0.2}>
        <SectionCard title="Funções" icon={Book}>
          <ul className="space-y-3">
            {muscle.functions.map((func, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-duo-green text-sm font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-duo-text">{func}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </SlideIn>

      <SlideIn delay={0.3}>
        <SectionCard title="Exercícios Comuns" icon={Dumbbell}>
          <div className="flex flex-wrap gap-2">
            {muscle.commonExercises.map((exercise, i) => (
              <span
                key={i}
                className="rounded-xl bg-duo-blue/20 px-3 py-2 text-sm font-bold text-duo-blue"
              >
                {exercise}
              </span>
            ))}
          </div>
        </SectionCard>
      </SlideIn>

      <SlideIn delay={0.4}>
        <DuoCard variant="yellow" size="default">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-2xl">💡</span>
            <h3 className="text-lg font-bold text-duo-text">
              Curiosidades Anatômicas
            </h3>
          </div>
          <ul className="space-y-2">
            {muscle.anatomyFacts.map((fact, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-duo-yellow">•</span>
                <span className="text-duo-text">{fact}</span>
              </li>
            ))}
          </ul>
        </DuoCard>
      </SlideIn>
    </div>
  );
}
