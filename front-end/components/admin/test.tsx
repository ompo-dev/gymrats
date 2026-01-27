"use client";

import { AdminOnly } from "./admin-only";

/**
 * Componente Test - Apenas renderiza se o usuário for admin
 * 
 * @example
 * <Test>
 *   <div>Conteúdo apenas para admin</div>
 * </Test>
 */
export function Test({ children }: { children: React.ReactNode }) {
  return (
    <AdminOnly
      fallback={
        <div className="p-4 text-center">
          <p className="text-gray-600">
            Este componente está disponível apenas para administradores durante a versão beta.
          </p>
        </div>
      }
    >
      {children}
    </AdminOnly>
  );
}

