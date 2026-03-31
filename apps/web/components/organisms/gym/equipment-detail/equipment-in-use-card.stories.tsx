import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import {
  availableEquipmentFixture,
  inUseEquipmentFixture,
} from "./equipment-story-fixtures";
import { EquipmentInUseCard } from "./equipment-in-use-card";

const meta = {
  title: "Organisms/Gym/EquipmentDetail/EquipmentInUseCard",
  component: EquipmentInUseCard,
  tags: ["autodocs"],
  args: {
    equipment: inUseEquipmentFixture,
  },
} satisfies Meta<typeof EquipmentInUseCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const InUse: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Ana Souza/i)).toBeVisible();
    await expect(canvas.getByText(/Tempo de Uso/i)).toBeVisible();
  },
};

export const HiddenWhenAvailable: Story = {
  args: {
    equipment: availableEquipmentFixture,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByText(/Tempo de Uso/i)).not.toBeInTheDocument();
  },
};
