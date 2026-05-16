"use client";

import { useEffect, useState } from "react";
import { FadeIn } from "@/components/animations/fade-in";
import { LessonDetail } from "@/components/organisms/education/components/lesson-detail";
import { LessonFilters } from "@/components/organisms/education/components/lesson-filters";
import { LessonList } from "@/components/organisms/education/components/lesson-list";
import { LessonQuiz } from "@/components/organisms/education/components/lesson-quiz";
import {
	useCategoryHelpers,
	useEducationCategories,
	useFilteredLessons,
	useLessonsByCategory,
} from "@/hooks/use-education-data";
import { useScrollToTop } from "@/hooks/use-scroll-to-top";
import { educationalLessons } from "@/lib/educational-data";
import type { EducationalLesson } from "@/lib/types";

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
			}
		} else {
			setSelectedLesson(null);
		}
	}, [lessonId]);

	useScrollToTop([selectedLesson, showQuiz]);

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
			handleBack();
		}
	};

	const handleQuizComplete = (passed: boolean) => {
		if (passed) {
			setShowQuiz(false);
			handleBack();
		}
	};

	const categories = useEducationCategories();
	const { getCategoryIcon, getCategoryLabel } = useCategoryHelpers();
	const filteredLessons = useFilteredLessons(searchQuery, selectedCategory);
	const lessonsByCategory = useLessonsByCategory(selectedCategory, searchQuery);

	if (showQuiz && selectedLesson?.quiz) {
		return (
			<LessonQuiz
				lesson={selectedLesson}
				onComplete={handleQuizComplete}
				onRetry={() => setShowQuiz(false)}
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
