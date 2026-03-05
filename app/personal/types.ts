/**
 * Tipos compartilhados do módulo Personal.
 * Usados por page-content, _students, _gyms, _financial, _settings e organisms.
 */

export interface PersonalProfile {
  id: string;
  name: string;
  email: string;
  bio?: string | null;
  phone?: string | null;
  atendimentoPresencial?: boolean;
  atendimentoRemoto?: boolean;
}

export interface PersonalAffiliation {
  id: string;
  gym: {
    id: string;
    name: string;
    image?: string | null;
    logo?: string | null;
  };
}

export interface PersonalStudentAssignment {
  id: string;
  student: {
    id: string;
    user?: { id: string; name?: string | null; email?: string | null } | null;
  };
  gym?: { id: string; name: string } | null;
}

export interface PersonalSubscriptionData {
  id: string;
  plan: string;
  status: string;
  basePrice?: number;
  effectivePrice?: number | null;
  discountPercent?: number | null;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: Date | null;
}
