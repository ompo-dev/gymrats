import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { personalFinancialFixture } from "@/components/organisms/gym/financial/financial-story-fixtures";
import { PersonalFinancialOverviewTab } from "./personal-financial-overview-tab";

const meta = {
  title: "Organisms/Personal/Financial/PersonalFinancialOverviewTab",
  component: PersonalFinancialOverviewTab,
  tags: ["autodocs"],
  args: {
    stats: {
      gyms: 3,
      students: 42,
      studentsViaGym: 28,
      independentStudents: 14,
    },
    subscription: personalFinancialFixture.subscription,
  },
} satisfies Meta<typeof PersonalFinancialOverviewTab>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithSubscription: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Plano atual/i)).toBeVisible();
    await expect(canvas.getByText(/Pro AI/i)).toBeVisible();
  },
};

export const WithoutSubscription: Story = {
  args: {
    subscription: null,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText(/Nenhuma assinatura ativa/i),
    ).toBeVisible();
  },
};
