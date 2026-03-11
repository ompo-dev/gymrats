import type { UserRole } from "./types";

export interface AuthSessionContext {
  userId: string;
  role: UserRole;
  sessionToken?: string | null;
  studentId?: string | null;
  personalId?: string | null;
  gymIds?: string[];
}

export interface RouteAccessContext {
  requestId?: string;
  session?: AuthSessionContext | null;
}
