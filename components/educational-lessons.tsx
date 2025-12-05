"use client";

import { useState, useEffect } from "react";
import { educationalLessons } from "@/lib/educational-data";
import type { EducationalLesson } from "@/lib/types";
import { CheckCircle, Clock, Zap, ArrowLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OptionSelector } from "@/components/ui/option-selector";
import { SectionCard } from "@/components/ui/section-card";
import { DuoCard } from "@/components/ui/duo-card";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface EducationalLessonsProps {
  lessonId?: string | null;
  onLessonSelect?: (id: string) => void;
  onBack?: () => void;
}

export function EducationalLessons({
  lessonId,
  onLessonSelect,
  onBack,
}: EducationalLessonsProps) {
  const [selectedLesson, setSelectedLesson] =
    useState<EducationalLesson | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  useEffect(() => {
    if (lessonId) {
      const lesson = educationalLessons.find((l) => l.id === lessonId);
      if (lesson) setSelectedLesson(lesson);
    } else {
      setSelectedLesson(null);
    }
  }, [lessonId]);

  const handleLessonSelect = (lesson: EducationalLesson) => {
    setSelectedLesson(lesson);
    onLessonSelect?.(lesson.id);
  };

  const handleBack = () => {
    setSelectedLesson(null);
    setShowQuiz(false);
    setQuizAnswers([]);
    setQuizScore(null);
    onBack?.();
  };

  const handleCompleteLesson = () => {
    if (selectedLesson?.quiz) {
      setShowQuiz(true);
    } else {
      console.log(
        "[v0] Lesson completed, awarding XP:",
        selectedLesson?.xpReward
      );
      handleBack();
    }
  };

  const handleSubmitQuiz = () => {
    if (!selectedLesson?.quiz) return;

    let correct = 0;
    selectedLesson.quiz.questions.forEach((q, i) => {
      if (quizAnswers[i] === q.correctAnswer) correct++;
    });

    const score = (correct / selectedLesson.quiz.questions.length) * 100;
    setQuizScore(score);

    if (score >= 70) {
      console.log("[v0] Quiz passed! Awarding XP:", selectedLesson.xpReward);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      anatomy: "🦴",
      nutrition: "🥗",
      "training-science": "🔬",
      recovery: "😴",
      form: "✓",
    };
    return icons[category] || "📚";
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      anatomy: "Anatomia",
      nutrition: "Nutrição",
      "training-science": "Ciência do Treino",
      recovery: "Recuperação",
      form: "Técnica",
    };
    return labels[category] || category;
  };

  if (showQuiz && selectedLesson?.quiz) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 pb-24">
        <FadeIn>
          <div className="text-center">
            <h1 className="mb-2 text-3xl font-bold text-duo-text">
              Quiz: {selectedLesson.title}
            </h1>
            <p className="text-sm text-duo-gray-dark">
              Responda corretamente para ganhar {selectedLesson.xpReward} XP
            </p>
          </div>
        </FadeIn>

        <SlideIn delay={0.1}>
          <div className="space-y-6">
            {selectedLesson.quiz.questions.map((question, qIndex) => {
              const options = question.options.map((option, oIndex) => ({
                value: String(oIndex),
                label: option,
              }));

              const selectedValue =
                quizAnswers[qIndex] !== undefined
                  ? String(quizAnswers[qIndex])
                  : "";

              return (
                <SectionCard
                  key={qIndex}
                  title={`${qIndex + 1}. ${question.question}`}
                  icon={BookOpen}
                >
                  <OptionSelector
                    options={options}
                    value={selectedValue}
                    onChange={(value) => {
                      const newAnswers = [...quizAnswers];
                      newAnswers[qIndex] = parseInt(value, 10);
                      setQuizAnswers(newAnswers);
                    }}
                    layout="list"
                    size="md"
                    textAlign="left"
                    animate={true}
                  />
                </SectionCard>
              );
            })}
          </div>
        </SlideIn>

        {quizScore === null ? (
          <SlideIn delay={0.2}>
            <Button
              onClick={handleSubmitQuiz}
              disabled={
                quizAnswers.length < selectedLesson.quiz.questions.length
              }
              className="w-full"
            >
              ENVIAR RESPOSTAS
            </Button>
          </SlideIn>
        ) : (
          <SlideIn delay={0.2}>
            <DuoCard
              variant={quizScore >= 70 ? "highlighted" : "default"}
              size="default"
              className={cn(
                "text-center",
                quizScore < 70 && "border-duo-red bg-duo-red/10"
              )}
            >
              <div className="mb-2 text-4xl font-bold text-duo-text">
                {quizScore.toFixed(0)}%
              </div>
              <div className="mb-4 text-duo-gray-dark">
                {quizScore >= 70
                  ? "Parabéns! Você passou!"
                  : "Continue estudando e tente novamente"}
              </div>
              <Button
                onClick={() => {
                  setShowQuiz(false);
                  setQuizAnswers([]);
                  setQuizScore(null);
                  if (quizScore >= 70) handleBack();
                }}
                className="w-full"
              >
                {quizScore >= 70 ? "CONTINUAR" : "TENTAR NOVAMENTE"}
              </Button>
            </DuoCard>
          </SlideIn>
        )}
      </div>
    );
  }

  if (selectedLesson) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 pb-24">
        <FadeIn>
          <button
            onClick={handleBack}
            className="mb-4 flex items-center gap-2 font-bold text-duo-green hover:underline"
          >
            <ArrowLeft className="h-5 w-5" />
            Voltar
          </button>
        </FadeIn>

        <SlideIn delay={0.1}>
          <SectionCard
            title={selectedLesson.title}
            icon={BookOpen}
            variant="blue"
          >
            <div className="mb-4 text-4xl">
              {getCategoryIcon(selectedLesson.category)}
            </div>
            <div className="mb-4 flex flex-wrap items-center gap-4 text-sm font-bold text-duo-gray-dark">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {selectedLesson.duration} min
              </span>
              <span className="flex items-center gap-1">
                <Zap className="h-4 w-4 text-duo-yellow" />
                {selectedLesson.xpReward} XP
              </span>
              <span className="rounded-full bg-duo-blue/20 px-2 py-0.5 text-xs font-bold text-duo-blue">
                {getCategoryLabel(selectedLesson.category)}
              </span>
            </div>
            <div className="prose max-w-none text-duo-text">
              {selectedLesson.content.split("\n\n").map((paragraph, i) => (
                <p key={i} className="mb-4 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </SectionCard>
        </SlideIn>

        <SlideIn delay={0.2}>
          <DuoCard variant="highlighted" size="default">
            <h3 className="mb-3 text-lg font-bold text-duo-text">
              Pontos-Chave
            </h3>
            <ul className="space-y-2">
              {selectedLesson.keyPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-duo-green" />
                  <span className="text-duo-text">{point}</span>
                </li>
              ))}
            </ul>
          </DuoCard>
        </SlideIn>

        <SlideIn delay={0.3}>
          <Button onClick={handleCompleteLesson} className="w-full">
            {selectedLesson.quiz ? "FAZER QUIZ" : "CONCLUIR LIÇÃO"}
          </Button>
        </SlideIn>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-24">
      <FadeIn>
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold text-duo-text">
            Lições Educacionais
          </h1>
          <p className="text-sm text-duo-gray-dark">
            Aprenda ciência do fitness com evidências
          </p>
        </div>
      </FadeIn>

      <SlideIn delay={0.1}>
        <div className="space-y-3">
          {educationalLessons.map((lesson, index) => (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
            >
              <DuoCard
                variant="default"
                size="default"
                onClick={() => handleLessonSelect(lesson)}
                className="cursor-pointer transition-all hover:border-duo-blue active:scale-[0.98]"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-duo-blue/20 text-2xl">
                      {getCategoryIcon(lesson.category)}
                    </div>
                    <div>
                      <div className="mb-1 font-bold text-duo-text">
                        {lesson.title}
                      </div>
                      <div className="text-xs font-bold text-duo-gray-dark">
                        {getCategoryLabel(lesson.category)}
                      </div>
                    </div>
                  </div>
                  {lesson.completed && (
                    <CheckCircle className="h-6 w-6 text-duo-green" />
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm font-bold text-duo-gray-dark">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {lesson.duration} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="h-4 w-4 text-duo-yellow" />
                    {lesson.xpReward} XP
                  </span>
                </div>
              </DuoCard>
            </motion.div>
          ))}
        </div>
      </SlideIn>
    </div>
  );
}
