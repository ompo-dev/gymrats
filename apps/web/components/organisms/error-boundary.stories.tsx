import type { ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ErrorBoundary } from "@/components/organisms/error-boundary";

function ExplodingStory(): ReactNode {
  throw new Error("Storybook boundary crash");
}

const meta = {
  title: "Organisms/ErrorBoundary",
  component: ErrorBoundary.Root,
  args: {
    children: undefined,
  },
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ErrorBoundary.Root>;

export default meta;

type Story = StoryObj<typeof meta>;

export const CaughtError: Story = {
  render: () => (
    <ErrorBoundary.Root>
      <ExplodingStory />
    </ErrorBoundary.Root>
  ),
};
