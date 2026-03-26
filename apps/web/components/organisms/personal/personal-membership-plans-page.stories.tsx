import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { PersonalMembershipPlansPage } from "./personal-membership-plans-page";

const meta = {
  title: "Organisms/Personal/PersonalMembershipPlansPage",
  component: PersonalMembershipPlansPage,
  args: {
    plans: [
      {
        id: "plan-1",
        personalId: "personal-1",
        name: "Consultoria Premium",
        type: "monthly",
        price: 249.9,
        duration: 30,
        benefits: ["Treino individual", "Acompanhamento semanal"],
        isActive: true,
      },
    ],
    onRefresh: async () => undefined,
  },
} satisfies Meta<typeof PersonalMembershipPlansPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Planos de Assinatura/i)).toBeVisible();
    await expect(canvas.getByText(/Consultoria Premium/i)).toBeVisible();
  },
};

export const Empty: Story = {
  args: {
    plans: [],
  },
};
