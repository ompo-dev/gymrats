import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { createGymFinancialFixture } from "@/components/screens/gym";
import { MembershipPlansPage } from "./membership-plans-page";

const gymFinancialFixture = createGymFinancialFixture();

const meta = {
  title: "Organisms/Gym/MembershipPlansPage",
  component: MembershipPlansPage,
  args: {
    plans: gymFinancialFixture.plans ?? [],
  },
} satisfies Meta<typeof MembershipPlansPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Planos de Matricula/i)).toBeVisible();
    await expect(canvas.getByText(/Plano Mensal/i)).toBeVisible();
  },
};

export const Empty: Story = {
  args: {
    plans: [],
  },
};
