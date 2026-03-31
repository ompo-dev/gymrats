import type { Page } from "@playwright/test";
import { createBootstrapMeta, createMockSessionPayload } from "./auth";

const gymDashboardBootstrap = {
  profile: {
    id: "gym-profile-1",
    name: "GymRats Paulista",
    email: "contato@gymrats.local",
    plan: "premium",
    address: "Av. Paulista, 900 - São Paulo",
    phone: "(11) 4002-8922",
    cnpj: "12.345.678/0001-99",
    pixKeyType: "EMAIL",
    pixKey: "financeiro@gymrats.local",
    openingHours: {
      days: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ],
      open: "06:00",
      close: "22:00",
      byDay: {
        friday: {
          open: "06:00",
          close: "21:00",
        },
        saturday: {
          open: "08:00",
          close: "14:00",
        },
      },
    },
    totalStudents: 164,
    activeStudents: 139,
    equipmentCount: 48,
    createdAt: new Date("2024-01-10T00:00:00.000Z").toISOString(),
    gamification: {
      level: 12,
      xp: 3480,
      xpToNextLevel: 520,
      currentStreak: 21,
      longestStreak: 46,
      monthlyStudentGoal: 180,
      avgStudentFrequency: 4.7,
      equipmentUtilization: 78,
      ranking: 3,
      achievements: [
        {
          id: "achievement-1",
          title: "Comunidade Ativa",
          description: "Mantenha 150 alunos ativos no mes.",
          icon: "🏆",
          unlockedAt: new Date("2026-03-10T00:00:00.000Z").toISOString(),
          progress: 150,
          target: 150,
          category: "special",
          color: "#50D5A1",
        },
        {
          id: "achievement-2",
          title: "Academia em Chamas",
          description: "Mantenha 30 dias seguidos de check-ins.",
          icon: "🔥",
          progress: 21,
          target: 30,
          category: "streak",
          color: "#FF8A00",
        },
      ],
    },
  },
  stats: {
    today: {
      checkins: 48,
      peakHour: "18:00",
      activeStudents: 39,
      equipmentInUse: 11,
    },
    week: {
      newMembers: 6,
      totalCheckins: 298,
      avgDailyCheckins: 43,
    },
    month: {
      retentionRate: 88,
      topStudents: [
        {
          id: "student-1",
          name: "Ana Souza",
          avatar: "/placeholder.svg",
          totalVisits: 20,
          attendanceRate: 92,
        },
        {
          id: "student-2",
          name: "Marcos Lima",
          avatar: "/placeholder.svg",
          totalVisits: 17,
          attendanceRate: 87,
        },
      ],
    },
  },
  students: [
    {
      id: "student-1",
      name: "Ana Souza",
      email: "ana@gymrats.local",
      avatar: "/placeholder.svg",
      membershipStatus: "active",
      currentStreak: 18,
      attendanceRate: 92,
      totalVisits: 28,
      currentWeight: 62,
      assignedTrainer: "Rafa Moreira",
    },
    {
      id: "student-2",
      name: "Marcos Lima",
      email: "marcos@gymrats.local",
      avatar: "/placeholder.svg",
      membershipStatus: "inactive",
      currentStreak: 4,
      attendanceRate: 87,
      totalVisits: 24,
      currentWeight: 84,
    },
  ],
  membershipPlans: [
    {
      id: "plan-1",
      name: "Plano Mensal",
      type: "monthly",
      price: 12990,
      duration: 30,
      benefits: ["Acesso livre", "Check-in rápido"],
      isActive: true,
    },
  ],
  financialSummary: {
    totalRevenue: 42850,
    totalExpenses: 12400,
    netProfit: 30450,
    monthlyRecurring: 38200,
    pendingPayments: 2500,
    overduePayments: 1200,
    averageTicket: 120,
    churnRate: 2,
    revenueGrowth: 15,
  },
  payments: [
    {
      id: "payment-1",
      studentId: "student-1",
      studentName: "Ana Souza",
      planId: "plan-1",
      planName: "Plano Mensal",
      amount: 129.9,
      date: new Date().toISOString(),
      dueDate: new Date().toISOString(),
      status: "paid",
      paymentMethod: "pix",
    },
    {
      id: "payment-2",
      studentId: "student-2",
      studentName: "Marcos Lima",
      planId: "plan-1",
      planName: "Plano Mensal",
      amount: 129.9,
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: "pending",
      paymentMethod: "credit-card",
    },
  ],
  expenses: [
    {
      id: "expense-1",
      type: "rent",
      description: "Aluguel da unidade principal",
      amount: 4200,
      date: new Date().toISOString(),
      category: "Infraestrutura",
    },
  ],
  coupons: [
    {
      id: "coupon-1",
      code: "PROMO20",
      type: "percentage",
      value: 20,
      maxUses: 100,
      currentUses: 24,
      expiryDate: new Date(
        Date.now() + 20 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      isActive: true,
    },
  ],
  campaigns: [
    {
      id: "campaign-1",
      gymId: "gym-profile-1",
      title: "Open Week",
      description: "Semana promocional para novas matrículas.",
      primaryColor: "#E2FF38",
      durationHours: 24,
      amountCents: 6000,
      status: "active",
      clicks: 37,
      impressions: 840,
      radiusKm: 5,
      linkedCouponId: "coupon-1",
      linkedPlanId: "plan-1",
      abacatePayBillingId: "billing-1",
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  balanceWithdraws: {
    balanceReais: 2450.75,
    balanceCents: 245075,
    withdraws: [
      {
        id: "withdraw-1",
        amount: 500,
        pixKey: "academia@gymrats.local",
        pixKeyType: "EMAIL",
        externalId: "pix-1",
        status: "completed",
        createdAt: new Date(
          Date.now() - 3 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        completedAt: new Date(
          Date.now() - 2 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      },
    ],
  },
  equipment: [
    {
      id: "equipment-1",
      name: "Bike Indoor 07",
      type: "Cardio",
      brand: "Movement",
      model: "MX7",
      serialNumber: "BIKE-007",
      status: "in-use",
      currentUser: {
        studentId: "student-1",
        studentName: "Ana Souza",
        startTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      },
      usageStats: {
        totalUses: 84,
        avgUsageTime: 27,
        popularTimes: ["07:00", "18:00"],
      },
      maintenanceHistory: [],
      nextMaintenance: new Date(
        Date.now() + 14 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    },
    {
      id: "equipment-2",
      name: "Leg Press 45",
      type: "Força",
      brand: "Lion",
      model: "LP45",
      serialNumber: "LP-045",
      status: "maintenance",
      usageStats: {
        totalUses: 65,
        avgUsageTime: 21,
        popularTimes: ["12:00", "19:00"],
      },
      maintenanceHistory: [],
      nextMaintenance: new Date(
        Date.now() + 5 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    },
    {
      id: "equipment-3",
      name: "Supino Inclinado",
      type: "Força",
      brand: "Technogym",
      model: "Selection 900",
      serialNumber: "SUP-900",
      status: "available",
      usageStats: {
        totalUses: 112,
        avgUsageTime: 16,
        popularTimes: ["09:00", "17:00"],
      },
      maintenanceHistory: [],
    },
  ],
  recentCheckIns: [
    {
      id: "checkin-1",
      studentId: "student-1",
      studentName: "Ana Souza",
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    {
      id: "checkin-2",
      studentId: "student-2",
      studentName: "Marcos Lima",
      timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    },
  ],
  subscription: {
    id: "subscription-1",
    plan: "premium",
    status: "active",
    basePrice: 199,
    pricePerStudent: 2.5,
    pricePerPersonal: 0,
    currentPeriodStart: "2026-03-01T00:00:00.000Z",
    currentPeriodEnd: "2026-04-20T00:00:00.000Z",
    cancelAtPeriodEnd: false,
    canceledAt: null,
    trialStart: null,
    trialEnd: null,
    isTrial: false,
    daysRemaining: 7,
    activeStudents: 164,
    activePersonals: 0,
    totalAmount: 609,
    billingPeriod: "monthly",
  },
};

const personalDashboardBootstrap = {
  profile: {
    id: "personal-profile-1",
    name: "Rafa Moreira",
    email: "rafa@gymrats.local",
    phone: "(11) 99999-0001",
    bio: "Personal focado em hipertrofia e acompanhamento de longo prazo.",
    address: "Rua dos Atletas, 45 - São Paulo",
    cref: "123456-G/SP",
    pixKeyType: "EMAIL",
    pixKey: "rafa@gymrats.local",
    atendimentoPresencial: true,
    atendimentoRemoto: true,
  },
  affiliations: [
    {
      id: "affiliation-1",
      gym: {
        id: "gym-1",
        name: "GymRats Paulista",
        logo: "/placeholder.svg",
      },
    },
    {
      id: "affiliation-2",
      gym: {
        id: "gym-2",
        name: "Arena Norte",
        image: "/placeholder.svg",
      },
    },
  ],
  students: [
    {
      id: "assignment-1",
      student: {
        id: "student-1",
        user: {
          id: "user-1",
          name: "Ana Souza",
          email: "ana@gymrats.local",
        },
      },
      gym: {
        id: "gym-1",
        name: "GymRats Paulista",
      },
    },
    {
      id: "assignment-2",
      student: {
        id: "student-2",
        user: {
          id: "user-2",
          name: "Marcos Lima",
          email: "marcos@gymrats.local",
        },
      },
    },
  ],
  studentDirectory: [
    {
      id: "student-1",
      name: "Ana Souza",
      email: "ana@gymrats.local",
      avatar: "/placeholder.svg",
      membershipStatus: "active",
      currentStreak: 18,
      attendanceRate: 92,
      totalVisits: 46,
      currentWeight: 62,
      gymMembership: {
        gymId: "gym-1",
        gymName: "GymRats Paulista",
      },
    },
    {
      id: "student-2",
      name: "Marcos Lima",
      email: "marcos@gymrats.local",
      avatar: "/placeholder.svg",
      membershipStatus: "inactive",
      currentStreak: 4,
      attendanceRate: 55,
      totalVisits: 12,
      currentWeight: 84,
    },
  ],
  subscription: {
    id: "subscription-1",
    plan: "premium",
    status: "active",
    currentPeriodEnd: "2026-04-20T00:00:00.000Z",
  },
  financialSummary: {
    totalRevenue: 12450,
    totalExpenses: 3180,
    netProfit: 9270,
    monthlyRecurring: 9800,
    pendingPayments: 640,
    overduePayments: 280,
    averageTicket: 196,
    churnRate: 4,
    revenueGrowth: 11,
  },
  payments: [
    {
      id: "personal-payment-1",
      studentId: "student-1",
      studentName: "Ana Souza",
      planId: "personal-plan-1",
      planName: "Consultoria Premium",
      amount: 249.9,
      date: new Date().toISOString(),
      dueDate: new Date().toISOString(),
      status: "paid",
      paymentMethod: "pix",
    },
    {
      id: "personal-payment-2",
      studentId: "student-2",
      studentName: "Marcos Lima",
      planId: "personal-plan-1",
      planName: "Consultoria Premium",
      amount: 199.9,
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: "pending",
      paymentMethod: "credit-card",
    },
  ],
  expenses: [
    {
      id: "personal-expense-1",
      type: "other",
      description: "Ferramentas e assinatura de gestão",
      amount: 320,
      date: new Date().toISOString(),
      category: "Software",
    },
  ],
  coupons: [
    {
      id: "personal-coupon-1",
      code: "PERSONAL10",
      type: "percentage",
      value: 10,
      maxUses: 50,
      currentUses: 12,
      expiryDate: new Date(
        Date.now() + 10 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      isActive: true,
    },
  ],
  campaigns: [
    {
      id: "personal-campaign-1",
      gymId: null,
      personalId: "personal-profile-1",
      title: "Avaliação Grátis",
      description: "Impulsione seu perfil na região com uma oferta inicial.",
      primaryColor: "#50D5A1",
      durationHours: 24,
      amountCents: 6000,
      status: "active",
      clicks: 18,
      impressions: 320,
      radiusKm: 5,
      linkedCouponId: "personal-coupon-1",
      linkedPlanId: "personal-plan-1",
      abacatePayBillingId: "billing-personal-1",
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  membershipPlans: [
    {
      id: "personal-plan-1",
      personalId: "personal-profile-1",
      name: "Consultoria Premium",
      description: "Plano de acompanhamento semanal",
      type: "monthly",
      price: 249.9,
      duration: 30,
      benefits: ["Treino", "Ajustes semanais"],
      isActive: true,
    },
  ],
};

const studentHomeBootstrap = {
  progress: {
    currentStreak: 7,
    longestStreak: 18,
    totalXP: 1340,
    todayXP: 120,
    currentLevel: 8,
    xpToNextLevel: 60,
    workoutsCompleted: 58,
  },
  user: {
    id: "student-e2e-user",
    name: "E2E Student",
    email: "student@gymrats.local",
  },
  gymLocations: [],
  dayPasses: [],
  memberships: [
    {
      id: "membership-student-1",
      gymId: "gym-profile-1",
      gymName: "GymRats Paulista",
      gymAddress: "Av. Paulista, 900 - Sao Paulo",
      planId: "plan-1",
      planName: "Plano Mensal",
      amount: 129.9,
      status: "active",
      autoRenew: true,
      startDate: new Date("2026-03-01T00:00:00.000Z").toISOString(),
      nextBillingDate: new Date("2026-04-01T00:00:00.000Z").toISOString(),
      paymentMethod: {
        brand: "Visa",
        last4: "4242",
      },
    },
  ],
  payments: [
    {
      id: "student-payment-1",
      gymId: "gym-profile-1",
      gymName: "GymRats Paulista",
      planName: "Plano Mensal",
      amount: 129.9,
      status: "pending",
      dueDate: new Date("2026-04-01T00:00:00.000Z").toISOString(),
      date: new Date("2026-03-25T00:00:00.000Z").toISOString(),
    },
  ],
  workoutHistory: [],
  weightHistory: [
    {
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      weight: 77.8,
    },
    {
      date: new Date().toISOString(),
      weight: 78.4,
    },
  ],
  weightGain: 0.6,
  profile: {
    id: "student-profile-1",
    weight: 78.4,
    hasWeightLossGoal: false,
  },
  subscription: {
    id: "student-subscription-1",
    plan: "premium",
    status: "active",
    currentPeriodStart: new Date("2026-03-01T00:00:00.000Z").toISOString(),
    currentPeriodEnd: new Date("2026-04-01T00:00:00.000Z").toISOString(),
    cancelAtPeriodEnd: false,
    canceledAt: null,
    trialStart: null,
    trialEnd: null,
    isTrial: false,
    daysRemaining: 7,
  },
  paymentMethods: [],
  referral: {
    referralCode: "STUDENT5",
    pixKey: null,
    pixKeyType: null,
    balanceCents: 0,
    totalEarnedCents: 0,
    withdraws: [],
  },
  personalRecords: [],
  units: [],
  weeklyPlan: null,
  dailyNutrition: {
    id: "daily-nutrition-1",
    date: new Date("2026-03-26T00:00:00.000Z").toISOString(),
    meals: [
      {
        id: "meal-breakfast",
        type: "cafe-da-manha",
        name: "Cafe da manha",
        time: "07:30",
        completed: true,
        calories: 420,
        protein: 28,
        carbs: 44,
        fats: 12,
        foods: [
          {
            id: "food-oats",
            name: "Aveia com banana",
            quantity: 1,
            unit: "porcao",
            calories: 280,
            protein: 8,
            carbs: 48,
            fats: 4,
          },
          {
            id: "food-yogurt",
            name: "Iogurte proteico",
            quantity: 1,
            unit: "unidade",
            calories: 140,
            protein: 20,
            carbs: 6,
            fats: 8,
          },
        ],
      },
      {
        id: "meal-lunch",
        type: "almoco",
        name: "Almoco",
        time: "12:30",
        completed: false,
        calories: 610,
        protein: 42,
        carbs: 58,
        fats: 18,
        foods: [
          {
            id: "food-chicken",
            name: "Frango grelhado",
            quantity: 180,
            unit: "g",
            calories: 300,
            protein: 38,
            carbs: 0,
            fats: 12,
          },
          {
            id: "food-rice",
            name: "Arroz integral",
            quantity: 150,
            unit: "g",
            calories: 210,
            protein: 4,
            carbs: 44,
            fats: 2,
          },
          {
            id: "food-salad",
            name: "Salada verde",
            quantity: 1,
            unit: "prato",
            calories: 100,
            protein: 0,
            carbs: 14,
            fats: 4,
          },
        ],
      },
    ],
    waterIntake: 1000,
    targetWater: 3000,
    totalCalories: 1030,
    totalProtein: 70,
    totalCarbs: 102,
    totalFats: 30,
    targetCalories: 2200,
    targetProtein: 160,
    targetCarbs: 240,
    targetFats: 70,
  },
  isAdmin: false,
  role: "STUDENT",
};

async function mockSessionRoute(
  page: Page,
  role: "GYM" | "PERSONAL" | "STUDENT" | "ADMIN",
) {
  const sessionPayload = createMockSessionPayload(role);

  await page.addInitScript((payload) => {
    const runtimeWindow = window as Window & {
      __GYMRATS_NATIVE_AUTH_ACTIVE__?: boolean;
    };

    runtimeWindow.__GYMRATS_NATIVE_AUTH_ACTIVE__ = true;
    window.localStorage.setItem("isAuthenticated", "true");
    window.localStorage.setItem("userId", payload.user.id);
    window.localStorage.setItem("userRole", payload.user.role);
    window.document.cookie = `better-auth.session_token=${encodeURIComponent(payload.session.token)}; path=/`;
  }, sessionPayload);

  await page.route("**/api/auth/session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(sessionPayload),
    });
  });
}

async function mockSharedClientRoutes(page: Page) {
  await page.route("**/api/gyms/list", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        gyms: [],
        activeGymId: null,
        canCreateMultipleGyms: false,
      }),
    });
  });
}

async function mockStudentDiscoveryRoutes(page: Page) {
  await page.route("**/api/students/personals", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        personals: [
          {
            id: "assignment-1",
            personal: {
              id: "personal-profile-1",
              name: "Rafa Moreira",
              email: "rafa@gymrats.local",
              avatar: "/placeholder.svg",
            },
            gym: {
              id: "gym-profile-1",
              name: "GymRats Paulista",
            },
          },
        ],
      }),
    });
  });

  await page.route("**/api/students/personals/nearby**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        personals: [],
      }),
    });
  });

  await page.route("**/api/foods/search**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        foods: [
          {
            id: "food-oats",
            name: "Aveia com banana",
            quantity: 1,
            unit: "porcao",
            calories: 280,
            protein: 8,
            carbs: 48,
            fats: 4,
          },
          {
            id: "food-chicken",
            name: "Frango grelhado",
            quantity: 180,
            unit: "g",
            calories: 300,
            protein: 38,
            carbs: 0,
            fats: 12,
          },
        ],
      }),
    });
  });
}

