/**
 * Página de Perfil do Student
 *
 * Arquitetura Offline-First:
 * - Não recebe props SSR (dados vêm do store)
 * - Componente usa apenas dados do store unificado (Zustand + IndexedDB)
 * - Funciona offline com dados em cache
 * - Sincronização automática via syncManager
 */

"use client";

import { ProfilePageContent } from "./profile-content";

export function ProfilePage() {
	// Não recebe mais props SSR!
	// Todos os dados são carregados automaticamente pelo useStudentInitializer
	// no layout e ficam disponíveis no store unificado.
	// Isso permite:
	// - Offline-first (dados em cache)
	// - Performance (dados já carregados)
	// - Sincronização automática

	return <ProfilePageContent />;
}
