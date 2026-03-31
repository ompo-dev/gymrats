import type { Meta, StoryObj } from "@storybook/react";
import { expect } from "storybook/test";
import { StepperDot } from "@/components/atoms/progress/stepper-dot";

const meta = {
  title: "Atoms/Progress/StepperDot",
  component: StepperDot,
  args: {
    status: "completed",
    isCurrent: false,
    title: "Exercicio concluido",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof StepperDot>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Matrix: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <StepperDot status="default" title="Pendente" />
      <StepperDot status="skipped" title="Pulado" />
      <StepperDot status="completed" isCurrent title="Atual concluido" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const steps = canvasElement.querySelectorAll("[title]");
    await expect(steps.length).toBe(3);
  },
};
