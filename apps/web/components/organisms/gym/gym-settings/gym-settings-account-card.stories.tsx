import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "storybook/test";
import { GymSettingsAccountCard } from "./gym-settings-account-card";

const meta = {
  title: "Organisms/Gym/GymSettings/GymSettingsAccountCard",
  component: GymSettingsAccountCard,
  tags: ["autodocs"],
  args: {
    isAdmin: true,
    onSwitchToStudent: fn(),
    onLogout: fn(),
  },
} satisfies Meta<typeof GymSettingsAccountCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Admin: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const switchCard = canvas.getByText(/Trocar para Perfil de Aluno/i);
    await userEvent.click(switchCard);
    await expect(args.onSwitchToStudent).toHaveBeenCalled();
  },
};

export const Standard: Story = {
  args: {
    isAdmin: false,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.queryByText(/Trocar para Perfil de Aluno/i),
    ).not.toBeInTheDocument();
    await userEvent.click(canvas.getByText(/^Sair$/i));
    await expect(args.onLogout).toHaveBeenCalled();
  },
};
