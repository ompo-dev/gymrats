import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, within } from "storybook/test";
import { PersonalListItemCard } from "./personal-list-item-card";

const meta = {
  title: "Organisms/Sections/ListItemCards/PersonalListItemCard",
  component: PersonalListItemCard,
  tags: ["autodocs"],
  args: {
    image: "/placeholder.svg",
    name: "Maicon Trainer",
    onClick: fn(),
    badge: { label: "Disponivel" },
    subtitle: "Hipertrofia e reabilitacao",
    atendimentoPresencial: true,
    atendimentoRemoto: true,
    distance: 3.4,
  },
} satisfies Meta<typeof PersonalListItemCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const HybridCare: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Maicon Trainer/i)).toBeVisible();
    await expect(canvas.getByText(/Presencial/i)).toBeVisible();
    await expect(canvas.getByText(/Remoto/i)).toBeVisible();
  },
};

export const EmailVariant: Story = {
  args: {
    badge: undefined,
    atendimentoPresencial: false,
    atendimentoRemoto: false,
    distance: undefined,
    email: "maicon@gymrats.com",
  },
};
