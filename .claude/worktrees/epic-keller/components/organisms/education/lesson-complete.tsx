"use client";

import { Star, Trophy, Zap } from "lucide-react";
import { Button } from "@/components/atoms/buttons/button";
import { cn } from "@/lib/utils";

interface LessonCompleteProps {
	correctAnswers: number;
	totalQuestions: number;
	xpEarned: number;
	stars: number;
	onContinue: () => void;
}

export function LessonComplete({
	correctAnswers,
	totalQuestions,
	xpEarned,
	stars,
	onContinue,
}: LessonCompleteProps) {
	const accuracy = Math.round((correctAnswers / totalQuestions) * 100);

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<div className="w-full max-w-md space-y-6 text-center">
				<div className="animate-in zoom-in-50 duration-500">
					<Trophy className="mx-auto h-24 w-24 text-warning" />
				</div>

				<div>
					<h1 className="mb-2 text-4xl font-bold">Lição Completa!</h1>
					<p className="text-lg text-muted-foreground">
						Parabéns pelo progresso
					</p>
				</div>

				<div className="space-y-4">
					{/* Stars */}
					<div className="flex items-center justify-center gap-2">
						{Array.from({ length: 3 }).map((_, i) => (
							<div
								key={i}
								className={cn(
									"flex h-16 w-16 items-center justify-center rounded-full transition-all",
									i < stars
										? "animate-in zoom-in-50 bg-warning/20"
										: "bg-muted",
								)}
								style={{ animationDelay: `${i * 200}ms` }}
							>
								<Star
									className={cn(
										"h-8 w-8",
										i < stars
											? "fill-warning text-warning"
											: "text-muted-foreground",
									)}
								/>
							</div>
						))}
					</div>

					{/* Stats */}
					<div className="grid gap-4 rounded-2xl bg-card p-6 shadow-lg">
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground">Precisão</span>
							<span className="text-2xl font-bold text-primary">
								{accuracy}%
							</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground">Acertos</span>
							<span className="text-2xl font-bold">
								{correctAnswers}/{totalQuestions}
							</span>
						</div>
						<div className="flex items-center justify-between border-t pt-4">
							<span className="flex items-center gap-2 text-warning">
								<Zap className="h-5 w-5" />
								XP Ganho
							</span>
							<span className="text-3xl font-bold text-warning">
								+{xpEarned}
							</span>
						</div>
					</div>
				</div>

				<Button onClick={onContinue} size="lg" className="w-full">
					Continuar
				</Button>
			</div>
		</div>
	);
}
