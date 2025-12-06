"use client";

import { useState, useEffect, useMemo, useLayoutEffect } from "react";
import { educationalLessons } from "@/lib/educational-data";
import type { EducationalLesson } from "@/lib/types";
import { FadeIn } from "@/components/animations/fade-in";
import { LessonQuiz } from "./education/lesson-quiz";
import { LessonDetail } from "./education/lesson-detail";
import { LessonList } from "./education/lesson-list";
import { LessonFilters } from "./education/lesson-filters";

interface EducationalLessonsProps {
  lessonId?: string | null;
  onLessonSelect?: (id: string) => void;
  onBack?: () => void;
}

const categoryColors: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  "training-science": {
    bg: "bg-duo-blue/20",
    text: "text-duo-blue",
    border: "border-duo-blue",
  },
  nutrition: {
    bg: "bg-duo-green/20",
    text: "text-duo-green",
    border: "border-duo-green",
  },
  recovery: {
    bg: "bg-duo-purple/20",
    text: "text-duo-purple",
    border: "border-duo-purple",
  },
  form: {
    bg: "bg-duo-orange/20",
    text: "text-duo-orange",
    border: "border-duo-orange",
  },
  anatomy: {
    bg: "bg-duo-yellow/20",
    text: "text-duo-yellow",
    border: "border-duo-yellow",
  },
};

export function EducationalLessons({
  lessonId,
  onLessonSelect,
  onBack,
}: EducationalLessonsProps) {
  const [selectedLesson, setSelectedLesson] =
    useState<EducationalLesson | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    if (lessonId) {
      const lesson = educationalLessons.find((l) => l.id === lessonId);
      if (lesson) {
        setSelectedLesson(lesson);
        setTimeout(() => {
          window.scrollTo(0, 0);
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }, 100);
      }
    } else {
      setSelectedLesson(null);
    }
  }, [lessonId]);

  useLayoutEffect(() => {
    if (showQuiz && selectedLesson?.quiz) {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [showQuiz, selectedLesson]);

  useLayoutEffect(() => {
    if (selectedLesson && !showQuiz) {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [selectedLesson, showQuiz]);

  const handleLessonSelect = (lesson: EducationalLesson) => {
    setSelectedLesson(lesson);
    onLessonSelect?.(lesson.id);
  };

  const handleBack = () => {
    setSelectedLesson(null);
    setShowQuiz(false);
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

  const handleQuizComplete = (passed: boolean) => {
    if (passed) {
      console.log("[v0] Quiz passed! Awarding XP:", selectedLesson?.xpReward);
      setShowQuiz(false);
      handleBack();
    }
  };

  const handleQuizRetry = () => {
    // Quiz component handles its own state
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

  const categories = useMemo(() => {
    const cats = new Set(educationalLessons.map((l) => l.category));
    return Array.from(cats);
  }, []);

  const filteredLessons = useMemo(() => {
    let filtered = educationalLessons;

    if (selectedCategory !== "all") {
      filtered = filtered.filter((l) => l.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (lesson) =>
          lesson.title.toLowerCase().includes(query) ||
          lesson.content.toLowerCase().includes(query) ||
          getCategoryLabel(lesson.category).toLowerCase().includes(query) ||
          lesson.keyPoints.some((kp) => kp.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [selectedCategory, searchQuery]);

  const lessonsByCategory = useMemo(() => {
    if (selectedCategory !== "all" || searchQuery.trim()) {
      return null;
    }

    const categoryOrder: Record<string, number> = {
      "training-science": 1,
      nutrition: 2,
      recovery: 3,
      form: 4,
      anatomy: 5,
    };

    const grouped: Record<string, EducationalLesson[]> = {};
    educationalLessons.forEach((lesson) => {
      if (!grouped[lesson.category]) {
        grouped[lesson.category] = [];
      }
      grouped[lesson.category].push(lesson);
    });

    const sorted = Object.entries(grouped).sort((a, b) => {
      const orderA = categoryOrder[a[0]] || 99;
      const orderB = categoryOrder[b[0]] || 99;
      return orderA - orderB;
    });

    return Object.fromEntries(sorted);
  }, [selectedCategory, searchQuery]);

  if (showQuiz && selectedLesson?.quiz) {
    return (
      <LessonQuiz
        lesson={selectedLesson}
        onComplete={handleQuizComplete}
        onRetry={handleQuizRetry}
      />
    );
  }

  if (selectedLesson) {
    return (
      <LessonDetail
        lesson={selectedLesson}
        onBack={handleBack}
        onComplete={handleCompleteLesson}
        getCategoryIcon={getCategoryIcon}
        getCategoryLabel={getCategoryLabel}
        getCategoryColor={(cat) =>
          categoryColors[cat] || {
            bg: "bg-duo-blue/20",
            text: "text-duo-blue",
            border: "border-duo-blue",
          }
        }
      />
    );
  }

  const categoryOptions = [
    { value: "all", label: "Todas", emoji: "📚" },
    ...categories.map((cat) => ({
      value: cat,
      label: getCategoryLabel(cat),
      emoji: getCategoryIcon(cat),
    })),
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6  ">
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

      <LessonFilters
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
        categoryOptions={categoryOptions}
        onSearchChange={setSearchQuery}
        onCategoryChange={setSelectedCategory}
      />

      <LessonList
        lessons={filteredLessons}
        lessonsByCategory={lessonsByCategory}
        categoryColors={categoryColors}
        onLessonSelect={handleLessonSelect}
        getCategoryIcon={getCategoryIcon}
        getCategoryLabel={getCategoryLabel}
      />
    </div>
  );
}
