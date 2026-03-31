export type PersonalFilter = "all" | "subscribed" | "near" | "remote";

export interface StudentPersonalAssignment {
  id: string;
  personal: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  };
  gym: {
    id: string;
    name: string;
    image?: string | null;
    logo?: string | null;
  } | null;
}

export interface StudentPersonalListItem {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  atendimentoPresencial: boolean;
  atendimentoRemoto: boolean;
  distance: number | null;
  gyms: { id: string; name: string }[];
  isSubscribed: boolean;
}
