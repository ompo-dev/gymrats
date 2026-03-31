import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import { expect, within } from "storybook/test";
import { CreateGymDialog } from "./create-gym-dialog";

const meta = {
  title: "Organisms/Gym/Academias/CreateGymDialog",
  component: CreateGymDialog,
  args: {
    open: true,
    onOpenChange: fn(),
    formData: {
      name: "GymRats Paulista",
      address: "Av. Paulista, 900",
      phone: "(11) 4002-8922",
      email: "contato@gymrats.local",
      cnpj: "12.345.678/0001-99",
    },
    onFormChange: fn(),
    onSubmit: fn((event: React.FormEvent) => event.preventDefault()),
    isCreating: false,
    createError: "",
  },
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof CreateGymDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Criar Nova Academia/i)).toBeVisible();
    await expect(canvas.getByDisplayValue(/GymRats Paulista/i)).toBeVisible();
  },
};

export const WithError: Story = {
  args: {
    createError: "Nao foi possivel criar a academia agora.",
  },
};
