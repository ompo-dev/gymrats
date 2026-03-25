/**
 * Mapeamento de tipos de retorno por seletor do usePersonal.
 */

import type {
  PersonalAffiliation,
  PersonalProfile,
  PersonalStudentAssignment,
  PersonalSubscriptionData,
} from "@gymrats/types/personal-module";
import type { PersonalMetadata } from "@/lib/types/personal-unified";

export interface PersonalActions {
  updateProfile: (...args: unknown[]) => unknown;
  assignStudent: (...args: unknown[]) => unknown;
  removeStudent: (...args: unknown[]) => unknown;
  createExpense: (...args: unknown[]) => unknown;
  createPersonalSubscription: (...args: unknown[]) => unknown;
  cancelPersonalSubscription: (...args: unknown[]) => unknown;
  hydrateInitial: (...args: unknown[]) => unknown;
}

export interface PersonalLoaders {
  loadAll: (...args: unknown[]) => unknown;
  loadAllPrioritized: (...args: unknown[]) => unknown;
  loadSection: (...args: unknown[]) => unknown;
}

export interface PersonalSelectorReturnMap {
  profile: PersonalProfile | null;
  affiliations: PersonalAffiliation[];
  students: PersonalStudentAssignment[];
  subscription: PersonalSubscriptionData | null;
  metadata: PersonalMetadata;
  actions: PersonalActions;
  loaders: PersonalLoaders;
}

export type PersonalDataSelector = keyof PersonalSelectorReturnMap;

export type PersonalSelectorDataReturn<S extends PersonalDataSelector> =
  PersonalSelectorReturnMap[S];
