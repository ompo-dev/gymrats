import { Flame, Target } from "lucide-react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { DuoBadge, DuoSelect } from "@/components/duo";

const options = [
  {
    value: "strength",
    label: "Forca",
    description: "Treinos de hipertrofia e progressao",
    icon: <Target className="h-4 w-4" />,
    badge: <DuoBadge size="sm">Novo</DuoBadge>,
  },
  {
    value: "conditioning",
    label: "Condicionamento",
    description: "Blocos de cardio e resistencia",
    icon: <Flame className="h-4 w-4" />,
  },
] as const;

const meta = {
  title: "Molecules/DuoSelect",
  component: DuoSelect.Simple,
  tags: ["autodocs"],
  args: {
    label: "Trilha",
    placeholder: "Selecione uma trilha",
    options: [...options],
  },
} satisfies Meta<typeof DuoSelect.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("combobox")).toBeVisible();
    await expect(canvas.getByText("Trilha")).toBeVisible();
  },
};

export const Selected: Story = {
  args: {
    value: "strength",
  },
};

export const WithError: Story = {
  args: {
    error: "Selecione uma opcao valida.",
  },
};
