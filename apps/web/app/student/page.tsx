/**
 * Página Principal do Student
 *
 * Arquitetura Offline-First:
 * - O layout hidrata o bootstrap no cache do React Query
 * - As bootstrap bridges reconciliam o Zustand com os dados remotos
 * - O componente consome apenas o estado unificado da UI
 * - Funciona offline com dados em cache
 */

import StudentHome from "./page-content";

export default function StudentPage() {
  // Esta página delega o carregamento ao layout + bootstrap bridge.
  // Aqui só renderizamos a superfície client consumindo o store unificado.

  return <StudentHome />;
}
