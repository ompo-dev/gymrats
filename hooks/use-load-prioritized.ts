/**
 * Hook para Carregamento Prioritizado de Dados
 * 
 * Este hook permite definir dinamicamente quais seções de dados devem ser
 * carregadas primeiro, baseado no contexto (página, componente, etc).
 * 
 * Sistema funciona com search params via nuqs:
 * - Rota base: /student
 * - Páginas: ?tab=learn, ?tab=diet, ?tab=profile, etc.
 * 
 * Funcionalidades:
 * - Detecção automática de contexto baseado na rota/tab
 * - Priorização dinâmica por contexto
 * - Verificação inteligente: se dados já existem no store, só carrega prioridades
 * - Carregamento incremental: store atualizado progressivamente
 */

"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useQueryState, parseAsString } from "nuqs";
import { useStudentUnifiedStore } from "@/stores/student-unified-store";
import type { StudentDataSection } from "@/lib/types/student-unified";

// ============================================
// TIPOS
// ============================================

export interface UseLoadPrioritizedOptions {
  /**
   * Contexto pré-definido (learn, diet, profile, payments, home, default)
   * Se não fornecido, será detectado automaticamente da rota
   */
  context?: ContextType;
  
  /**
   * Seções específicas para priorizar
   * Se fornecido, será usado em vez do contexto
   */
  sections?: StudentDataSection[];
  
  /**
   * Se true, combina seções fornecidas com prioridades do contexto
   * Se false, usa apenas as seções fornecidas
   */
  combineWithContext?: boolean;
  
  /**
   * Se true (padrão), carrega apenas prioridades (não carrega resto em background)
   * Se false, carrega prioridades primeiro e depois o resto
   * 
   * IMPORTANTE: Por padrão é true para evitar recarregar tudo ao navegar entre páginas.
   * O Zustand já tem os dados, só precisamos atualizar as prioridades.
   */
  onlyPriorities?: boolean;
}

type ContextType = "learn" | "diet" | "profile" | "payments" | "home" | "default";

// ============================================
// MAPEAMENTO DE CONTEXTOS E PRIORIDADES
// ============================================

const CONTEXT_PRIORITIES: Record<ContextType, StudentDataSection[]> = {
  learn: ["units", "progress", "workoutHistory"],
  diet: ["dailyNutrition", "progress"],
  profile: ["profile", "weightHistory", "progress", "personalRecords"],
  payments: ["subscription", "payments", "paymentMethods", "memberships"],
  home: ["progress", "workoutHistory", "profile", "units", "dailyNutrition"],
  default: ["progress", "units", "profile"],
};

// ============================================
// DETECÇÃO DE CONTEXTO
// ============================================

/**
 * Detecta contexto baseado na rota e tab param
 */
function detectContextFromPath(pathname: string, tab: string | null): ContextType {
  // Se tab está definido, usar ele
  if (tab && tab !== "home") {
    if (["learn", "diet", "profile", "payments"].includes(tab)) {
      return tab as ContextType;
    }
  }
  
  // Se está na rota /student sem tab ou tab=home
  if (pathname.includes("/student")) {
    if (!tab || tab === "home") {
      return "home";
    }
  }
  
  return "default";
}

// ============================================
// VERIFICAÇÃO DE DADOS EXISTENTES
// ============================================

/**
 * Verifica se uma seção já existe no store (não está vazia/initial)
 */
function hasSectionData(
  section: StudentDataSection,
  storeData: any
): boolean {
  switch (section) {
    case "user":
      return !!(storeData.user?.id);
    case "student":
      return !!(storeData.student?.id);
    case "progress":
      return !!(storeData.progress?.totalXP !== undefined);
    case "profile":
      return !!(storeData.profile?.height !== undefined || storeData.profile?.weight !== undefined);
    case "weightHistory":
      return !!(storeData.weightHistory && storeData.weightHistory.length > 0);
    case "units":
      return !!(storeData.units && storeData.units.length > 0);
    case "workoutHistory":
      return !!(storeData.workoutHistory && storeData.workoutHistory.length >= 0); // Array vazio é válido
    case "personalRecords":
      return !!(storeData.personalRecords && storeData.personalRecords.length >= 0);
    case "dailyNutrition":
      return !!(storeData.dailyNutrition?.date);
    case "subscription":
      return storeData.subscription !== null && storeData.subscription !== undefined;
    case "memberships":
      return !!(storeData.memberships && storeData.memberships.length >= 0);
    case "payments":
      return !!(storeData.payments && storeData.payments.length >= 0);
    case "paymentMethods":
      return !!(storeData.paymentMethods && storeData.paymentMethods.length >= 0);
    case "dayPasses":
      return !!(storeData.dayPasses && storeData.dayPasses.length >= 0);
    case "friends":
      return !!(storeData.friends);
    case "gymLocations":
      return !!(storeData.gymLocations && storeData.gymLocations.length >= 0);
    default:
      return false;
  }
}

