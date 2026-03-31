import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { expect, within } from "storybook/test";
import { RangeSlider } from "@/components/ui/range-slider";

function RangeSliderStory() {
  const [value, setValue] = useState(45);

  return (
    <div className="max-w-xl">
      <RangeSlider
        min={15}
        max={120}
        step={5}
        value={value}
        onChange={setValue}
        label="Duracao da sessao"
        unit="min"
      />
    </div>
  );
}

const meta = {
  title: "UI/RangeSlider",
  component: RangeSliderStory,
  tags: ["autodocs"],
} satisfies Meta<typeof RangeSliderStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <RangeSliderStory />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Duracao da sessao/i)).toBeVisible();
    await expect(canvas.getByText("45")).toBeVisible();
  },
};

