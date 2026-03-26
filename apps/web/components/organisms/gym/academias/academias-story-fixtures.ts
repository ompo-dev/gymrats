import type { GymData } from "@/stores/gyms-list-store";

export const activeGymFixture: GymData = {
  id: "gym-paulista",
  name: "GymRats Paulista",
  address: "Av. Paulista, 1500 - Bela Vista, Sao Paulo",
  email: "paulista@gymrats.test",
  phone: "(11) 99999-0001",
  plan: "premium",
  hasActiveSubscription: true,
  isActive: true,
  profile: {
    totalStudents: 420,
    activeStudents: 317,
    level: 12,
    xp: 14800,
    currentStreak: 18,
    longestStreak: 41,
  },
  stats: {
    todayCheckins: 186,
    todayActiveStudents: 141,
    weekTotalCheckins: 1120,
    monthTotalCheckins: 4518,
  },
};

export const trialGymFixture: GymData = {
  ...activeGymFixture,
  id: "gym-vila-mariana",
  name: "GymRats Vila Mariana",
  address: "Rua Domingos de Morais, 820 - Vila Mariana, Sao Paulo",
  email: "vilamariana@gymrats.test",
  plan: "basic",
  hasActiveSubscription: false,
  isActive: false,
};
