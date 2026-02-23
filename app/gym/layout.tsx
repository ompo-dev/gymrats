import { Suspense } from "react";
import { LoadingScreen } from "@/components/organisms/loading-screen";
import { SwipeDirectionProvider } from "@/contexts/swipe-direction";
import { getGymProfile } from "./actions";
import { GymLayoutContent } from "./layout-content";

export const dynamic = "force-dynamic";

async function GymLayoutWrapper({ children }: { children: React.ReactNode }) {
	const profile = await getGymProfile();

	return (
		<GymLayoutContent
			initialStats={{
				streak: profile?.gamification?.currentStreak ?? 0,
				xp: profile?.gamification?.xp ?? 0,
				level: profile?.gamification?.level ?? 1,
				ranking: profile?.gamification?.ranking ?? 0,
			}}
		>
			{children}
		</GymLayoutContent>
	);
}

export default function GymLayout({ children }: { children: React.ReactNode }) {
	return (
		<SwipeDirectionProvider>
			<Suspense fallback={<LoadingScreen variant="gym" />}>
				<GymLayoutWrapper>{children}</GymLayoutWrapper>
			</Suspense>
		</SwipeDirectionProvider>
	);
}
