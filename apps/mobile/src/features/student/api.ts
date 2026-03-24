import type {
  BoostCampaign,
  DailyNutrition,
  GymProfileData,
  Meal,
  StudentBootstrapResponse,
  StudentHomeData,
  StudentPersonalAssignment,
  StudentPersonalDirectoryItem,
  StudentPersonalFilter,
  StudentPersonalProfile,
  StudentPixPayload,
  StudentReferralData,
  StudentWorkoutProgress,
  SubscriptionData,
  WeeklyPlanData,
  WorkoutExercise,
  WorkoutSession,
} from "./types";

const STUDENT_HOME_SECTIONS = [
  "user",
  "progress",
  "workoutHistory",
  "personalRecords",
  "profile",
  "weightHistory",
  "weeklyPlan",
  "libraryPlans",
  "units",
  "dailyNutrition",
  "subscription",
  "payments",
  "referral",
  "gymLocations",
  "memberships",
  "dayPasses",
];

type ApiErrorShape = {
  error?: string;
  message?: string;
};

async function parseError(response: Response) {
  try {
    const payload = (await response.json()) as ApiErrorShape;
    return payload.error || payload.message || "Erro inesperado";
  } catch {
    return "Erro inesperado";
  }
}

async function getJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return (await response.json()) as T;
}

