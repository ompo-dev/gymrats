"use client";

import { useMemo } from "react";
import { educationalLessons } from "@/lib/educational-data";
import type { EducationalLesson } from "@/lib/types";

export function useEducationCategories() {
  return useMemo(() => {
    const cats = new Set(educationalLessons.map((l) => l.category));
    return Array.from(cats);
  }, []);
}

export function useCategoryHelpers() {
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

  return { getCategoryIcon, getCategoryLabel };
}

export function useFilteredLessons(
  searchQuery: string,
  selectedCategory: string
) {
  const { getCategoryLabel } = useCategoryHelpers();

  return useMemo(() => {
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
  }, [selectedCategory, searchQuery, getCategoryLabel]);
}

export function useLessonsByCategory(
  selectedCategory: string,
  searchQuery: string
) {
  const filteredLessons = useFilteredLessons(searchQuery, selectedCategory);

  return useMemo(() => {
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
  }, [selectedCategory, searchQuery, filteredLessons]);
}
