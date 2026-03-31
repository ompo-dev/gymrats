export type DiscoveryGymProfileVariant = "student" | "personal";

export interface DiscoveryGymEquipmentItem {
  id: string;
  name: string;
  type: string;
  status: string;
}

export interface DiscoveryGymPlan {
  id: string;
  name: string;
  type: string;
  price: number;
  duration: number;
  benefits?: string[];
}

export interface DiscoveryGymPersonal {
  id: string;
  name: string;
  avatar: string | null;
}

export interface DiscoveryGymMembership {
  id: string;
  status: string;
  planId: string | null;
}

export interface DiscoveryGymProfile {
  id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  logo?: string;
  photos?: string[];
  rating: number;
  totalReviews: number;
  openingHours?: {
    open?: string;
    close?: string;
  };
  amenities: string[];
  equipmentCount: number;
  totalStudents: number;
  activeStudents: number;
  equipment: DiscoveryGymEquipmentItem[];
  plans: DiscoveryGymPlan[];
  myMembership?: DiscoveryGymMembership | null;
  personals?: DiscoveryGymPersonal[];
}

export interface DiscoveryPersonalGym {
  id: string;
  name: string;
  address?: string;
  logo?: string | null;
  image?: string | null;
}

export interface DiscoveryPersonalPlan {
  id: string;
  name: string;
  type: string;
  price: number;
  duration: number;
  benefits?: string[];
}

export interface DiscoveryPersonalAssignment {
  id: string;
  status: string;
  activePlan?: {
    id: string;
    name: string;
    type: string;
    price: number;
    duration: number;
  } | null;
}

export interface DiscoveryPersonalProfile {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  atendimentoPresencial: boolean;
  atendimentoRemoto: boolean;
  gyms: DiscoveryPersonalGym[];
  plans: DiscoveryPersonalPlan[];
  isSubscribed: boolean;
  myAssignment?: DiscoveryPersonalAssignment | null;
  studentsCount?: number;
}