function parseJsonArray(value: unknown) {
  if (!value || typeof value !== "string") {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function normalizeWorkoutExercise(
  payload: Record<string, unknown> | null | undefined,
): WorkoutExercise {
  return {
    id: typeof payload?.id === "string" ? payload.id : "",
    name: typeof payload?.name === "string" ? payload.name : "Exercicio",
    sets: typeof payload?.sets === "number" ? payload.sets : 3,
    reps: typeof payload?.reps === "string" ? payload.reps : "12",
    rest: typeof payload?.rest === "number" ? payload.rest : 60,
    notes: typeof payload?.notes === "string" ? payload.notes : undefined,
    videoUrl:
      typeof payload?.videoUrl === "string" ? payload.videoUrl : undefined,
    educationalId:
      typeof payload?.educationalId === "string"
        ? payload.educationalId
        : undefined,
    primaryMuscles: parseJsonArray(payload?.primaryMuscles),
    secondaryMuscles: parseJsonArray(payload?.secondaryMuscles),
    difficulty:
      payload?.difficulty === "iniciante" ||
      payload?.difficulty === "intermediario" ||
      payload?.difficulty === "avancado"
        ? payload.difficulty
        : undefined,
    equipment: parseJsonArray(payload?.equipment),
    instructions: parseJsonArray(payload?.instructions),
    tips: parseJsonArray(payload?.tips),
    commonMistakes: parseJsonArray(payload?.commonMistakes),
    benefits: parseJsonArray(payload?.benefits),
    scientificEvidence:
      typeof payload?.scientificEvidence === "string"
        ? payload.scientificEvidence
        : undefined,
  };
}

function normalizeWorkoutSession(
  payload: Record<string, unknown> | null | undefined,
): WorkoutSession {
  return {
    id: typeof payload?.id === "string" ? payload.id : "",
    title: typeof payload?.title === "string" ? payload.title : "Treino",
    description:
      typeof payload?.description === "string" ? payload.description : "",
    type:
      payload?.type === "strength" ||
      payload?.type === "cardio" ||
      payload?.type === "flexibility" ||
      payload?.type === "rest"
        ? payload.type
        : "strength",
    muscleGroup:
      typeof payload?.muscleGroup === "string"
        ? (payload.muscleGroup as WorkoutSession["muscleGroup"])
        : undefined,
    difficulty:
      payload?.difficulty === "iniciante" ||
      payload?.difficulty === "intermediario" ||
      payload?.difficulty === "avancado"
        ? payload.difficulty
        : undefined,
    xpReward:
      typeof payload?.xpReward === "number" ? payload.xpReward : undefined,
    estimatedTime:
      typeof payload?.estimatedTime === "number"
        ? payload.estimatedTime
        : undefined,
    order: typeof payload?.order === "number" ? payload.order : undefined,
    completed: Boolean(payload?.completed),
    locked: Boolean(payload?.locked),
    exercises: Array.isArray(payload?.exercises)
      ? payload.exercises.map((exercise) =>
          normalizeWorkoutExercise(exercise as Record<string, unknown>),
        )
      : [],
  };
}

function normalizeWeeklyPlan(
  payload: Record<string, unknown> | null | undefined,
): WeeklyPlanData | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  return {
    id: typeof payload.id === "string" ? payload.id : "",
    title:
      typeof payload.title === "string" ? payload.title : "Plano semanal",
    description:
      typeof payload.description === "string" ? payload.description : null,
    sourceLibraryPlanId:
      typeof payload.sourceLibraryPlanId === "string"
        ? payload.sourceLibraryPlanId
        : null,
    slots: Array.isArray(payload.slots)
      ? payload.slots.map((slot) => {
          const normalizedSlot = slot as Record<string, unknown>;
          const normalizedWorkout =
            normalizedSlot.type === "workout"
              ? normalizeWorkoutSession(
                  (normalizedSlot.workout as Record<string, unknown>) ?? null,
                )
              : undefined;

          return {
            id: typeof normalizedSlot.id === "string" ? normalizedSlot.id : "",
            dayOfWeek:
              typeof normalizedSlot.dayOfWeek === "number"
                ? normalizedSlot.dayOfWeek
                : 0,
            type: normalizedSlot.type === "workout" ? "workout" : "rest",
            workout:
              normalizedSlot.type === "workout" && normalizedWorkout
                ? normalizedWorkout
                : undefined,
            locked: Boolean(normalizedSlot.locked),
            completed: Boolean(normalizedSlot.completed),
            stars:
              typeof normalizedSlot.stars === "number"
                ? normalizedSlot.stars
                : undefined,
            completedAt:
              typeof normalizedSlot.completedAt === "string"
                ? normalizedSlot.completedAt
                : undefined,
          };
        })
      : [],
  };
}

function toApiMeals(meals: Meal[]) {
  return meals.map((meal, index) => ({
    name: meal.name || "Refeicao",
    type: meal.type || "snack",
    calories: meal.calories || 0,
    protein: meal.protein || 0,
    carbs: meal.carbs || 0,
    fats: meal.fats || 0,
    time: meal.time || null,
    completed: meal.completed || false,
    order: index,
    foods: (meal.foods || []).map((food) => ({
      foodId: food.foodId || null,
      foodName: food.foodName || "Alimento",
      servings: food.servings || 1,
      calories: food.calories || 0,
      protein: food.protein || 0,
      carbs: food.carbs || 0,
      fats: food.fats || 0,
      servingSize: food.servingSize || "100g",
    })),
  }));
}

function normalizeStudentHomeData(
  payload: StudentBootstrapResponse["data"] | undefined,
  campaigns: BoostCampaign[],
): StudentHomeData {
  return {
    user: payload?.user ?? null,
    progress: payload?.progress ?? null,
    profile: payload?.profile ?? null,
    weightHistory: Array.isArray(payload?.weightHistory)
      ? payload.weightHistory
      : [],
    workoutHistory: Array.isArray(payload?.workoutHistory)
      ? payload.workoutHistory
      : [],
    personalRecords: Array.isArray(payload?.personalRecords)
      ? payload.personalRecords
      : [],
    dailyNutrition: payload?.dailyNutrition ?? null,
    weeklyPlan: payload?.weeklyPlan ?? null,
    libraryPlans: Array.isArray((payload as StudentHomeData | undefined)?.libraryPlans)
      ? ((payload as StudentHomeData).libraryPlans ?? [])
      : [],
    units: Array.isArray(payload?.units) ? payload.units : [],
    subscription: payload?.subscription ?? null,
    payments: Array.isArray(payload?.payments) ? payload.payments : [],
    referral: payload?.referral ?? null,
    gymLocations: Array.isArray(payload?.gymLocations) ? payload.gymLocations : [],
    memberships: Array.isArray(payload?.memberships) ? payload.memberships : [],
    dayPasses: Array.isArray(payload?.dayPasses) ? payload.dayPasses : [],
    campaigns,
  };
}

export async function fetchStudentHomeData(options: {
  apiUrl: string;
  token: string;
}) {
  const sectionsQuery = encodeURIComponent(STUDENT_HOME_SECTIONS.join(","));
  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${options.token}`,
  };

  const [bootstrapResponse, campaignsResponse] = await Promise.allSettled([
    getJson<StudentBootstrapResponse>(
      `${options.apiUrl}/api/students/bootstrap?sections=${sectionsQuery}`,
      { headers },
    ),
    getJson<{ campaigns: BoostCampaign[] }>(
      `${options.apiUrl}/api/boost-campaigns/nearby`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    ),
  ]);

  if (bootstrapResponse.status !== "fulfilled") {
    throw bootstrapResponse.reason;
  }

  const campaigns =
    campaignsResponse.status === "fulfilled"
      ? campaignsResponse.value.campaigns ?? []
      : [];

  return normalizeStudentHomeData(bootstrapResponse.value.data, campaigns);
}

export async function trackBoostCampaignImpression(
  apiUrl: string,
  campaignId: string,
) {
  await fetch(`${apiUrl}/api/boost-campaigns/${campaignId}/impression`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: "{}",
  });
}

export async function trackBoostCampaignClick(apiUrl: string, campaignId: string) {
  await fetch(`${apiUrl}/api/boost-campaigns/${campaignId}/click`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: "{}",
  });
}

export async function addStudentWeight(options: {
  apiUrl: string;
  token: string;
  weight: number;
  notes?: string;
}) {
  const response = await fetch(`${options.apiUrl}/api/students/weight`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${options.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      weight: options.weight,
      date: new Date().toISOString(),
      notes: options.notes ?? null,
    }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json();
}

export async function saveStudentDailyNutrition(options: {
  apiUrl: string;
  token: string;
  nutrition: DailyNutrition;
  syncPlan?: boolean;
}) {
  const response = await fetch(`${options.apiUrl}/api/nutrition/daily`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${options.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      date: options.nutrition.date,
      meals: toApiMeals(options.nutrition.meals),
      waterIntake: options.nutrition.waterIntake,
      targetWater: options.nutrition.targetWater,
      syncPlan: options.syncPlan ?? false,
    }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const payload = (await response.json()) as {
    data?: DailyNutrition;
  } & DailyNutrition;

  return payload.data ?? payload;
}

export async function getCurrentStudentSubscription(options: {
  apiUrl: string;
  token: string;
}) {
  return getJson<{
    success: boolean;
    subscription: SubscriptionData | null;
    isFirstPayment: boolean;
  }>(`${options.apiUrl}/api/subscriptions/current`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${options.token}`,
    },
  });
}

