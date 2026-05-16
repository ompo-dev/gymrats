import type * as React from "react";
import { cn } from "@/lib/utils";
import { DuoCard } from "./duo-card";
import { StatCard } from "./stat-card";

export interface ProfileHeaderProps
	extends React.HTMLAttributes<HTMLDivElement> {
	avatar?: string | React.ReactNode;
	name: string;
	username: string;
	memberSince: string;
	stats: {
		workouts: number;
		streak: number;
	};
	quickStats: Array<{
		value: string | number | React.ReactNode;
		label: string;
		highlighted?: boolean;
	}>;
	quickStatsButtons?: React.ReactNode;
}

export function ProfileHeader({
	avatar = "👤",
	name,
	username,
	memberSince,
	stats,
	quickStats,
	quickStatsButtons,
	className,
	...props
}: ProfileHeaderProps) {
	return (
		<DuoCard
			variant="default"
			size="default"
			className={cn(className)}
			{...props}
		>
			<div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
				<div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full border-2 border-gray-300 bg-linear-to-br from-duo-blue/10 to-duo-green/10 text-3xl sm:text-4xl shadow-[0_2px_0_#D1D5DB] shrink-0">
					{avatar}
				</div>
				<div className="flex-1 text-center sm:text-left w-full">
					<h1 className="mb-1 text-xl sm:text-2xl font-bold text-gray-900">
						{name}
					</h1>
					<p className="mb-3 text-xs sm:text-sm text-gray-600">
						{username} • Membro desde {memberSince}
					</p>
					<div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 text-xs sm:text-sm">
						<div>
							<span className="font-bold text-gray-900">{stats.workouts}</span>
							<span className="text-gray-600"> Treinos</span>
						</div>
						<div className="h-4 w-px bg-gray-300 hidden sm:block" />
						<div>
							<span className="font-bold text-gray-900">{stats.streak}</span>
							<span className="text-gray-600"> Dias streak</span>
						</div>
					</div>
				</div>
			</div>

			<div className="mt-6 grid sm:grid-cols-2 grid-cols-2 gap-3">
				{quickStats.map((stat, index) => (
					<StatCard
						key={index}
						value={stat.value}
						label={stat.label}
						variant={stat.highlighted ? "highlighted" : "default"}
					/>
				))}
				{quickStatsButtons}
			</div>
		</DuoCard>
	);
}
