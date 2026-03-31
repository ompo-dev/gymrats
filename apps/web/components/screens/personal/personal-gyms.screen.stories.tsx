import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  createPersonalGymsFixture,
  PersonalGymsScreen,
} from "@/components/screens/personal";

const meta = {
  title: "Screens/Personal/PersonalGyms",
  component: PersonalGymsScreen,
  args: createPersonalGymsFixture(),
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof PersonalGymsScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Linking: Story = {
  args: createPersonalGymsFixture({
    gymHandleInput: "@novaacademia",
    isLinking: true,
  }),
};

export const EmptyState: Story = {
  args: createPersonalGymsFixture({
    affiliations: [],
  }),
};
