import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  createGymGamificationFixture,
  GymGamificationScreen,
} from "@/components/screens/gym";

const meta = {
  title: "Screens/Gym/GymGamification",
  component: GymGamificationScreen,
  args: createGymGamificationFixture(),
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof GymGamificationScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoAchievements: Story = {
  args: createGymGamificationFixture({
    profile: {
      ...createGymGamificationFixture().profile,
      gamification: {
        ...createGymGamificationFixture().profile.gamification,
        achievements: [],
      },
    },
  }),
};