export async function startStudentTrial(options: {
  apiUrl: string;
  token: string;
}) {
  return getJson<{
    success?: boolean;
    message?: string;
    error?: string;
  }>(`${options.apiUrl}/api/subscriptions/start-trial`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${options.token}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
}

export async function createStudentSubscription(options: {
  apiUrl: string;
  token: string;
  plan: "monthly" | "annual";
  referralCode?: string | null;
}) {
  return getJson<{
    success?: boolean;
    pixId: string;
    brCode: string;
    brCodeBase64: string;
    amount: number;
    expiresAt?: string;
    canApplyReferral?: boolean;
    referralCodeInvalid?: boolean;
  }>(`${options.apiUrl}/api/subscriptions/create`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${options.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      plan: options.plan,
      referralCode: options.referralCode ?? null,
    }),
  });
}

export async function cancelStudentSubscription(options: {
  apiUrl: string;
  token: string;
}) {
  return getJson<{
    success?: boolean;
    subscription?: SubscriptionData;
    message?: string;
  }>(`${options.apiUrl}/api/subscriptions/cancel`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${options.token}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
}

export async function payStudentPayment(options: {
  apiUrl: string;
  token: string;
  paymentId: string;
}) {
  return getJson<{
    paymentId: string;
    brCode: string;
    brCodeBase64: string;
    amount: number;
    expiresAt?: string;
  }>(`${options.apiUrl}/api/students/payments/${options.paymentId}/pay-now`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${options.token}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
}

export async function cancelStudentPayment(options: {
  apiUrl: string;
  token: string;
  paymentId: string;
}) {
  return getJson<{ ok?: boolean }>(
    `${options.apiUrl}/api/payments/${options.paymentId}`,
    {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${options.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "canceled",
      }),
    },
  );
}

export async function getStudentPaymentStatus(options: {
  apiUrl: string;
  token: string;
  paymentId: string;
}) {
  return getJson<{ id: string; status: string }>(
    `${options.apiUrl}/api/payments/${options.paymentId}`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${options.token}`,
      },
    },
  );
}

export async function simulateStudentPayment(options: {
  apiUrl: string;
  token: string;
  paymentId: string;
}) {
  return getJson<{ success?: boolean; status?: string }>(
    `${options.apiUrl}/api/students/payments/${options.paymentId}/simulate-pix`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${options.token}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    },
  );
}

export async function simulateStudentSubscriptionPix(options: {
  apiUrl: string;
  token: string;
  pixId: string;
}) {
  return getJson<{ success?: boolean; status?: string }>(
    `${options.apiUrl}/api/subscriptions/simulate-pix?pixId=${encodeURIComponent(options.pixId)}`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${options.token}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    },
  );
}

export async function applyStudentSubscriptionReferral(options: {
  apiUrl: string;
  token: string;
  referralCode: string;
}) {
  return getJson<{
    pixId: string;
    brCode: string;
    brCodeBase64: string;
    amount: number;
    expiresAt?: string;
    originalAmount?: number;
    referralCodeInvalid?: boolean;
  }>(`${options.apiUrl}/api/subscriptions/apply-referral`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${options.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      referralCode: options.referralCode,
    }),
  });
}

export async function updateStudentReferralPixKey(options: {
  apiUrl: string;
  token: string;
  pixKey: string;
  pixKeyType: string;
}) {
  return getJson<{
    success?: boolean;
    pixKey: string;
    pixKeyType: string;
  }>(`${options.apiUrl}/api/students/referrals/pix-key`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${options.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pixKey: options.pixKey,
      pixKeyType: options.pixKeyType,
    }),
  });
}

export async function requestStudentReferralWithdraw(options: {
  apiUrl: string;
  token: string;
  amountCents: number;
}) {
  return getJson<{
    withdraw?: unknown;
  }>(`${options.apiUrl}/api/students/referrals/withdraw`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${options.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amountCents: options.amountCents,
    }),
  });
}

export async function fetchStudentReferral(options: {
  apiUrl: string;
  token: string;
}) {
  return getJson<StudentReferralData>(`${options.apiUrl}/api/students/referrals`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${options.token}`,
    },
  });
}

