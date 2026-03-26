import { expect, test } from "@playwright/test";
import {
  mockGymAdminRoutes,
  mockGymDashboardRoutes,
  mockPersonalDashboardRoutes,
  mockStudentHomeRoutes,
} from "../support/e2e-actors";

test("guest landing renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toBeVisible();
});

test("authenticated gym user lands on the extracted dashboard screen", async ({
  page,
}) => {
  await mockGymDashboardRoutes(page);

  await page.goto("/gym?tab=dashboard");

  await expect(page.getByTestId("gym-dashboard-screen")).toBeVisible();
  await expect(page.getByTestId("gym-dashboard-screen.metrics")).toBeVisible();

  await page.getByTestId("gym-dashboard-screen.check-in-trigger").click();
  await expect(
    page.getByPlaceholder(/Buscar aluno pelo nome/i),
  ).toBeVisible();
});

test("authenticated gym user can open the student directory screen", async ({
  page,
}) => {
  await mockGymDashboardRoutes(page);

  await page.goto("/gym?tab=students&status=all");

  await expect(page.getByTestId("gym-student-directory-screen")).toBeVisible();
  await expect(
    page.getByTestId("gym-student-directory-screen.filters"),
  ).toBeVisible();
  await expect(
    page.getByTestId("gym-student-directory-screen.student-card"),
  ).toHaveCount(2);

  await page.getByTestId("gym-student-directory-screen.search").fill("Ana");

  await expect(
    page.getByTestId("gym-student-directory-screen.student-card"),
  ).toHaveCount(1);
});

test("authenticated gym user can open the stats screen", async ({ page }) => {
  await mockGymDashboardRoutes(page);

  await page.goto("/gym?tab=stats");

  await expect(page.getByTestId("gym-stats-screen")).toBeVisible();
  await expect(page.getByTestId("gym-stats-screen.metrics")).toBeVisible();
  await expect(
    page.getByTestId("gym-stats-screen.checkins-by-day"),
  ).toBeVisible();
});

test("authenticated gym user can open the equipment screen", async ({
  page,
}) => {
  await mockGymDashboardRoutes(page);

  await page.goto("/gym?tab=equipment");

  await expect(page.getByTestId("gym-equipment-screen")).toBeVisible();
  await expect(
    page.getByTestId("gym-equipment-screen.metrics"),
  ).toBeVisible();
  await expect(
    page.getByTestId("gym-equipment-screen.equipment-card"),
  ).toHaveCount(3);

  await page.getByTestId("gym-equipment-screen.search").fill("Bike");

  await expect(
    page.getByTestId("gym-equipment-screen.equipment-card"),
  ).toHaveCount(1);

  await page
    .getByTestId("gym-equipment-screen.equipment-card")
    .first()
    .click();

  await expect(
    page.getByRole("button", { name: /Voltar para Equipamentos/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Editar Equipamento/i }),
  ).toBeVisible();
});

test("authenticated gym user can open the financial screen", async ({
  page,
}) => {
  await mockGymDashboardRoutes(page);

  await page.goto("/gym?tab=financial");

  await expect(page.getByTestId("gym-financial-screen")).toBeVisible();
  await expect(
    page.getByTestId("gym-financial-screen.selector"),
  ).toBeVisible();
  await expect(
    page.getByTestId("gym-financial-screen.overview"),
  ).toBeVisible();

  await page.goto("/gym?tab=financial&subTab=payments");

  await expect(
    page.getByTestId("gym-financial-screen.payments"),
  ).toBeVisible();
  await expect(page.getByText(/Pagamentos por aluno/i)).toBeVisible();
});

test("authenticated gym user can open the settings screen", async ({
  page,
}) => {
  await mockGymDashboardRoutes(page);

  await page.goto("/gym?tab=settings");

  await expect(page.getByTestId("gym-settings-screen")).toBeVisible();
  await expect(
    page.getByTestId("gym-settings-screen.profile"),
  ).toBeVisible();
  await expect(
    page.getByTestId("gym-settings-screen.schedule"),
  ).toBeVisible();
  await expect(page.getByTestId("gym-settings-screen.team")).toBeVisible();
  await expect(
    page.getByTestId("gym-settings-screen.account"),
  ).toBeVisible();
});

test("authenticated admin user can open the gym gamification screen", async ({
  page,
}) => {
  await mockGymAdminRoutes(page);

  await page.goto("/gym?tab=gamification");

  await expect(page.getByTestId("gym-gamification-screen")).toBeVisible();
  await expect(
    page.getByTestId("gym-gamification-screen.metrics"),
  ).toBeVisible();
  await expect(
    page.getByTestId("gym-gamification-screen.achievements"),
  ).toBeVisible();
  await expect(
    page.getByTestId("gym-gamification-screen.ranking"),
  ).toBeVisible();
});

