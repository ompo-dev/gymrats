import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "storybook/test";
import { UnitDetailsForm } from "./unit-details-form";

const meta = {
  title: "Organisms/Modals/EditUnitModal/UnitDetailsForm",
  component: UnitDetailsForm,
  tags: ["autodocs"],
  args: {
    title: "Plano de Hipertrofia",
    description: "Progressao de 4 semanas com foco em volume.",
    onTitleChange: fn(),
    onDescriptionChange: fn(),
    onTitleFocus: fn(),
    onTitleBlur: fn(),
    onDescriptionFocus: fn(),
    onDescriptionBlur: fn(),
    onSave: fn(),
    onResetWeek: fn(),
    isWeeklyPlanMode: true,
    resetting: false,
    saving: false,
  },
} satisfies Meta<typeof UnitDetailsForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Salvar/i }));
    await expect(args.onSave).toHaveBeenCalled();
  },
};

export const WeeklyMode: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Resetar/i }));
    await expect(args.onResetWeek).toHaveBeenCalled();
  },
};
