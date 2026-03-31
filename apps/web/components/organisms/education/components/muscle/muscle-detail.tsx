"use client";

import { ArrowLeft, Book, Dumbbell } from "lucide-react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoCard } from "@/components/duo";
import type { MuscleInfo } from "@/lib/types";

interface MuscleDetailProps {
  muscle: MuscleInfo;
  onBack: () => void;
}

export function MuscleDetail({ muscle, onBack }: MuscleDetailProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-6  ">
      <FadeIn>
        <button
          type="button"
          onClick={onBack}
          className="mb-4 flex items-center gap-2 font-bold text-duo-blue hover:underline"
        >
          <ArrowLeft className="h-5 w-5" />
          Voltar
        </button>
      </FadeIn>

      <SlideIn delay={0.1}>
        <DuoCard.Root variant="blue" padding="md">
          <DuoCard.Header>
            <div className="flex items-center gap-2">
              <Book
                className="h-5 w-5 shrink-0"
                style={{ color: "var(--duo-secondary)" }}
                aria-hidden
              />
              <h2 className="font-bold text-[var(--duo-fg)]">{muscle.name}</h2>
            </div>
          </DuoCard.Header>
          <div className="mb-4 text-sm font-bold italic text-duo-gray-dark">
            {muscle.scientificName}
          </div>
          <p className="leading-relaxed text-duo-text">{muscle.description}</p>
        </DuoCard.Root>
      </SlideIn>

      <SlideIn delay={0.2}>
        <DuoCard.Root variant="default" padding="md">
          <DuoCard.Header>
            <div className="flex items-center gap-2">
              <Book
                className="h-5 w-5 shrink-0"
                style={{ color: "var(--duo-secondary)" }}
                aria-hidden
              />
              <h2 className="font-bold text-[var(--duo-fg)]">Funções</h2>
            </div>
          </DuoCard.Header>
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
        </DuoCard.Root>
      </SlideIn>

      <SlideIn delay={0.3}>
        <DuoCard.Root variant="default" padding="md">
          <DuoCard.Header>
            <div className="flex items-center gap-2">
              <Dumbbell
                className="h-5 w-5 shrink-0"
                style={{ color: "var(--duo-secondary)" }}
                aria-hidden
              />
              <h2 className="font-bold text-[var(--duo-fg)]">
                Exercícios Comuns
              </h2>
            </div>
          </DuoCard.Header>
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
        </DuoCard.Root>
      </SlideIn>

      <SlideIn delay={0.4}>
        <DuoCard.Root variant="yellow" size="default">
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
        </DuoCard.Root>
      </SlideIn>
    </div>
  );
}
