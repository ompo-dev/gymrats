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

export type PersonalActions = Pick<
  import("@/stores/personal-unified-store").PersonalUnifiedState,
  | "updateProfile"
  | "assignStudent"
  | "removeStudent"
  | "createExpense"
  | "createPersonalSubscription"
  | "cancelPersonalSubscription"
  | "hydrateInitial"
>;

export type PersonalLoaders = Pick<
  import("@/stores/personal-unified-store").PersonalUnifiedState,
  "loadAll" | "loadAllPrioritized" | "loadSection"
>;

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
