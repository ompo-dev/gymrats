/**
 * Página Principal do Student
 *
 * Arquitetura Offline-First:
 * - Não faz server-side fetching (dados vêm do store via useStudentInitializer)
 * - useStudentInitializer carrega todos os dados automaticamente no layout
 * - Componente usa apenas dados do store unificado (Zustand + IndexedDB)
 * - Funciona offline com dados em cache
 */

import StudentHome from "./page-content";

export default function StudentPage() {
	// Não fazemos server-side fetching aqui!
	// Todos os dados são carregados automaticamente pelo useStudentInitializer
	// no layout e ficam disponíveis no store unificado.
	// Isso permite:
	// - Offline-first (dados em cache)
	// - Performance (dados já carregados)
	// - Sincronização automática

	return <StudentHome />;
}
