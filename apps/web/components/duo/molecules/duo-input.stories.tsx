import { Search } from "lucide-react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { DuoInput } from "@/components/duo";

const meta = {
  title: "Molecules/DuoInput",
  component: DuoInput.Simple,
  tags: ["autodocs"],
  args: {
    label: "Buscar aluno",
    placeholder: "Digite um nome",
    helperText: "Use ao menos 2 caracteres.",
  },
} satisfies Meta<typeof DuoInput.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText(/Buscar aluno/i)).toBeVisible();
    await expect(canvas.getByText(/2 caracteres/i)).toBeVisible();
  },
};

export const WithIcons: Story = {
  args: {
    leftIcon: <Search className="h-4 w-4" />,
    value: "Ana Souza",
    readOnly: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByDisplayValue("Ana Souza")).toBeVisible();
  },
};
