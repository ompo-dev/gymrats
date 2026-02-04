/**
 * Provider para Inicialização Automática dos Dados do Student
 *
 * Este provider verifica se há uma sessão válida e carrega automaticamente
 * todos os dados do student quando o app é carregado ou refreshado.
 *
 * Uso: Adicionar no root layout ou em um layout específico do student
 */

"use client";

import type { ReactNode } from "react";
import { useStudentInitializer } from "@/hooks/use-student-initializer";

interface StudentDataProviderProps {
	children: ReactNode;
	/**
	 * Se true, mostra uma tela de loading enquanto os dados estão sendo carregados
	 * @default false
	 */
	showLoadingWhileInitializing?: boolean;
	/**
	 * Componente customizado para mostrar durante o carregamento
	 */
	loadingComponent?: ReactNode;
}

/**
 * Provider que inicializa automaticamente os dados do student
 * quando há uma sessão válida
 */
export function StudentDataProvider({
	children,
	showLoadingWhileInitializing = false,
	loadingComponent,
}: StudentDataProviderProps) {
	const { isInitializing, isLoading, hasError } = useStudentInitializer({
		autoLoad: true,
		onLoadError: (error) => {
			console.error("[StudentDataProvider] Erro ao inicializar dados:", error);
		},
	});

	// Se configurado para mostrar loading, exibir durante inicialização
	if (showLoadingWhileInitializing && (isInitializing || isLoading)) {
		return (
			<>
				{loadingComponent || (
					<div className="min-h-screen flex items-center justify-center bg-white">
						<div className="text-center">
							<div className="w-12 h-12 border-4 border-[#58CC02] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
							<p className="text-gray-600 font-medium">Carregando dados...</p>
						</div>
					</div>
				)}
			</>
		);
	}

	// Renderizar children normalmente (dados carregam em background)
	return <>{children}</>;
}
