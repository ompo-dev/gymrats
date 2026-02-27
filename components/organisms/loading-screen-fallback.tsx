/**
 * Fallback de loading para Suspense em layouts (Server Component).
 * Usado em vez de LoadingScreen.Simple para evitar React error #130 em produção,
 * quando Client Components no fallback podem não estar disponíveis durante o streaming.
 */
interface LoadingScreenFallbackProps {
	variant?: "student" | "gym";
	message?: string;
}

export function LoadingScreenFallback({
	variant = "student",
	message = "Carregando...",
}: LoadingScreenFallbackProps) {
	const isStudent = variant === "student";
	const primaryClass = isStudent ? "text-duo-green" : "text-duo-orange";
	const bgClass = isStudent ? "bg-duo-green/10" : "bg-duo-orange/10";
	const ringClass = isStudent ? "border-duo-green" : "border-duo-orange";
	const screenBg = isStudent ? "bg-white" : "bg-gray-50";
	const subtext = isStudent
		? "Preparando sua experiência..."
		: "Carregando sua academia...";

	return (
		<div
			className={`h-screen flex items-center justify-center ${screenBg}`}
			role="status"
			aria-live="polite"
			aria-label={message}
		>
			<div className="text-center space-y-6">
				<div className="flex justify-center">
					<div
						className={`relative flex h-24 w-24 items-center justify-center rounded-full ${bgClass}`}
					>
						<div
							className={`absolute inset-0 rounded-full border-4 border-t-transparent animate-spin ${ringClass}`}
							style={{ animationDuration: "1s" }}
						/>
					</div>
				</div>
				<div className="space-y-2">
					<h2 className="text-xl font-bold text-duo-text">{message}</h2>
					<p className="text-sm text-duo-gray-dark">{subtext}</p>
				</div>
				<div className="flex justify-center gap-2">
					{[0, 1, 2].map((i) => (
						<div
							key={i}
							className={`h-2 w-2 rounded-full ${primaryClass} animate-pulse`}
							style={{ animationDelay: `${i * 200}ms` }}
						/>
					))}
				</div>
			</div>
		</div>
	);
}
