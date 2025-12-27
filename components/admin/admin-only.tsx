"use client";

import { ReactNode } from "react";
import { useStudent } from "@/hooks/use-student";

interface AdminOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Componente que só renderiza children se o usuário for admin
 * 
 * @example
 * <AdminOnly>
 *   <TestComponent />
 * </AdminOnly>
 * 
 * @example
 * <AdminOnly fallback={<p>Acesso negado</p>}>
 *   <TestComponent />
 * </AdminOnly>
 */
export function AdminOnly({ children, fallback = null }: AdminOnlyProps) {
  const { isAdmin, role } = useStudent("isAdmin", "role");
  
  // Verificar se é admin
  const userIsAdmin = isAdmin || role === "ADMIN";
  
  if (!userIsAdmin) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

