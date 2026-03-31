import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import {
  createPersonalDashboardFixture,
} from "@/components/screens/personal";
import {
  PersonalDashboardPage,
  type PersonalDashboardProps,
} from "./personal-dashboard";

function createPersonalDashboardPageFixture(
  overrides: Partial<PersonalDashboardProps> = {},
): PersonalDashboardProps {
  const screenArgs = createPersonalDashboardFixture();

  return {
    profile: screenArgs.profile,
    stats: screenArgs.stats,
    affiliations: screenArgs.affiliations,
    students: screenArgs.students,
    subscription: screenArgs.subscription
      ? {
          ...screenArgs.subscription,
          currentPeriodEnd: screenArgs.subscription.currentPeriodEnd
            ? new Date(screenArgs.subscription.currentPeriodEnd)
            : undefined,
        }
      : null,
    financialSummary: screenArgs.financialSummary,
    onViewGym: screenArgs.onViewGym,
    ...overrides,
  };
}

const meta = {
  title: "Organisms/Personal/PersonalDashboardPage",
  component: PersonalDashboardPage,
  args: createPersonalDashboardPageFixture(),
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof PersonalDashboardPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Rafa Moreira/i)).toBeVisible();
    await expect(canvas.getByText(/GymRats Paulista/i)).toBeVisible();
  },
};

export const WithoutAffiliations: Story = {
  args: createPersonalDashboardPageFixture({
    affiliations: [],
  }),
};
