import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { createPersonalGymsFixture } from "@/components/screens/personal";
import {
  PersonalGymsPage,
  type PersonalGymsPageProps,
} from "./personal-gyms";

function createPersonalGymsPageFixture(
  overrides: Partial<PersonalGymsPageProps> = {},
): PersonalGymsPageProps {
  const screenArgs = createPersonalGymsFixture();

  return {
    affiliations: screenArgs.affiliations,
    onRefresh: async () => undefined,
    onViewGym: screenArgs.onViewGym,
    ...overrides,
  };
}

const meta = {
  title: "Organisms/Personal/PersonalGymsPage",
  component: PersonalGymsPage,
  args: createPersonalGymsPageFixture(),
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof PersonalGymsPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/GymRats Paulista/i)).toBeVisible();
    await expect(canvas.getByText(/Arena Norte/i)).toBeVisible();
  },
};

export const Empty: Story = {
  args: createPersonalGymsPageFixture({
    affiliations: [],
  }),
};
