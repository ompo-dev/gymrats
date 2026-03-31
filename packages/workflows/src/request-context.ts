import type { UserRole } from "@gymrats/access-control";

export interface AuthenticatedRequestUser {
  id: string;
  role: UserRole;
  studentId?: string | null;
  personalId?: string | null;
  gymIds?: string[];
}

export interface RequestContext {
  requestId?: string;
  origin?: string;
  user?: AuthenticatedRequestUser | null;
}
