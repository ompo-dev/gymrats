"use client";

interface ThemeTestSectionProps {
	title: string;
	children: React.ReactNode;
}

export function ThemeTestSection({ title, children }: ThemeTestSectionProps) {
	return (
		<section>
			<h2 className="mb-3 text-lg font-bold text-[var(--duo-fg)]">{title}</h2>
			{children}
		</section>
	);
}
