"use client";

import { useState } from "react";
import type { EducationalLesson } from "@/lib/types";
import { BookOpen, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/atoms/buttons/button";
import { SectionCard } from "@/components/molecules/cards/section-card";
import { DuoCard } from "@/components/molecules/cards/duo-card";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { cn } from "@/lib/utils";
import { useScrollToTop } from "@/hooks/use-scroll-to-top";

interface LessonQuizProps {
  lesson: EducationalLesson;
  onComplete: (passed: boolean) => void;
  onRetry: () => void;
}

export function LessonQuiz({ lesson, onComplete, onRetry }: LessonQuizProps) {
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);

  useScrollToTop([lesson]);

  const handleSubmitQuiz = () => {
    if (!lesson.quiz) return;

    let correct = 0;
    lesson.quiz.questions.forEach((q, i) => {
      if (quizAnswers[i] === q.correctAnswer) correct++;
    });

    const score = (correct / lesson.quiz.questions.length) * 100;
    setQuizScore(score);
    setShowResults(true);

    if (score >= 70) {
      onComplete(true);
    }
  };

  const isQuestionCorrect = (qIndex: number) => {
    if (!showResults || quizScore === null) return null;
    return quizAnswers[qIndex] === lesson.quiz!.questions[qIndex].correctAnswer;
  };

  if (!lesson.quiz) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-6  ">
      <FadeIn>
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold text-duo-text">
            Quiz: {lesson.title}
          </h1>
          <p className="text-sm text-duo-gray-dark">
            Responda corretamente para ganhar {lesson.xpReward} XP
          </p>
        </div>
      </FadeIn>

      <SlideIn delay={0.1}>
        <div className="space-y-6">
          {lesson.quiz.questions.map((question, qIndex) => {
            const options = question.options.map((option, oIndex) => ({
              value: String(oIndex),
              label: option,
            }));

            const selectedValue =
              quizAnswers[qIndex] !== undefined
                ? String(quizAnswers[qIndex])
                : "";

            const isCorrect = isQuestionCorrect(qIndex);
            const correctAnswerIndex = question.correctAnswer;
            const userAnswer = quizAnswers[qIndex];
            const hasError = showResults && isCorrect === false;

            return (
              <div key={qIndex}>
                <SectionCard
                  title={`${qIndex + 1}. ${question.question}`}
                  icon={BookOpen}
                  className={cn(
                    showResults &&
                      (isCorrect === false
                        ? "border-duo-red bg-duo-red/5"
                        : isCorrect === true
                        ? "border-duo-green bg-duo-green/5"
                        : "")
                  )}
                >
                  <div className="space-y-3">
                    {options.map((opt, optIndex) => {
                      const isSelected = userAnswer === optIndex;
                      const isCorrectOption = optIndex === correctAnswerIndex;
                      const shouldHighlight =
                        showResults &&
                        (isCorrectOption || (isSelected && !isCorrectOption));

                      return (
                        <button
                          key={opt.value}
                          disabled={showResults}
                          onClick={() => {
                            if (!showResults) {
                              const newAnswers = [...quizAnswers];
                              newAnswers[qIndex] = optIndex;
                              setQuizAnswers(newAnswers);
                            }
                          }}
                          className={cn(
                            "relative w-full rounded-2xl border-2 p-4 text-left font-bold transition-all disabled:cursor-not-allowed",
                            shouldHighlight
                              ? isCorrectOption
                                ? "border-duo-green bg-duo-green/20 text-duo-green"
                                : "border-duo-red bg-duo-red/20 text-duo-red"
                              : isSelected
                              ? "border-duo-green bg-duo-green text-white"
                              : "border-gray-300 bg-white text-gray-900 hover:border-duo-green/50",
                            !showResults && "cursor-pointer"
                          )}
                        >
                          {showResults && isCorrectOption && (
                            <CheckCircle className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-white text-duo-green shadow-lg" />
                          )}
                          {showResults && isSelected && !isCorrectOption && (
                            <XCircle className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-white text-duo-red shadow-lg" />
                          )}
                          <div
                            className={cn(
                              shouldHighlight
                                ? isCorrectOption
                                  ? "text-duo-green"
                                  : "text-duo-red"
                                : isSelected
                                ? "text-white"
                                : "text-gray-900"
                            )}
                          >
                            {opt.label}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </SectionCard>

                {hasError && (
                  <SlideIn delay={0.05}>
                    <DuoCard
                      variant="default"
                      size="default"
                      className="mt-3 border-duo-red bg-duo-red/10"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <XCircle className="h-5 w-5 shrink-0 text-duo-red" />
                          <div className="flex-1">
                            <div className="mb-1 font-bold text-duo-red">
                              Resposta Incorreta
                            </div>
                            <div className="text-sm text-duo-text">
                              Você selecionou:{" "}
                              <span className="font-bold text-duo-red">
                                {question.options[userAnswer]}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 shrink-0 text-duo-green" />
                          <div className="flex-1">
                            <div className="mb-1 font-bold text-duo-green">
                              Resposta Correta
                            </div>
                            <div className="text-sm text-duo-text">
                              <span className="font-bold text-duo-green">
                                {question.options[correctAnswerIndex]}
                              </span>
                            </div>
                          </div>
                        </div>

                        {question.explanation && (
                          <div className="rounded-lg bg-white/50 p-3">
                            <div className="mb-1 text-xs font-bold text-duo-gray-dark">
                              EXPLICAÇÃO
                            </div>
                            <div className="text-sm leading-relaxed text-duo-text">
                              {question.explanation}
                            </div>
                          </div>
                        )}
                      </div>
                    </DuoCard>
                  </SlideIn>
                )}

                {showResults && isCorrect === true && (
                  <SlideIn delay={0.05}>
                    <DuoCard
                      variant="default"
                      size="default"
                      className="mt-3 border-duo-green bg-duo-green/10"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 shrink-0 text-duo-green" />
                        <div className="font-bold text-duo-green">
                          Resposta Correta!
                        </div>
                      </div>
                    </DuoCard>
                  </SlideIn>
                )}
              </div>
            );
          })}
        </div>
      </SlideIn>

      {quizScore === null ? (
        <SlideIn delay={0.2}>
          <Button
            onClick={handleSubmitQuiz}
            disabled={quizAnswers.length < lesson.quiz.questions.length}
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
                if (quizScore >= 70) {
                  onComplete(true);
                } else {
                  setQuizScore(null);
                  setQuizAnswers([]);
                  setShowResults(false);
                  onRetry();
                }
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