export async function fetchStudentGymProfile(options: {
  apiUrl: string;
  token: string;
  gymId: string;
}) {
  return getJson<GymProfileData>(
    `${options.apiUrl}/api/students/gyms/${options.gymId}/profile`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${options.token}`,
      },
    },
  );
}

export async function joinStudentGym(options: {
  apiUrl: string;
  token: string;
  gymId: string;
  planId: string;
  couponId?: string | null;
}) {
  return getJson<{
    paymentId: string;
    brCode: string;
    brCodeBase64: string;
    amount: number;
    expiresAt?: string;
    membershipId?: string;
    planName?: string;
    originalPrice?: number;
    appliedCoupon?: {
      code: string;
      discountString: string;
    };
  }>(`${options.apiUrl}/api/students/gyms/${options.gymId}/join`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${options.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      planId: options.planId,
      couponId: options.couponId ?? null,
    }),
  });
}

export async function changeStudentMembershipPlan(options: {
  apiUrl: string;
  token: string;
  membershipId: string;
  planId: string;
}) {
  return getJson<{
    paymentId: string;
    brCode: string;
    brCodeBase64: string;
    amount: number;
    expiresAt?: string;
    originalPrice?: number;
    appliedCoupon?: {
      code: string;
      discountString: string;
    };
  }>(
    `${options.apiUrl}/api/students/memberships/${options.membershipId}/change-plan`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${options.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        planId: options.planId,
      }),
    },
  );
}

export async function cancelStudentMembership(options: {
  apiUrl: string;
  token: string;
  membershipId: string;
}) {
  return getJson<{ success?: boolean }>(
    `${options.apiUrl}/api/students/memberships/${options.membershipId}/cancel`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${options.token}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    },
  );
}

export async function fetchStudentProfileStatus(options: {
  apiUrl: string;
  token: string;
}) {
  return getJson<{
    hasProfile: boolean;
    student?: {
      id: string;
      age?: number | null;
      gender?: string | null;
      isTrans?: boolean;
      usesHormones?: boolean;
      hormoneType?: string | null;
    } | null;
    profile?: {
      height?: number | null;
      weight?: number | null;
      fitnessLevel?: string | null;
      weeklyWorkoutFrequency?: number | null;
      workoutDuration?: number | null;
      goals?: string[];
      gymType?: string | null;
      preferredSets?: number | null;
      preferredRepRange?: string | null;
      restTime?: string | null;
      bmr?: number | null;
      tdee?: number | null;
      targetCalories?: number | null;
      targetProtein?: number | null;
      targetCarbs?: number | null;
      targetFats?: number | null;
      activityLevel?: number | null;
      hormoneTreatmentDuration?: number | null;
      physicalLimitations?: string[];
      motorLimitations?: string[];
      medicalConditions?: string[];
      limitationDetails?: Record<string, string | string[]> | null;
    } | null;
  }>(`${options.apiUrl}/api/students/profile`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${options.token}`,
    },
  });
}

