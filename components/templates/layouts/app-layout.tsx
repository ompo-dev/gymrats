"use client";

import type { LucideIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import type { ReactNode } from "react";
import { AppBottomNav } from "@/components/organisms/navigation/app-bottom-nav";
import { AppHeader } from "@/components/organisms/navigation/app-header";
import { useSwipeDirection } from "@/contexts/swipe-direction";
import { useScrollReset } from "@/hooks/use-scroll-reset";
import { useSwipe } from "@/hooks/use-swipe";

export interface TabConfig {
	id: string;
	icon: LucideIcon;
	label: string;
}

interface AppLayoutProps {
	children: ReactNode;
	userType: "student" | "gym";
	tabs: TabConfig[];
	defaultTab: string;
	basePath: string;
	stats: {
		streak: number;
		xp: number;
		level?: number;
		ranking?: number;
	};
	showLogo?: boolean;
	shouldDisableSwipe?: (pathname: string) => boolean;
	onTabChange?: (newTab: string, currentTab: string) => Promise<void> | void;
	additionalContent?: ReactNode;
	scrollResetEnabled?: boolean;
	className?: string;
}

export function AppLayout({
	children,
	userType,
	tabs,
	defaultTab,
	basePath,
	stats,
	showLogo = false,
	shouldDisableSwipe,
	onTabChange: customTabChange,
	additionalContent,
	scrollResetEnabled = true,
	className = "",
}: AppLayoutProps) {
	const pathname = usePathname();
	const router = useRouter();
	const [tab, setTab] = useQueryState(
		"tab",
		parseAsString.withDefault(defaultTab),
	);
	const { setDirection } = useSwipeDirection();

	const isSwipeDisabled = shouldDisableSwipe?.(pathname) ?? false;

	const mainRef = useScrollReset<HTMLElement>({
		dependencies: [pathname, tab],
		behavior: "instant",
		enabled: scrollResetEnabled,
	});

	const activeTab = tab;

	const handleTabChange = async (newTab: string) => {
		const currentIndex = tabs.findIndex((t) => t.id === activeTab);
		const newIndex = tabs.findIndex((t) => t.id === newTab);

		if (newIndex > currentIndex) {
			setDirection("left");
		} else if (newIndex < currentIndex) {
			setDirection("right");
		}

		if (customTabChange) {
			await customTabChange(newTab, activeTab);
		} else {
			await setTab(newTab);
			router.push(`${basePath}?tab=${newTab}`);
		}

		setTimeout(() => {
			if (mainRef.current) {
				mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
			}
		}, 0);

		setTimeout(() => setDirection(null), 300);
	};

	const goToNextTab = async () => {
		setDirection("left");
		const currentIndex = tabs.findIndex((t) => t.id === activeTab);
		if (currentIndex < tabs.length - 1) {
			await handleTabChange(tabs[currentIndex + 1].id);
		}
		setTimeout(() => setDirection(null), 300);
	};

	const goToPreviousTab = async () => {
		setDirection("right");
		const currentIndex = tabs.findIndex((t) => t.id === activeTab);
		if (currentIndex > 0) {
			await handleTabChange(tabs[currentIndex - 1].id);
		}
		setTimeout(() => setDirection(null), 300);
	};

	const swipeHandlers = useSwipe({
		onSwipeLeft: isSwipeDisabled ? undefined : goToNextTab,
		onSwipeRight: isSwipeDisabled ? undefined : goToPreviousTab,
		threshold: 50,
	});

	return (
		<div
			className={`h-screen flex flex-col overflow-hidden ${className}`}
			{...(!isSwipeDisabled
				? {
						onTouchStart: swipeHandlers.onTouchStart,
						onTouchMove: swipeHandlers.onTouchMove,
						onTouchEnd: swipeHandlers.onTouchEnd,
						onMouseDown: swipeHandlers.onMouseDown,
						onMouseMove: swipeHandlers.onMouseMove,
						onMouseUp: swipeHandlers.onMouseUp,
						onMouseLeave: swipeHandlers.onMouseUp,
					}
				: {})}
		>
			<AppHeader userType={userType} stats={stats} showLogo={showLogo} />

			<main
				ref={mainRef}
				className="flex-1 overflow-y-auto scrollbar-hide pb-20"
			>
				{children}
			</main>

			<AppBottomNav
				userType={userType}
				activeTab={activeTab}
				tabs={tabs}
				onTabChange={handleTabChange}
			/>

			{additionalContent}
		</div>
	);
}
