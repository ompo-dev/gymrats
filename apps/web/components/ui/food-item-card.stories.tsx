import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { expect, within } from "storybook/test";
import { FoodItemCard } from "@/components/ui/food-item-card";
import type { MealFoodItem } from "@/lib/types";

const sampleFood: MealFoodItem = {
  id: "food-item-1",
  foodId: "chicken-breast",
  foodName: "Frango grelhado",
  servings: 2,
  calories: 320,
  protein: 42,
  carbs: 4,
  fats: 12,
  servingSize: "120g",
};

function FoodItemCardStory({
  defaultExpanded = false,
}: {
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="max-w-md">
      <FoodItemCard
        food={sampleFood}
        isExpanded={expanded}
        onToggle={() => setExpanded((current) => !current)}
        onDelete={() => undefined}
      />
    </div>
  );
}

const meta = {
  title: "UI/FoodItemCard",
  component: FoodItemCardStory,
  tags: ["autodocs"],
} satisfies Meta<typeof FoodItemCardStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Collapsed: Story = {
  render: () => <FoodItemCardStory />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Frango grelhado/i)).toBeVisible();
    await expect(canvas.getByText(/120g/i)).toBeVisible();
  },
};

export const Expanded: Story = {
  render: () => <FoodItemCardStory defaultExpanded />,
};
