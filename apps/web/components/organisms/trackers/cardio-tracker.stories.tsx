import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { CardioTracker } from "./cardio-tracker";

const meta = {
  title: "Organisms/Trackers/CardioTracker",
  component: CardioTracker.Simple,
  tags: ["autodocs"],
} satisfies Meta<typeof CardioTracker.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Treino Cardio/i)).toBeVisible();
    await expect(canvas.getByText(/Zona de FC Alvo/i)).toBeVisible();
  },
};
