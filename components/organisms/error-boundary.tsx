"use client";

import {
	AlertTriangle,
	Check,
	ChevronDown,
	ChevronUp,
	Copy,
	RefreshCw,
	X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ErrorBoundaryProps {
	children: ReactNode;
	fallback?: ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
	errorInfo: ErrorInfo | null;
	errorId: string;
	componentStack: string;
	timestamp: Date;
	route: string;
	userAgent: string;
	url: string;
	expanded: boolean;
	copied: boolean;
}

export class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
			errorInfo: null,
			errorId: "",
			componentStack: "",
			timestamp: new Date(),
			route: "",
			userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
			url: typeof window !== "undefined" ? window.location.href : "",
			expanded: false,
			copied: false,
		};
	}

	static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
		return {
			hasError: true,
			error,
			errorId: `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			timestamp: new Date(),
			route: typeof window !== "undefined" ? window.location.pathname : "",
			url: typeof window !== "undefined" ? window.location.href : "",
		};
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		// Garantir que temos um objeto Error válido desde o início
		const safeError =
			error instanceof Error
				? error
				: new Error(String(error || "Erro desconhecido"));

		// Ignora erros relacionados à atualização do Service Worker
		const errorMessage = safeError.message || "";
		const errorStack = safeError.stack || "";

		if (
			errorMessage.includes("ServiceWorker") ||
			errorMessage.includes("service worker") ||
			errorMessage.includes("SW_UPDATED") ||
			errorStack.includes("sw.js") ||
			errorStack.includes("ServiceWorker")
		) {
			// Durante atualização do SW, apenas loga e não mostra tela de erro
			console.log(
				"ℹ️ Erro relacionado à atualização do Service Worker (ignorado):",
				safeError.message,
			);
			return;
		}

		// Log completo do erro - serializar de forma segura
		try {
			const errorDetails = {
				error: {
					name: safeError.name || "Unknown",
					message: safeError.message || "Erro desconhecido",
					stack: safeError.stack || "Stack trace não disponível",
				},
				componentStack:
					errorInfo?.componentStack || "Component stack não disponível",
				timestamp: new Date().toISOString(),
				route: typeof window !== "undefined" ? window.location.pathname : "",
				url: typeof window !== "undefined" ? window.location.href : "",
				userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
			};

			console.error("🚨 Error Boundary capturou um erro:", errorDetails);
		} catch (_serializationError) {
			// Se houver erro ao serializar, logar de forma mais simples
			console.error("🚨 Error Boundary capturou um erro (não serializável):", {
				errorMessage: safeError.message || "Erro desconhecido",
				errorName: safeError.name || "Error",
				timestamp: new Date().toISOString(),
			});
		}

		// Atualiza o estado com informações completas

		this.setState({
			error: safeError,
			errorInfo,
			componentStack: errorInfo?.componentStack || "",
		});

		// Envia para um serviço de logging (opcional)
		if (process.env.NODE_ENV === "production") {
			// Aqui você pode enviar para Sentry, LogRocket, etc.
			// sendErrorToLoggingService(errorDetails);
		}
	}

	handleReset = () => {
		this.setState({
			hasError: false,
			error: null,
			errorInfo: null,
			errorId: "",
			componentStack: "",
			timestamp: new Date(),
			route: "",
			expanded: false,
			copied: false,
		});
	};

	handleReload = () => {
		if (typeof window !== "undefined") {
			window.location.reload();
		}
	};

	handleCopy = async () => {
		const errorReport = this.generateErrorReport();
		try {
			await navigator.clipboard.writeText(errorReport);
			this.setState({ copied: true });
			setTimeout(() => this.setState({ copied: false }), 2000);
		} catch (err) {
			console.error("Erro ao copiar:", err);
		}
	};

	generateErrorReport = (): string => {
		const {
			error,
			errorInfo,
			errorId,
			timestamp,
			route,
			url,
			userAgent,
			componentStack,
		} = this.state;

		return `
═══════════════════════════════════════════════════════════
🚨 RELATÓRIO DE ERRO - GymRats
═══════════════════════════════════════════════════════════

ID do Erro: ${errorId}
Timestamp: ${timestamp.toISOString()}
Data/Hora Local: ${timestamp.toLocaleString("pt-BR")}

═══════════════════════════════════════════════════════════
📋 INFORMAÇÕES DO ERRO
═══════════════════════════════════════════════════════════

Nome: ${error?.name || "N/A"}
Mensagem: ${error?.message || "N/A"}

Stack Trace:
${error?.stack || "N/A"}

═══════════════════════════════════════════════════════════
🔍 CONTEXTO
═══════════════════════════════════════════════════════════

Rota: ${route || "N/A"}
URL Completa: ${url || "N/A"}
User Agent: ${userAgent || "N/A"}

Component Stack:
${componentStack || "N/A"}

═══════════════════════════════════════════════════════════
💻 INFORMAÇÕES DO AMBIENTE
═══════════════════════════════════════════════════════════

Ambiente: ${process.env.NODE_ENV || "development"}
Plataforma: ${typeof window !== "undefined" ? "Browser" : "Server"}
Versão do Next.js: ${process.env.NEXT_PUBLIC_NEXTJS_VERSION || "N/A"}

═══════════════════════════════════════════════════════════
    `.trim();
	};

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			const { error, errorId, timestamp, route, url, expanded, copied } =
				this.state;

			return (
				<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background p-4">
					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						className={cn(
							"w-full max-w-4xl rounded-3xl bg-background/95 backdrop-blur-3xl",
							"border border-white/15 shadow-[0_20px_60px_0_rgba(0,0,0,0.5)]",
							"max-h-[90vh] flex flex-col overflow-hidden",
						)}
					>
						{/* Header */}
						<div className="flex items-center gap-4 border-b border-white/10 p-6">
							<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/20">
								<AlertTriangle className="h-6 w-6 text-red-400" />
							</div>
							<div className="flex-1">
								<h1 className="text-2xl font-bold text-foreground">
									Erro Inesperado
								</h1>
								<p className="text-sm text-muted-foreground">ID: {errorId}</p>
							</div>
							<button
								onClick={this.handleReset}
								className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-foreground hover:bg-white/20 transition-all"
								aria-label="Fechar"
							>
								<X className="h-5 w-5" />
							</button>
						</div>

						{/* Content */}
						<div className="flex-1 overflow-y-auto p-6 space-y-4">
							{/* Informações Básicas */}
							<div className="rounded-xl bg-white/5 p-4 border border-white/10">
								<h2 className="text-sm font-semibold text-foreground/80 mb-3">
									Informações Básicas
								</h2>
								<div className="space-y-2 text-sm">
									<div className="flex items-start gap-2">
										<span className="text-muted-foreground min-w-[100px]">
											Data/Hora:
										</span>
										<span className="text-foreground">
											{timestamp.toLocaleString("pt-BR", {
												dateStyle: "full",
												timeStyle: "long",
											})}
										</span>
									</div>
									<div className="flex items-start gap-2">
										<span className="text-muted-foreground min-w-[100px]">
											Rota:
										</span>
										<span className="text-foreground font-mono text-xs break-all">
											{route || "/"}
										</span>
									</div>
									<div className="flex items-start gap-2">
										<span className="text-muted-foreground min-w-[100px]">
											URL:
										</span>
										<span className="text-foreground font-mono text-xs break-all">
											{url}
										</span>
									</div>
								</div>
							</div>

							{/* Mensagem do Erro */}
							<div className="rounded-xl bg-red-500/10 p-4 border border-red-500/20">
								<h2 className="text-sm font-semibold text-red-400 mb-2">
									Mensagem do Erro
								</h2>
								<p className="text-foreground font-mono text-sm">
									{error?.message || "Erro desconhecido"}
								</p>
							</div>

							{/* Stack Trace (Expandido) */}
							<div className="rounded-xl bg-white/5 p-4 border border-white/10">
								<button
									onClick={() => this.setState({ expanded: !expanded })}
									className="flex w-full items-center justify-between text-sm font-semibold text-foreground/80 hover:text-foreground transition-colors"
								>
									<span>Stack Trace</span>
									{expanded ? (
										<ChevronUp className="h-4 w-4" />
									) : (
										<ChevronDown className="h-4 w-4" />
									)}
								</button>
								<AnimatePresence>
									{expanded && (
										<motion.pre
											initial={{ height: 0, opacity: 0 }}
											animate={{ height: "auto", opacity: 1 }}
											exit={{ height: 0, opacity: 0 }}
											className="mt-3 overflow-auto rounded-lg bg-black/30 p-3 text-xs font-mono text-foreground/80 whitespace-pre-wrap break-all"
										>
											{error?.stack || "Stack trace não disponível"}
										</motion.pre>
									)}
								</AnimatePresence>
							</div>

							{/* Component Stack (Expandido) */}
							{this.state.componentStack && (
								<div className="rounded-xl bg-white/5 p-4 border border-white/10">
									<button
										onClick={() =>
											this.setState({ expanded: !this.state.expanded })
										}
										className="flex w-full items-center justify-between text-sm font-semibold text-foreground/80 hover:text-foreground transition-colors"
									>
										<span>Component Stack</span>
										{expanded ? (
											<ChevronUp className="h-4 w-4" />
										) : (
											<ChevronDown className="h-4 w-4" />
										)}
									</button>
									<AnimatePresence>
										{expanded && (
											<motion.pre
												initial={{ height: 0, opacity: 0 }}
												animate={{ height: "auto", opacity: 1 }}
												exit={{ height: 0, opacity: 0 }}
												className="mt-3 overflow-auto rounded-lg bg-black/30 p-3 text-xs font-mono text-foreground/80 whitespace-pre-wrap break-all"
											>
												{this.state.componentStack}
											</motion.pre>
										)}
									</AnimatePresence>
								</div>
							)}

							{/* User Agent */}
							<div className="rounded-xl bg-white/5 p-4 border border-white/10">
								<h2 className="text-sm font-semibold text-foreground/80 mb-2">
									User Agent
								</h2>
								<p className="text-muted-foreground font-mono text-xs break-all">
									{this.state.userAgent}
								</p>
							</div>
						</div>

						{/* Actions */}
						<div className="flex items-center gap-3 border-t border-white/10 p-6">
							<button
								onClick={this.handleCopy}
								className={cn(
									"flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all",
									copied
										? "bg-green-500/20 text-green-400 border border-green-500/30"
										: "bg-white/10 text-foreground hover:bg-white/20 border border-white/10",
								)}
							>
								{copied ? (
									<>
										<Check className="h-4 w-4" />
										Copiado!
									</>
								) : (
									<Copy className="h-4 w-4" />
								)}
							</button>
							<button
								onClick={this.handleReset}
								className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary/20 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/30 transition-all border border-primary/30"
							>
								Tentar Novamente
							</button>
							<button
								onClick={this.handleReload}
								className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all"
							>
								<RefreshCw className="h-4 w-4" />
							</button>
						</div>
					</motion.div>
				</div>
			);
		}

		return this.props.children;
	}
}
