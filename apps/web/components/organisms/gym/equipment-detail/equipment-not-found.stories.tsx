import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { EquipmentNotFound } from "./equipment-not-found";

const meta = {
  title: "Organisms/Gym/EquipmentDetail/EquipmentNotFound",
  component: EquipmentNotFound,
  tags: ["autodocs"],
} satisfies Meta<typeof EquipmentNotFound>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("link", { name: /Voltar para Equipamentos/i }),
    ).toBeVisible();
  },
};