async function mockBootstrapRoute(
  page: Page,
  urlPattern: string,
  strategy: string,
  data: unknown,
) {
  await page.route(urlPattern, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data,
        meta: createBootstrapMeta(strategy),
      }),
    });
  });
}

async function mockGymDirectoryRoutes(page: Page) {
  await page.route("**/api/gym/personals", async (route) => {
    const method = route.request().method();

    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          personals: [
            {
              id: "team-personal-1",
              personal: {
                id: "personal-profile-1",
                name: "Rafa Moreira",
                email: "rafa@gymrats.local",
                avatar: "/placeholder.svg",
              },
            },
          ],
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });

  await page.route("**/api/gym/personals/search**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        personals: [
          {
            id: "personal-profile-1",
            name: "Rafa Moreira",
            email: "rafa@gymrats.local",
            avatar: "/placeholder.svg",
            alreadyLinked: true,
          },
        ],
      }),
    });
  });

  await page.route("**/api/gym/personals/*/profile", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "personal-profile-1",
        name: "Rafa Moreira",
        avatar: "/placeholder.svg",
        bio: "Especialista em hipertrofia e atendimento híbrido.",
        atendimentoPresencial: true,
        atendimentoRemoto: true,
        email: "rafa@gymrats.local",
        phone: "(11) 99999-0001",
        cref: "123456-G/SP",
        gyms: [
          {
            id: "gym-profile-1",
            name: "GymRats Paulista",
            address: "Av. Paulista, 900 - São Paulo",
          },
        ],
        studentsCount: 18,
      }),
    });
  });
}