export async function submitStudentOnboarding(options: {
  apiUrl: string;
  token: string;
  data: {
    age?: number | "";
    gender?: string;
    isTrans?: boolean;
    usesHormones?: boolean;
    hormoneType?: string;
    height?: number | "";
    weight?: number | "";
    fitnessLevel?: string;
    weeklyWorkoutFrequency?: number;
    workoutDuration?: number;
    goals?: string[];
    gymType?: string;
    preferredSets?: number;
    preferredRepRange?: string;
    restTime?: string;
    bmr?: number;
    tdee?: number;
    targetCalories?: number;
    targetProtein?: number;
    targetCarbs?: number;
    targetFats?: number;
    activityLevel?: number;
    hormoneTreatmentDuration?: number;
    physicalLimitations?: string[];
    motorLimitations?: string[];
    medicalConditions?: string[];
    limitationDetails?: Record<string, string | string[]>;
  };
}) {
  return getJson<{ success?: boolean; error?: string }>(
    `${options.apiUrl}/api/students/onboarding`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${options.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options.data),
    },
  );
}

export async function fetchStudentAssignedPersonals(options: {
  apiUrl: string;
  token: string;
}) {
  return getJson<{ personals: StudentPersonalAssignment[] }>(
    `${options.apiUrl}/api/students/personals`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${options.token}`,
      },
    },
  );
}

export async function fetchStudentPersonalDirectory(options: {
  apiUrl: string;
  token: string;
  filter: StudentPersonalFilter;
  lat?: number;
  lng?: number;
}) {
  const params = new URLSearchParams();
  params.set("filter", options.filter);

  if (typeof options.lat === "number") {
    params.set("lat", String(options.lat));
  }

  if (typeof options.lng === "number") {
    params.set("lng", String(options.lng));
  }

  return getJson<{ personals: StudentPersonalDirectoryItem[] }>(
    `${options.apiUrl}/api/students/personals/nearby?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${options.token}`,
      },
    },
  );
}

export async function fetchStudentPersonalProfile(options: {
  apiUrl: string;
  token: string;
  personalId: string;
}) {
  return getJson<StudentPersonalProfile>(
    `${options.apiUrl}/api/students/personals/${options.personalId}/profile`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${options.token}`,
      },
    },
  );
}

