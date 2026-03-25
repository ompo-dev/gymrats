/**
 * Pagina de perfil do student.
 *
 * Arquitetura atual:
 * - sem props SSR de dados
 * - cache remoto hidratado no layout
 * - reconciliacao da UI feita pela bootstrap bridge de perfil
 */

"use client";

import { ProfilePageContent } from "./profile-content";

export function ProfilePage() {
  return <ProfilePageContent />;
}
