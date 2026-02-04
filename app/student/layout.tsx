import { Suspense } from "react";
import { LoadingScreen } from "@/components/organisms/loading-screen";
import { SwipeDirectionProvider } from "@/contexts/swipe-direction";
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
		<SwipeDirectionProvider>
			<Suspense fallback={<LoadingScreen variant="student" />}>
				<StudentLayoutWrapper>{children}</StudentLayoutWrapper>
			</Suspense>
		</SwipeDirectionProvider>
	);
}