export async function subscribeStudentToPersonal(options: {
  apiUrl: string;
  token: string;
  personalId: string;
  planId: string;
  couponId?: string | null;
}) {
  return getJson<StudentPixPayload>(
    `${options.apiUrl}/api/students/personals/${options.personalId}/subscribe`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${options.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        planId: options.planId,
        couponId: options.couponId ?? null,
      }),
    },
  );
}

export async function cancelStudentPersonalAssignment(options: {
  apiUrl: string;
  token: string;
  assignmentId: string;
}) {
  return getJson<{ success?: boolean }>(
    `${options.apiUrl}/api/students/personals/assignments/${options.assignmentId}/cancel`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${options.token}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    },
  );
}

export async function simulateStudentPersonalPayment(options: {
  apiUrl: string;
  token: string;
  paymentId: string;
}) {
  return getJson<{ success?: boolean; status?: string }>(
    `${options.apiUrl}/api/students/personals/payments/${options.paymentId}/simulate-pix`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${options.token}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    },
  );
}

export async function fetchStudentWorkoutProgress(options: {
  apiUrl: string;
  token: string;
  workoutId: string;
}) {
  return getJson<{
    progress: StudentWorkoutProgress | null;
    message?: string;
  }>(`${options.apiUrl}/api/workouts/${options.workoutId}/progress`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${options.token}`,
    },
  });
}

export async function saveStudentWorkoutProgress(options: {
  apiUrl: string;
  token: string;
  workoutId: string;
  currentExerciseIndex: number;
  exerciseLogs?: StudentWorkoutProgress["exerciseLogs"];
  skippedExercises?: string[];
  selectedAlternatives?: Record<string, string>;
  xpEarned?: number;
  totalVolume?: number;
  completionPercentage?: number;
  startTime?: string | null;
  cardioPreference?: string | null;
  cardioDuration?: number | null;
  selectedCardioType?: string | null;
}) {
  return getJson<{ message?: string }>(
    `${options.apiUrl}/api/workouts/${options.workoutId}/progress`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${options.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        currentExerciseIndex: options.currentExerciseIndex,
        exerciseLogs: options.exerciseLogs ?? [],
        skippedExercises: options.skippedExercises ?? [],
        selectedAlternatives: options.selectedAlternatives ?? {},
        xpEarned: options.xpEarned ?? 0,
        totalVolume: options.totalVolume ?? 0,
        completionPercentage: options.completionPercentage ?? 0,
        startTime: options.startTime ?? new Date().toISOString(),
        cardioPreference: options.cardioPreference ?? null,
        cardioDuration: options.cardioDuration ?? null,
        selectedCardioType: options.selectedCardioType ?? null,
      }),
    },
  );
}

export async function clearStudentWorkoutProgress(options: {
  apiUrl: string;
  token: string;
  workoutId: string;
}) {
  return getJson<{ message?: string }>(
    `${options.apiUrl}/api/workouts/${options.workoutId}/progress`,
    {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${options.token}`,
      },
    },
  );
}

