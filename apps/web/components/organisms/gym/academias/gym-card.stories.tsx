import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "storybook/test";
import { activeGymFixture, trialGymFixture } from "./academias-story-fixtures";
import { GymCard } from "./gym-card";

const meta = {
  title: "Organisms/Gym/Academias/GymCard",
  component: GymCard,
  tags: ["autodocs"],
  args: {
    gym: trialGymFixture,
    isActive: false,
    onSelect: fn(),
  },
} satisfies Meta<typeof GymCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Selectable: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/GymRats Vila Mariana/i)).toBeVisible();
    const button = canvas.getByRole("button", { name: /Selecionar/i });
    await userEvent.click(button);
    await expect(args.onSelect).toHaveBeenCalledWith("gym-vila-mariana");
  },
};

export const Active: Story = {
  args: {
    gym: activeGymFixture,
    isActive: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/GymRats Paulista/i)).toBeVisible();
    await expect(canvas.getByText(/Ativa/i)).toBeVisible();
  },
};
