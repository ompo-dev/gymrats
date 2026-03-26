import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  createGymMoreMenuFixture,
  GymMoreMenuScreen,
} from "@/components/screens/gym";

const meta = {
  title: "Screens/Gym/GymMoreMenu",
  component: GymMoreMenuScreen,
  args: createGymMoreMenuFixture(),
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof GymMoreMenuScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const StandardRole: Story = {
  args: createGymMoreMenuFixture({
    items: createGymMoreMenuFixture().items.filter(
      (item) => item.id !== "theme-test",
    ),
  }),
};
