import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { expect, within } from "storybook/test";
import { WaterIntakeCard } from "@/components/molecules/cards/water-intake-card";

function WaterIntakeStory({
  readOnly = false,
}: {
  readOnly?: boolean;
}) {
  const [glasses, setGlasses] = useState(5);

  return (
    <WaterIntakeCard.Simple
      current={glasses * 250}
      target={3000}
      glasses={glasses}
      readOnly={readOnly}
      onToggleGlass={(index) => setGlasses(index + 1)}
    />
  );
}

const meta = {
  title: "Molecules/Cards/WaterIntakeCard",
  component: WaterIntakeStory,
  tags: ["autodocs"],
} satisfies Meta<typeof WaterIntakeStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: () => <WaterIntakeStory />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Hidrat/i)).toBeVisible();
    await expect(canvas.getByText(/1250ml \/ 3000ml/i)).toBeVisible();
  },
};

export const ReadOnly: Story = {
  render: () => <WaterIntakeStory readOnly />,
};

