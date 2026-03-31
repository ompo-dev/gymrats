import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, within } from "storybook/test";
import { StudentListItemCard } from "./student-list-item-card";

const meta = {
  title: "Organisms/Sections/ListItemCards/StudentListItemCard",
  component: StudentListItemCard,
  tags: ["autodocs"],
  args: {
    image: "/placeholder.svg",
    name: "Ana Ribeiro",
    subtitle: "Treino A atualizado hoje",
    onClick: fn(),
  },
} satisfies Meta<typeof StudentListItemCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Clickable: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Ana Ribeiro/i)).toBeVisible();
    await expect(canvas.getByText(/Treino A atualizado hoje/i)).toBeVisible();
  },
};

export const ReadOnly: Story = {
  args: {
    onClick: undefined,
    subtitle: "Sem acao direta no momento",
  },
};
