import type { Meta, StoryObj } from "@storybook/react";
import { Pencil, RotateCcw, Sparkles } from "lucide-react";
import { expect, within } from "storybook/test";
import { DuoButton } from "@/components/duo";
import { UnitSectionCard } from "@/components/ui/unit-section-card";

const meta = {
  title: "UI/UnitSectionCard",
  component: UnitSectionCard,
  tags: ["autodocs"],
  args: {
    sectionLabel: "Plano da semana",
    title: "Upper body com foco em progressao",
    icon: Sparkles,
  },
} satisfies Meta<typeof UnitSectionCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Static: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Plano da semana/i)).toBeVisible();
    await expect(canvas.getByText(/Upper body/i)).toBeVisible();
  },
};

export const Actionable: Story = {
  args: {
    buttonIcon: Pencil,
    onButtonClick: () => undefined,
    additionalAction: (
      <DuoButton size="icon-sm" variant="ghost" aria-label="Resetar plano">
        <RotateCcw className="size-4 text-white" />
      </DuoButton>
    ),
  },
};
