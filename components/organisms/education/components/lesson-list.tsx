"use client";

import { BookOpen, CheckCircle, Clock, Zap } from "lucide-react";
import { motion } from "motion/react";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoCard } from "@/components/molecules/cards/duo-card";
import type { EducationalLesson } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LessonListProps {
	lessons: EducationalLesson[];
	lessonsByCategory: Record<string, EducationalLesson[]> | null;
	categoryColors: Record<string, { bg: string; text: string; border: string }>;
	onLessonSelect: (lesson: EducationalLesson) => void;
	getCategoryIcon: (category: string) => string;
	getCategoryLabel: (category: string) => string;
}

export function LessonList({
	lessons,
	lessonsByCategory,
	categoryColors,
	onLessonSelect,
	getCategoryIcon,
	getCategoryLabel,
}: LessonListProps) {
	if (lessons.length === 0) {
		return (
			<SlideIn delay={0.15}>
				<DuoCard variant="default" size="default">
					<div className="py-8 text-center text-duo-gray-dark">
						<p className="font-bold">Nenhuma lição encontrada</p>
						<p className="mt-1 text-sm">Tente ajustar os filtros ou busca</p>
					</div>
				</DuoCard>
			</SlideIn>
		);
	}

	if (lessonsByCategory === null) {
		return (
			<SlideIn delay={0.15}>
				<div className="space-y-3">
					{lessons.map((lesson, index) => {
						const colors = categoryColors[lesson.category] || {
							bg: "bg-duo-blue/20",
							text: "text-duo-blue",
							border: "border-duo-blue",
						};

						return (
							<motion.div
								key={lesson.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.05, duration: 0.4 }}
							>
								<LessonCard
									lesson={lesson}
									colors={colors}
									onClick={() => onLessonSelect(lesson)}
									getCategoryIcon={getCategoryIcon}
									getCategoryLabel={getCategoryLabel}
								/>
							</motion.div>
						);
					})}
				</div>
			</SlideIn>
		);
	}

	return (
		<SlideIn delay={0.15}>
			<div className="space-y-6">
				{Object.entries(lessonsByCategory).map(
					([category, categoryLessons]) => {
						const colors = categoryColors[category] || {
							bg: "bg-duo-blue/20",
							text: "text-duo-blue",
							border: "border-duo-blue",
						};

						return (
							<div key={category} className="space-y-3">
								<motion.div
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ duration: 0.3 }}
									className="flex items-center gap-3"
								>
									<div
										className={cn(
											"flex h-10 w-10 items-center justify-center rounded-xl text-xl",
											colors.bg,
										)}
									>
										{getCategoryIcon(category)}
									</div>
									<div>
										<h2 className="text-xl font-bold capitalize text-duo-text">
											{getCategoryLabel(category)}
										</h2>
										<span className="text-xs font-bold text-duo-gray-dark">
											{categoryLessons.length}{" "}
											{categoryLessons.length === 1 ? "lição" : "lições"}
										</span>
									</div>
								</motion.div>

								<div className="space-y-3">
									{categoryLessons.map((lesson, index) => (
										<motion.div
											key={lesson.id}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: index * 0.05, duration: 0.4 }}
										>
											<LessonCard
												lesson={lesson}
												colors={colors}
												onClick={() => onLessonSelect(lesson)}
												getCategoryIcon={getCategoryIcon}
												getCategoryLabel={getCategoryLabel}
											/>
										</motion.div>
									))}
								</div>
							</div>
						);
					},
				)}
			</div>
		</SlideIn>
	);
}

function LessonCard({
	lesson,
	colors,
	onClick,
	getCategoryIcon,
	getCategoryLabel,
}: {
	lesson: EducationalLesson;
	colors: { bg: string; text: string; border: string };
	onClick: () => void;
	getCategoryIcon: (category: string) => string;
	getCategoryLabel: (category: string) => string;
}) {
	return (
		<DuoCard
			variant="default"
			size="default"
			onClick={onClick}
			className={cn(
				"cursor-pointer transition-all hover:border-duo-blue active:scale-[0.98]",
				colors.border && `hover:${colors.border}`,
			)}
		>
			<div className="mb-3 flex items-start justify-between">
				<div className="flex gap-3">
					<div
						className={cn(
							"flex h-12 w-12 items-center justify-center rounded-xl text-2xl",
							colors.bg,
						)}
					>
						{getCategoryIcon(lesson.category)}
					</div>
					<div className="flex-1">
						<div className="mb-1 font-bold text-duo-text">{lesson.title}</div>
						<div className="mb-2 flex flex-wrap gap-2">
							<span
								className={cn(
									"rounded-full px-2 py-0.5 text-xs font-bold",
									colors.bg,
									colors.text,
								)}
							>
								{getCategoryLabel(lesson.category)}
							</span>
							{lesson.quiz && (
								<span className="rounded-full bg-duo-orange/20 px-2 py-0.5 text-xs font-bold text-duo-orange">
									Quiz
								</span>
							)}
						</div>
					</div>
				</div>
				{lesson.completed && (
					<CheckCircle className="h-6 w-6 shrink-0 text-duo-green" />
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
				{lesson.quiz && (
					<span className="flex items-center gap-1 text-xs">
						<BookOpen className="h-3 w-3" />
						{lesson.quiz.questions.length} perguntas
					</span>
				)}
			</div>
		</DuoCard>
	);
}