export async function completeStudentWorkout(options: {
  apiUrl: string;
  token: string;
  workoutId: string;
  exerciseLogs: StudentWorkoutProgress["exerciseLogs"];
  duration?: number;
  totalVolume?: number;
  overallFeedback?: "excelente" | "bom" | "regular" | "ruim";
  startTime?: string | null;
  bodyPartsFatigued?: string[];
}) {
  return getJson<{
    workoutHistoryId: string;
    xpEarned: number;
  }>(`${options.apiUrl}/api/workouts/${options.workoutId}/complete`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${options.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      exerciseLogs: options.exerciseLogs,
      duration: options.duration,
      totalVolume: options.totalVolume,
      overallFeedback: options.overallFeedback ?? "bom",
      startTime: options.startTime ?? null,
      bodyPartsFatigued: options.bodyPartsFatigued ?? [],
    }),
  });
}

export async function generateStudentWorkouts(options: {
  apiUrl: string;
  token: string;
}) {
  return getJson<{ message?: string }>(`${options.apiUrl}/api/workouts/generate`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${options.token}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
}

export async function activateStudentLibraryPlan(options: {
  apiUrl: string;
  token: string;
  libraryPlanId: string;
}) {
  return getJson<{
    jobId?: string;
    message?: string;
    status?: string;
  }>(`${options.apiUrl}/api/workouts/weekly-plan/activate`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${options.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      libraryPlanId: options.libraryPlanId,
    }),
  });
}

export async function fetchStudentLibraryPlanDetail(options: {
  apiUrl: string;
  token: string;
  planId: string;
}) {
  const payload = await getJson<{
    data?: Record<string, unknown> | null;
  }>(`${options.apiUrl}/api/workouts/library/${options.planId}?fresh=1`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${options.token}`,
    },
  });

  return normalizeWeeklyPlan(payload.data ?? null);
}

export async function createStudentLibraryPlan(options: {
  apiUrl: string;
  token: string;
  title?: string;
}) {
  return getJson<{
    data?: {
      id?: string;
      title?: string;
    };
    message?: string;
  }>(`${options.apiUrl}/api/workouts/library`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${options.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: options.title ?? "Novo Plano Semanal",
      isLibraryTemplate: true,
    }),
  });
}

export async function updateStudentLibraryPlan(options: {
  apiUrl: string;
  token: string;
  planId: string;
  title?: string;
  description?: string | null;
}) {
  return getJson<{
    data?: Record<string, unknown>;
    message?: string;
  }>(`${options.apiUrl}/api/workouts/library/${options.planId}`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${options.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...(options.title !== undefined ? { title: options.title } : {}),
      ...(options.description !== undefined
        ? { description: options.description }
        : {}),
    }),
  });
}

export async function deleteStudentLibraryPlan(options: {
  apiUrl: string;
  token: string;
  planId: string;
}) {
  return getJson<{ message?: string }>(
    `${options.apiUrl}/api/workouts/library/${options.planId}`,
    {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${options.token}`,
      },
    },
  );
}

export async function createStudentWeeklyPlan(options: {
  apiUrl: string;
  token: string;
  title?: string;
}) {
  return getJson<{
    data?: Record<string, unknown>;
    message?: string;
  }>(`${options.apiUrl}/api/workouts/weekly-plan`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${options.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: options.title ?? "Meu Plano Semanal",
    }),
  });
}

export async function updateStudentWeeklyPlan(options: {
  apiUrl: string;
  token: string;
  title?: string;
  description?: string | null;
}) {
  return getJson<{
    data?: Record<string, unknown>;
    message?: string;
  }>(`${options.apiUrl}/api/workouts/weekly-plan`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${options.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...(options.title !== undefined ? { title: options.title } : {}),
      ...(options.description !== undefined
        ? { description: options.description }
        : {}),
    }),
  });
}

