import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  createPersonalDashboardFixture,
  PersonalDashboardScreen,
} from "@/components/screens/personal";

const meta = {
  title: "Screens/Personal/PersonalDashboard",
  component: PersonalDashboardScreen,
  args: createPersonalDashboardFixture(),
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof PersonalDashboardScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Trialing: Story = {
  args: createPersonalDashboardFixture({
    subscription: {
      id: "subscription-trial",
      plan: "starter",
      status: "trialing",
      currentPeriodEnd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
  }),
};

export const EmptyState: Story = {
  args: createPersonalDashboardFixture({
    affiliations: [],
    students: [],
    financialSummary: null,
  }),
};
