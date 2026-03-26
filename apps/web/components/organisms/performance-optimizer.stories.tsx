import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PerformanceOptimizer } from "./performance-optimizer";

const meta = {
  title: "Organisms/PerformanceOptimizer",
  component: PerformanceOptimizer,
} satisfies Meta<typeof PerformanceOptimizer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
