import { createBootstrapResponse, measureBootstrapSection } from "@gymrats/domain";
import { db } from "@/lib/db";
import { PersonalFinancialService } from "@/lib/services/personal/personal-financial.service";
import { PersonalGymService } from "@/lib/services/personal/personal-gym.service";
import { StudentPersonalService } from "@/lib/services/personal/student-personal.service";

export const DEFAULT_PERSONAL_BOOTSTRAP_SECTIONS = [
  "profile",
  "affiliations",
  "students",
  "studentDirectory",
  "subscription",
  "financialSummary",
  "expenses",
  "payments",
  "coupons",
  "campaigns",
  "membershipPlans",
] as const;

export type PersonalBootstrapSection =
  (typeof DEFAULT_PERSONAL_BOOTSTRAP_SECTIONS)[number];

export function parsePersonalBootstrapSections(
  sectionsParam?: string,
): PersonalBootstrapSection[] {
  if (!sectionsParam) {
    return [...DEFAULT_PERSONAL_BOOTSTRAP_SECTIONS];
  }

  const allowed = new Set(DEFAULT_PERSONAL_BOOTSTRAP_SECTIONS);
  const sections = sectionsParam
    .split(",")
    .map((section) => section.trim())
    .filter(
      (section): section is PersonalBootstrapSection =>
        allowed.has(section as PersonalBootstrapSection),
    );

  return sections.length > 0
    ? [...new Set(sections)]
    : [...DEFAULT_PERSONAL_BOOTSTRAP_SECTIONS];
}

async function loadPersonalBootstrapSection(
  personalId: string,
  section: PersonalBootstrapSection,
) {
  switch (section) {
    case "profile":
      return {
        profile: await db.personal.findUnique({
          where: { id: personalId },
        }),
      };
    case "affiliations":
      return {
        affiliations: await PersonalGymService.listPersonalGyms(personalId),
      };
    case "students":
      return {
        students: await StudentPersonalService.listStudentsByPersonal(personalId),
      };
    case "studentDirectory":
      return {
        studentDirectory:
          await StudentPersonalService.listStudentsAsStudentData(personalId),
      };
    case "subscription":
      return {
        subscription: await db.personalSubscription.findUnique({
          where: { personalId },
        }),
      };
    case "financialSummary":
      return {
        financialSummary:
          await PersonalFinancialService.getFinancialSummary(personalId),
      };
    case "expenses":
      return {
        expenses: await PersonalFinancialService.getExpenses(personalId),
      };
    case "payments":
      return {
        payments: await PersonalFinancialService.getPayments(personalId),
      };
    case "coupons":
      return {
        coupons: await PersonalFinancialService.getCoupons(personalId),
      };
    case "campaigns":
      return {
        campaigns: await PersonalFinancialService.getBoostCampaigns(personalId),
      };
    case "membershipPlans":
      return {
        membershipPlans:
          await PersonalFinancialService.getMembershipPlans(personalId),
      };
    default:
      return {};
  }
}

export async function buildPersonalBootstrap(options: {
  personalId: string;
  sections?: PersonalBootstrapSection[];
}) {
  const sections = options.sections ?? [...DEFAULT_PERSONAL_BOOTSTRAP_SECTIONS];
  const sectionTimings: Record<string, number> = {};
  const mergedData: Record<string, unknown> = {};

  await Promise.all(
    sections.map(async (section) => {
      const sectionPayload = await measureBootstrapSection(
        section,
        sectionTimings,
        () => loadPersonalBootstrapSection(options.personalId, section),
      );
      Object.assign(mergedData, sectionPayload);
    }),
  );

  return createBootstrapResponse({
    data: mergedData,
    sectionTimings,
    cache: {
      hit: false,
      strategy: "personal-bootstrap",
    },
  });
}
