import type { Meta, StoryObj } from "@storybook/react";
import { LoadingScreen } from "@/components/organisms/loading-screen";

const meta = {
  title: "Organisms/LoadingScreen",
  component: LoadingScreen.Simple,
  args: {
    variant: "student",
    message: "Sincronizando dashboard",
  },
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof LoadingScreen.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Student: Story = {};

export const Gym: Story = {
  args: {
    variant: "gym",
    message: "Atualizando dados da academia",
  },
};

