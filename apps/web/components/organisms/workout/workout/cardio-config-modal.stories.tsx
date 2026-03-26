import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import { expect, within } from "storybook/test";
import { CardioConfigModal } from "./cardio-config-modal";

const meta = {
  title: "Organisms/Workout/CardioConfigModal",
  component: CardioConfigModal.Simple,
  args: {
    isOpen: true,
    onClose: fn(),
    onSelectPreference: fn(),
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof CardioConfigModal.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Adicionar Cardio/i)).toBeVisible();
    await expect(canvas.getByText(/Cardio ANTES do Treino/i)).toBeVisible();
  },
};