export async function resetStudentWeek(options: {
  apiUrl: string;
  token: string;
}) {
  return getJson<{ message?: string; weekStart?: string }>(
    `${options.apiUrl}/api/students/week-reset`,
    {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${options.token}`,
      },
    },
  );
}

export async function createStudentWorkout(options: {
  apiUrl: string;
  token: string;
  planSlotId: string;
  title: string;
  description?: string;
  type?: string;
  muscleGroup?: string;
  difficulty?: string;
  estimatedTime?: number;
}) {
  const payload = await getJson<{
    data?: {
      id?: string;
    };
    id?: string;
  }>(`${options.apiUrl}/api/workouts/manage`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${options.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      planSlotId: options.planSlotId,
      title: options.title,
      description: options.description ?? "",
      type: options.type ?? "strength",
      muscleGroup: options.muscleGroup ?? "full-body",
      difficulty: options.difficulty ?? "iniciante",
      estimatedTime: options.estimatedTime ?? 45,
    }),
  });

  return payload.data?.id ?? payload.id ?? null;
}

export async function updateStudentWorkout(options: {
  apiUrl: string;
  token: string;
  workoutId: string;
  title?: string;
  description?: string;
  type?: string;
  muscleGroup?: string;
  difficulty?: string;
  estimatedTime?: number;
  order?: number;
}) {
  return getJson<{
    data?: Record<string, unknown>;
    message?: string;
  }>(`${options.apiUrl}/api/workouts/manage/${options.workoutId}`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${options.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...(options.title !== undefined ? { title: options.title } : {}),
      ...(options.description !== undefined
        ? { description: options.description }
        : {}),
      ...(options.type !== undefined ? { type: options.type } : {}),
      ...(options.muscleGroup !== undefined
        ? { muscleGroup: options.muscleGroup }
        : {}),
      ...(options.difficulty !== undefined
        ? { difficulty: options.difficulty }
        : {}),
      ...(options.estimatedTime !== undefined
        ? { estimatedTime: options.estimatedTime }
        : {}),
      ...(options.order !== undefined ? { order: options.order } : {}),
    }),
  });
}

export async function deleteStudentWorkout(options: {
  apiUrl: string;
  token: string;
  workoutId: string;
}) {
  return getJson<{ message?: string }>(
    `${options.apiUrl}/api/workouts/manage/${options.workoutId}`,
    {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${options.token}`,
      },
    },
  );
}

export async function createStudentWorkoutExercise(options: {
  apiUrl: string;
  token: string;
  workoutId: string;
  name: string;
  sets?: number;
  reps?: string;
  rest?: number;
  notes?: string;
}) {
  return getJson<{
    data?: Record<string, unknown>;
    message?: string;
  }>(`${options.apiUrl}/api/workouts/exercises`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${options.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      workoutId: options.workoutId,
      name: options.name,
      sets: options.sets,
      reps: options.reps,
      rest: options.rest,
      notes: options.notes,
    }),
  });
}

export async function updateStudentWorkoutExercise(options: {
  apiUrl: string;
  token: string;
  exerciseId: string;
  name?: string;
  sets?: number;
  reps?: string;
  rest?: number;
  notes?: string;
  order?: number;
}) {
  return getJson<{
    data?: Record<string, unknown>;
    message?: string;
  }>(`${options.apiUrl}/api/workouts/exercises/${options.exerciseId}`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${options.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...(options.name !== undefined ? { name: options.name } : {}),
      ...(options.sets !== undefined ? { sets: options.sets } : {}),
      ...(options.reps !== undefined ? { reps: options.reps } : {}),
      ...(options.rest !== undefined ? { rest: options.rest } : {}),
      ...(options.notes !== undefined ? { notes: options.notes } : {}),
      ...(options.order !== undefined ? { order: options.order } : {}),
    }),
  });
}

export async function deleteStudentWorkoutExercise(options: {
  apiUrl: string;
  token: string;
  exerciseId: string;
}) {
  return getJson<{ message?: string }>(
    `${options.apiUrl}/api/workouts/exercises/${options.exerciseId}`,
    {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${options.token}`,
      },
    },
  );
}
