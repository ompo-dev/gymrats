import type { Meta, StoryObj } from "@storybook/react";
import { LoadingScreenFallback } from "@/components/organisms/loading-screen-fallback";

const meta = {
  title: "Organisms/LoadingScreenFallback",
  component: LoadingScreenFallback,
  args: {
    variant: "personal",
    message: "Preparando area profissional",
  },
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof LoadingScreenFallback>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