export async function mockGymDashboardRoutes(page: Page) {
  await mockSessionRoute(page, "GYM");
  await mockSharedClientRoutes(page);
  await mockGymDirectoryRoutes(page);
  await mockBootstrapRoute(
    page,
    "**/api/gyms/bootstrap**",
    "gym-bootstrap",
    gymDashboardBootstrap,
  );
}

export async function mockGymAdminRoutes(page: Page) {
  await mockSessionRoute(page, "ADMIN");
  await mockSharedClientRoutes(page);
  await mockGymDirectoryRoutes(page);
  await mockBootstrapRoute(
    page,
    "**/api/gyms/bootstrap**",
    "gym-admin-bootstrap",
    gymDashboardBootstrap,
  );
}

export async function mockPersonalDashboardRoutes(page: Page) {
  await mockSessionRoute(page, "PERSONAL");
  await mockSharedClientRoutes(page);
  await mockBootstrapRoute(
    page,
    "**/api/personals/bootstrap**",
    "personal-bootstrap",
    personalDashboardBootstrap,
  );
}

export async function mockStudentHomeRoutes(page: Page) {
  await mockSessionRoute(page, "STUDENT");
  await mockSharedClientRoutes(page);
  await mockStudentDiscoveryRoutes(page);
  await mockBootstrapRoute(
    page,
    "**/api/students/bootstrap**",
    "student-bootstrap",
    studentHomeBootstrap,
  );
}