test("authenticated gym user can open the more menu screen", async ({
  page,
}) => {
  await mockGymDashboardRoutes(page);

  await page.goto("/gym?tab=more");

  await expect(page.getByTestId("gym-more-menu-screen")).toBeVisible();
  await expect(page.getByTestId("gym-more-menu-screen.items")).toBeVisible();
  await expect(
    page.getByTestId("gym-more-menu-screen.item"),
  ).toHaveCount(3);
});

test("authenticated personal user lands on the extracted dashboard screen", async ({
  page,
}) => {
  await mockPersonalDashboardRoutes(page);

  await page.goto("/personal?tab=dashboard");

  await expect(page.getByTestId("personal-dashboard-screen")).toBeVisible();
  await expect(
    page.getByTestId("personal-dashboard-screen.metrics"),
  ).toBeVisible();
  await expect(
    page.getByTestId("personal-dashboard-screen.affiliations"),
  ).toBeVisible();
});

test("authenticated personal user can open the student directory screen", async ({
  page,
}) => {
  await mockPersonalDashboardRoutes(page);

  await page.goto("/personal?tab=students&status=all&network=all");

  await expect(
    page.getByTestId("personal-student-directory-screen"),
  ).toBeVisible();
  await expect(
    page.getByTestId("personal-student-directory-screen.network-filter"),
  ).toBeVisible();
  await expect(
    page.getByTestId("personal-student-directory-screen.student-card"),
  ).toHaveCount(2);

  await page
    .getByTestId("personal-student-directory-screen.search")
    .fill("Marcos");

  await expect(
    page.getByTestId("personal-student-directory-screen.student-card"),
  ).toHaveCount(1);
});

test("authenticated personal user can open the gyms screen", async ({
  page,
}) => {
  await mockPersonalDashboardRoutes(page);

  await page.goto("/personal?tab=gyms");

  await expect(page.getByTestId("personal-gyms-screen")).toBeVisible();
  await expect(
    page.getByTestId("personal-gyms-screen.link-form"),
  ).toBeVisible();
  await expect(
    page.getByTestId("personal-gyms-screen.affiliation-card"),
  ).toHaveCount(2);
});

test("authenticated personal user can open the financial screen", async ({
  page,
}) => {
  await mockPersonalDashboardRoutes(page);

  await page.goto("/personal?tab=financial");

  await expect(page.getByTestId("personal-financial-screen")).toBeVisible();
  await expect(
    page.getByTestId("personal-financial-screen.selector"),
  ).toBeVisible();
  await expect(
    page.getByTestId("personal-financial-screen.overview"),
  ).toBeVisible();

  await page.goto("/personal?tab=financial&subTab=payments");

  await expect(
    page.getByTestId("personal-financial-screen.payments"),
  ).toBeVisible();
  await expect(page.getByText(/Pagamentos por aluno/i)).toBeVisible();
});

test("authenticated personal user can open the settings screen", async ({
  page,
}) => {
  await mockPersonalDashboardRoutes(page);

  await page.goto("/personal?tab=settings");

  await expect(page.getByTestId("personal-settings-screen")).toBeVisible();
  await expect(
    page.getByTestId("personal-settings-screen.profile"),
  ).toBeVisible();
  await expect(
    page.getByTestId("personal-settings-screen.attendance"),
  ).toBeVisible();
  await expect(
    page.getByTestId("personal-settings-screen.plans"),
  ).toBeVisible();
  await expect(
    page.getByTestId("personal-settings-screen.account"),
  ).toBeVisible();
});

test("authenticated personal user can open the more menu screen", async ({
  page,
}) => {
  await mockPersonalDashboardRoutes(page);

  await page.goto("/personal?tab=more");

  await expect(page.getByTestId("personal-more-menu-screen")).toBeVisible();
  await expect(
    page.getByTestId("personal-more-menu-screen.items"),
  ).toBeVisible();
  await expect(
    page.getByTestId("personal-more-menu-screen.item"),
  ).toHaveCount(3);
});

test("authenticated student user lands on the home screen with stable selectors", async ({
  page,
}) => {
  await mockStudentHomeRoutes(page);

  await page.goto("/student?tab=home");

  await expect(page.getByTestId("student-home-screen")).toBeVisible();
  await expect(page.getByTestId("student-home-screen.metrics")).toBeVisible();
  await expect(page.getByText(/Continue sua jornada fitness/i)).toBeVisible();
});

