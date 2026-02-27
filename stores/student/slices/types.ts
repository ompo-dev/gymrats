/**
 * Tipos compartilhados para slices do student-unified-store.
 */

import type { StoreApi } from "zustand";
import type { StudentUnifiedState } from "@/stores/student-store.types";

export type StudentSetState = StoreApi<StudentUnifiedState>["setState"];
export type StudentGetState = StoreApi<StudentUnifiedState>["getState"];
