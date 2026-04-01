import { buildTag, uniqueTags } from "./helpers";

const STUDENT_BOOTSTRAP_SECTION_TAGS: Record<string, string[]> = {
  user: ["student:profile"],
  student: ["student:profile"],
  progress: ["student:dashboard", "student:progress"],
  profile: ["student:profile"],
  weightHistory: ["student:weight-history", "student:dashboard"],
  units: ["student:workouts", "student:weekly-plan"],
  weeklyPlan: ["student:weekly-plan", "student:workouts"],
  libraryPlans: ["student:workouts"],
  workoutHistory: ["student:workouts"],
  personalRecords: ["student:profile", "student:workouts"],
  activeNutritionPlan: ["student:nutrition"],
  nutritionLibraryPlans: ["student:nutrition"],
  dailyNutrition: ["student:nutrition", "student:dashboard"],
  subscription: ["student:subscription", "student:dashboard"],
  memberships: ["student:subscription", "student:payments"],
  payments: ["student:payments", "student:subscription"],
  paymentMethods: ["student:payments"],
  referral: ["student:payments", "student:dashboard"],
  dayPasses: ["student:payments"],
  friends: ["student:social"],
  gymLocations: ["discovery:gyms"],
};

const GYM_BOOTSTRAP_SECTION_TAGS: Record<string, string[]> = {
  profile: ["gym:profile", "gym:settings"],
  stats: ["gym:dashboard", "gym:stats"],
  students: ["gym:students", "gym:dashboard"],
  equipment: ["gym:equipment"],
  financialSummary: ["gym:financial-summary", "gym:dashboard"],
  recentCheckIns: ["gym:access", "gym:access:feed", "gym:dashboard"],
  membershipPlans: ["gym:plans"],
  payments: ["gym:payments", "gym:financial-summary"],
  expenses: ["gym:expenses", "gym:financial-summary"],
  coupons: ["gym:coupons"],
  campaigns: ["gym:campaigns"],
  balanceWithdraws: ["gym:withdraws", "gym:financial-summary"],
  subscription: ["gym:subscription", "gym:dashboard"],
};

const PERSONAL_BOOTSTRAP_SECTION_TAGS: Record<string, string[]> = {
  profile: ["personal:profile", "personal:settings"],
  affiliations: ["personal:affiliations", "personal:dashboard"],
  students: ["personal:students", "personal:dashboard"],
  studentDirectory: ["personal:students", "personal:directory"],
  subscription: ["personal:subscription", "personal:dashboard"],
  financialSummary: ["personal:financial-summary", "personal:dashboard"],
  expenses: ["personal:expenses", "personal:financial-summary"],
  payments: ["personal:payments", "personal:financial-summary"],
  coupons: ["personal:coupons"],
  campaigns: ["personal:campaigns"],
  membershipPlans: ["personal:plans"],
};

export function buildBootstrapTags(
  area: "student" | "gym" | "personal",
  sections?: readonly string[],
  scope: "self" | "all" = "self",
) {
  const normalizedSections =
    sections && sections.length > 0 ? [...sections].sort() : ["all"];
  const sectionRegistry =
    area === "student"
      ? STUDENT_BOOTSTRAP_SECTION_TAGS
      : area === "gym"
        ? GYM_BOOTSTRAP_SECTION_TAGS
        : PERSONAL_BOOTSTRAP_SECTION_TAGS;

  const directTags = [
    buildTag(area, "bootstrap"),
    buildTag(area, "bootstrap", scope),
    ...normalizedSections.map((section) => buildTag(area, "bootstrap", section)),
  ];

  const derivedTags = normalizedSections.flatMap(
    (section) => sectionRegistry[section] ?? [],
  );

  return {
    directTags: uniqueTags(directTags),
    derivedTags: uniqueTags(derivedTags),
  };
}

export function buildBootstrapCacheTags(
  area: "student" | "gym" | "personal",
  sections?: readonly string[],
  scope: "self" | "all" = "self",
) {
  const { directTags, derivedTags } = buildBootstrapTags(area, sections, scope);
  return uniqueTags([...directTags, ...derivedTags]);
}
