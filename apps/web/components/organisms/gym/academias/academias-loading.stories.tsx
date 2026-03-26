import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { AcademiasLoading } from "./academias-loading";

const meta = {
  title: "Organisms/Gym/Academias/AcademiasLoading",
  component: AcademiasLoading,
  tags: ["autodocs"],
} satisfies Meta<typeof AcademiasLoading>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Carregando academias/i)).toBeVisible();
  },
};