/**
 * Filtra seções que precisam ser carregadas (que não existem no store)
 * NOTA: Esta função não é mais usada para prioridades, pois prioridades
 * sempre devem ser recarregadas (refetch) para garantir dados atualizados.
 * Mantida para uso futuro em outros contextos se necessário.
 */
function filterMissingSections(
  sections: StudentDataSection[],
  storeData: any
): StudentDataSection[] {
  return sections.filter((section) => !hasSectionData(section, storeData));
}

// ============================================
// HOOK PRINCIPAL
// ============================================

/**
 * Hook para carregamento prioritizado de dados
 * 
 * @example
 * // Detecção automática de contexto
 * useLoadPrioritized();
 * 
 * @example
 * // Contexto específico
 * useLoadPrioritized({ context: "learn" });
 * 
 * @example
 * // Seções específicas
 * useLoadPrioritized({ sections: ["units", "progress"] });
 * 
 * @example
 * // Apenas prioridades (não carrega resto)
 * useLoadPrioritized({ sections: ["units"], onlyPriorities: true });
 */
export function useLoadPrioritized(options: UseLoadPrioritizedOptions = {}) {
  const pathname = usePathname();
  const [tab] = useQueryState("tab", parseAsString.withDefault("home"));
  const loadAllPrioritized = useStudentUnifiedStore(
    (state) => state.loadAllPrioritized
  );
  
  // Usar seletores específicos para evitar re-renders desnecessários
  // Verificar apenas as seções que precisamos, não todo o store
  const getUser = useStudentUnifiedStore((state) => state.data.user);
  const getStudent = useStudentUnifiedStore((state) => state.data.student);
  const getProgress = useStudentUnifiedStore((state) => state.data.progress);
  const getProfile = useStudentUnifiedStore((state) => state.data.profile);
  const getWeightHistory = useStudentUnifiedStore((state) => state.data.weightHistory);
  const getUnits = useStudentUnifiedStore((state) => state.data.units);
  const getWorkoutHistory = useStudentUnifiedStore((state) => state.data.workoutHistory);
  const getPersonalRecords = useStudentUnifiedStore((state) => state.data.personalRecords);
  const getDailyNutrition = useStudentUnifiedStore((state) => state.data.dailyNutrition);
  const getSubscription = useStudentUnifiedStore((state) => state.data.subscription);
  const getMemberships = useStudentUnifiedStore((state) => state.data.memberships);
  const getPayments = useStudentUnifiedStore((state) => state.data.payments);
  const getPaymentMethods = useStudentUnifiedStore((state) => state.data.paymentMethods);
  const getDayPasses = useStudentUnifiedStore((state) => state.data.dayPasses);
  const getFriends = useStudentUnifiedStore((state) => state.data.friends);
  const getGymLocations = useStudentUnifiedStore((state) => state.data.gymLocations);
  
  // Criar objeto storeData apenas quando necessário (dentro do useEffect)
  const storeDataRef = useRef({
    user: getUser,
    student: getStudent,
    progress: getProgress,
    profile: getProfile,
    weightHistory: getWeightHistory,
    units: getUnits,
    workoutHistory: getWorkoutHistory,
    personalRecords: getPersonalRecords,
    dailyNutrition: getDailyNutrition,
    subscription: getSubscription,
    memberships: getMemberships,
    payments: getPayments,
    paymentMethods: getPaymentMethods,
    dayPasses: getDayPasses,
    friends: getFriends,
    gymLocations: getGymLocations,
  });
  
  // Atualizar ref quando dados mudarem
  storeDataRef.current = {
    user: getUser,
    student: getStudent,
    progress: getProgress,
    profile: getProfile,
    weightHistory: getWeightHistory,
    units: getUnits,
    workoutHistory: getWorkoutHistory,
    personalRecords: getPersonalRecords,
    dailyNutrition: getDailyNutrition,
    subscription: getSubscription,
    memberships: getMemberships,
    payments: getPayments,
    paymentMethods: getPaymentMethods,
    dayPasses: getDayPasses,
    friends: getFriends,
    gymLocations: getGymLocations,
  };
  
  // Ref para evitar múltiplas chamadas durante re-renders
  const hasCalledRef = useRef(false);
  const lastTabRef = useRef<string | null>(null);
  const lastPrioritiesRef = useRef<string>("");
  
  useEffect(() => {
    // Reset ref se tab mudou
    if (lastTabRef.current !== tab) {
      hasCalledRef.current = false;
      lastTabRef.current = tab;
      lastPrioritiesRef.current = "";
    }
    
    // Detectar contexto se não fornecido
    const detectedContext = options.context 
      ? options.context 
      : detectContextFromPath(pathname, tab);
    
    // Determinar prioridades
    let priorities: StudentDataSection[];
    
    if (options.sections) {
      if (options.combineWithContext && !options.context) {
        // Combinar seções fornecidas com prioridades do contexto detectado
        const contextPriorities = CONTEXT_PRIORITIES[detectedContext];
        priorities = [...new Set([...options.sections, ...contextPriorities])];
      } else if (options.context) {
        // Combinar com contexto específico fornecido
        const contextPriorities = CONTEXT_PRIORITIES[options.context];
        priorities = [...new Set([...options.sections, ...contextPriorities])];
      } else {
        // Usar apenas seções fornecidas
        priorities = options.sections;
      }
    } else {
      // Usar prioridades do contexto
      priorities = CONTEXT_PRIORITIES[detectedContext];
    }
    
    // Verificar se as prioridades mudaram
    const prioritiesKey = priorities.sort().join(",");
    if (lastPrioritiesRef.current === prioritiesKey && hasCalledRef.current) {
      return; // Mesmas prioridades, já chamou
    }
    lastPrioritiesRef.current = prioritiesKey;
    
    // IMPORTANTE: Prioridades SEMPRE devem ser recarregadas (refetch)
    // Mesmo que já existam no store, fazemos requisição para garantir dados atualizados
    // Isso garante sincronização e dados sempre frescos quando navegar entre páginas
    console.log(
      `[useLoadPrioritized] Carregando prioridades (refetch): ${priorities.join(", ")} (context: ${detectedContext})`
    );
    
    hasCalledRef.current = true;
    // IMPORTANTE: Por padrão, carregar APENAS prioridades (onlyPriorities = true)
    // Isso evita recarregar tudo quando navegar entre páginas
    // O Zustand já tem os dados, só precisamos atualizar as prioridades
    loadAllPrioritized(priorities, options.onlyPriorities ?? true)
      .then(() => {
        // Sucesso
      })
      .catch((error) => {
        console.error("[useLoadPrioritized] Erro ao carregar prioridades:", error);
        hasCalledRef.current = false; // Permitir retry em caso de erro
      });
  }, [
    pathname,
    tab,
    options.context,
    options.sections?.join(","),
    options.combineWithContext,
    options.onlyPriorities,
    loadAllPrioritized,
    // Não incluir storeData nas dependências para evitar loops
    // Usar ref dentro do effect
  ]);
}

// ============================================
// HOOKS SIMPLIFICADOS
// ============================================

/**
 * Hook simplificado para carregar prioridades de um contexto específico
 */
export function useLoadPrioritizedForContext(context: ContextType) {
  useLoadPrioritized({ context });
}

/**
 * Hook simplificado para carregar seções específicas
 */
export function useLoadPrioritizedSections(
  sections: StudentDataSection[],
  onlyPriorities = false
) {
  useLoadPrioritized({ sections, onlyPriorities });
}
