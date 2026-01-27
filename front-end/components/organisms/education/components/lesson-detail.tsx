"use client";

import type { EducationalLesson } from "@/lib/types";
import { CheckCircle, Clock, Zap, ArrowLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/atoms/buttons/button";
import { SectionCard } from "@/components/molecules/cards/section-card";
import { DuoCard } from "@/components/molecules/cards/duo-card";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { MarkdownRenderer } from "./markdown-renderer";
import { cn } from "@/lib/utils";
import { useScrollToTop } from "@/hooks/use-scroll-to-top";

interface LessonDetailProps {
  lesson: EducationalLesson;
  onBack: () => void;
  onComplete: () => void;
  getCategoryIcon: (category: string) => string;
  getCategoryLabel: (category: string) => string;
  getCategoryColor: (category: string) => {
    bg: string;
    text: string;
    border: string;
  };
}

export function LessonDetail({
  lesson,
  onBack,
  onComplete,
  getCategoryIcon,
  getCategoryLabel,
  getCategoryColor,
}: LessonDetailProps) {
  useScrollToTop([lesson]);

  const colors = getCategoryColor(lesson.category);

  return (
    <div className="mx-auto max-w-4xl space-y-6  ">
      <FadeIn>
        <button
          onClick={onBack}
          className="mb-4 flex items-center gap-2 font-bold text-duo-green hover:underline"
        >
          <ArrowLeft className="h-5 w-5" />
          Voltar
        </button>
      </FadeIn>

      <SlideIn delay={0.1}>
        <SectionCard title={lesson.title} icon={BookOpen} variant="blue">
          <div className="mb-4 text-4xl">
            {getCategoryIcon(lesson.category)}
          </div>
          <div className="mb-4 flex flex-wrap items-center gap-4 text-sm font-bold text-duo-gray-dark">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {lesson.duration} min
            </span>
            <span className="flex items-center gap-1">
              <Zap className="h-4 w-4 text-duo-yellow" />
              {lesson.xpReward} XP
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-bold",
                colors.bg,
                colors.text
              )}
            >
              {getCategoryLabel(lesson.category)}
            </span>
          </div>
          <MarkdownRenderer content={lesson.content} />
        </SectionCard>
      </SlideIn>

      <SlideIn delay={0.2}>
        <DuoCard variant="highlighted" size="default">
          <h3 className="mb-3 text-lg font-bold text-duo-text">Pontos-Chave</h3>
          <ul className="space-y-2">
            {lesson.keyPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-duo-green" />
                <span className="text-duo-text">{point}</span>
              </li>
            ))}
          </ul>
        </DuoCard>
      </SlideIn>

      <SlideIn delay={0.3}>
        <Button onClick={onComplete} className="w-full">
          {lesson.quiz ? "FAZER QUIZ" : "CONCLUIR LIÇÃO"}
        </Button>
      </SlideIn>
    </div>
  );
}
