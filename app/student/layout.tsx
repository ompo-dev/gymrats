import { Suspense } from "react";
import { LoadingScreenFallback } from "@/components/organisms/loading-screen-fallback";
import { getStudentProfile, getStudentProgress } from "./actions";
import { StudentLayoutContent } from "./layout-content";

export const dynamic = "force-dynamic";

async function StudentLayoutWrapper({
	children,
}: {
	children: React.ReactNode;
}) {
	const [profileData, progressData] = await Promise.all([
		getStudentProfile(),
		getStudentProgress(),
	]);

	return (
		<StudentLayoutContent
			hasProfile={profileData.hasProfile}
			initialProgress={{
				streak: progressData.currentStreak,
				xp: progressData.totalXP,
			}}
		>
			{children}
		</StudentLayoutContent>
	);
}

export default function StudentLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<Suspense fallback={<LoadingScreenFallback variant="student" />}>
			<StudentLayoutWrapper>{children}</StudentLayoutWrapper>
		</Suspense>
	);
}
