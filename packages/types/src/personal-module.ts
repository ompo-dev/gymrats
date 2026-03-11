export interface PersonalProfile {
  id: string;
  name: string;
  email: string;
  bio?: string | null;
  phone?: string | null;
  address?: string | null;
  cref?: string | null;
  pixKey?: string | null;
  pixKeyType?: string | null;
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
    avatar?: string | null;
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

export interface PersonalMembershipPlan {
  id: string;
  personalId: string;
  name: string;
  description?: string | null;
  type: string;
  price: number;
  duration: number;
  benefits?: string[] | string | null;
  isActive: boolean;
}
