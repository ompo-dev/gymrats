import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { StaggerContainer } from "@/components/animations/stagger-container";
import { StaggerItem } from "@/components/animations/stagger-item";

const meta = {
  title: "Animations/StaggerContainer",
  component: StaggerContainer,
  args: {
    children: undefined,
  },
  tags: ["autodocs"],
} satisfies Meta<typeof StaggerContainer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <StaggerContainer className="grid gap-3 sm:grid-cols-3">
      {["Aquecimento", "Forca", "Recuperacao"].map((label) => (
        <StaggerItem
          key={label}
          className="rounded-3xl bg-white px-4 py-6 text-center text-sm font-semibold shadow-sm ring-1 ring-[#eef1f5]"
        >
          {label}
        </StaggerItem>
      ))}
    </StaggerContainer>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Aquecimento")).toBeVisible();
    await expect(canvas.getByText("Recuperacao")).toBeVisible();
  },
};
