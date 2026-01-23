// Central export for all stores
export { useAuthStore } from "./auth-store";
export { useGymStore } from "./gym-store";
export { useGymsDataStore } from "./gyms-list-store";
export { useWorkoutStore } from "./workout-store";
export { useUIStore } from "./ui-store";
export { useEducationStore } from "./education-store";

// Store unificado para student (substitui student-store, nutrition-store, subscription-store)
export { useStudentUnifiedStore } from "./student-unified-store";

// DEPRECATED - Usar useStudent() hook em vez disso
// @deprecated Use useStudent() from "@/hooks/use-student" instead
// export { useStudentStore } from "./student-store"; // REMOVIDO
export { useNutritionStore } from "./nutrition-store"; // STUB TEMPORÁRIO - será removido após limpar cache

// Subscription store mantido apenas para Gym (student usa useStudent('subscription'))
export { useSubscriptionStore } from "./subscription-store";