test("authenticated student user can open the cardio screen and switch views", async ({
  page,
}) => {
  await mockStudentHomeRoutes(page);

  await page.goto("/student?tab=cardio");

  await expect(page.getByTestId("student-cardio-screen")).toBeVisible();
  await expect(page.getByTestId("student-cardio-screen.metrics")).toBeVisible();

  await page.getByTestId("student-cardio-screen.cardio-option").click();
  await expect(
    page.getByTestId("student-cardio-screen.cardio-view"),
  ).toBeVisible();

  await page.getByRole("button", { name: /Voltar/i }).click();
  await page.getByTestId("student-cardio-screen.functional-option").click();
  await expect(
    page.getByTestId("student-cardio-screen.functional-view"),
  ).toBeVisible();
});

test("authenticated student user can open the education screen and change the menu state", async ({
  page,
}) => {
  await mockStudentHomeRoutes(page);

  await page.goto("/student?tab=education");

  await expect(page.getByTestId("student-education-screen")).toBeVisible();
  await page.getByTestId("student-education-screen.lessons-option").click();
  await expect.poll(() => page.url()).toContain("view=lessons");

  await page.goto("/student?tab=education");
  await page.getByTestId("student-education-screen.muscles-option").click();
  await expect.poll(() => page.url()).toContain("view=muscles");
});

test("authenticated student user can open the muscle explorer screen", async ({
  page,
}) => {
  await mockStudentHomeRoutes(page);

  await page.goto("/student?tab=education&view=muscles");

  await expect(
    page.getByTestId("student-muscle-explorer-screen"),
  ).toBeVisible();
  await expect(
    page.getByTestId("student-muscle-explorer-screen.selector"),
  ).toBeVisible();
  await expect(
    page.getByTestId("student-muscle-explorer-screen.search"),
  ).toBeVisible();
  await expect(
    page.getByTestId("student-muscle-explorer-screen.content"),
  ).toBeVisible();
  await expect(page.getByPlaceholder(/Buscar/i)).toBeVisible();
});

test("authenticated student user can open the learning path screen", async ({
  page,
}) => {
  await mockStudentHomeRoutes(page);

  await page.goto("/student?tab=learn");

  await expect(page.getByTestId("student-learning-path-screen")).toBeVisible();
  await expect(
    page.getByTestId("student-learning-path-screen.empty-state"),
  ).toBeVisible();
  await expect(
    page.getByTestId("student-learning-path-screen.create-plan"),
  ).toBeVisible();
});

test("authenticated student user can open the diet screen", async ({
  page,
}) => {
  await mockStudentHomeRoutes(page);

  await page.goto("/student?tab=diet");

  await expect(page.getByTestId("student-diet-screen")).toBeVisible();
  await expect(page.getByTestId("student-diet-screen.metrics")).toBeVisible();
  await expect(page.getByTestId("student-diet-screen.tracker")).toBeVisible();
  await expect(page.getByText(/Cafe da manha/i)).toBeVisible();
  await expect(page.getByText(/Almoco/i)).toBeVisible();
});

test("authenticated student user can open the more menu screen", async ({
  page,
}) => {
  await mockStudentHomeRoutes(page);

  await page.goto("/student?tab=more");

  await expect(page.getByTestId("student-more-menu-screen")).toBeVisible();
  await expect(
    page.getByTestId("student-more-menu-screen.items"),
  ).toBeVisible();
  await expect(
    page.getByTestId("student-more-menu-screen.item"),
  ).toHaveCount(4);
});

test("authenticated student user can open the profile screen", async ({
  page,
}) => {
  await mockStudentHomeRoutes(page);

  await page.goto("/student?tab=profile");

  await expect(page.getByTestId("student-profile-screen")).toBeVisible();
  await expect(
    page.getByTestId("student-profile-screen.metrics"),
  ).toBeVisible();
  await expect(
    page.getByTestId("student-profile-screen.weight-history"),
  ).toBeVisible();
  await expect(
    page.getByTestId("student-profile-screen.networks"),
  ).toBeVisible();
  await expect(
    page.getByTestId("student-profile-screen.account"),
  ).toBeVisible();
});

test("authenticated student user can open the payments screen", async ({
  page,
}) => {
  await mockStudentHomeRoutes(page);

  await page.goto("/student?tab=payments");

  await expect(page.getByTestId("student-payments-screen")).toBeVisible();
  await expect(
    page.getByTestId("student-payments-screen.metrics"),
  ).toBeVisible();
  await expect(
    page.getByTestId("student-payments-screen.memberships"),
  ).toBeVisible();

  await page.goto("/student?tab=payments&subTab=payments");

  await expect(
    page.getByTestId("student-payments-screen.payments"),
  ).toBeVisible();

  await page.goto("/student?tab=payments&subTab=subscription");

  await expect(
    page.getByTestId("student-payments-screen.subscription"),
  ).toBeVisible();
});
