import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { expect, within } from "storybook/test";
import { MealCard } from "@/components/molecules/cards/meal-card";

type StoryMeal = Parameters<typeof MealCard.Simple>[0]["meal"];

function MealCardStory({
  readOnly = false,
}: {
  readOnly?: boolean;
}) {
  const [completed, setCompleted] = useState(false);
  const meal = {
    id: "meal-breakfast",
    name: "Cafe da manha",
    type: "breakfast",
    time: "07:30",
    completed,
    calories: 420,
    protein: 28,
    carbs: 45,
    fats: 12,
    foods: [],
  } as unknown as StoryMeal;

  return (
    <MealCard.Simple
      meal={meal}
      onComplete={() => setCompleted((value) => !value)}
      onAddFood={() => undefined}
      onDelete={() => undefined}
      isExpanded={false}
      readOnly={readOnly}
    />
  );
}

const meta = {
  title: "Molecules/Cards/MealCard",
  component: MealCardStory,
  tags: ["autodocs"],
} satisfies Meta<typeof MealCardStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: () => <MealCardStory />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Cafe da manha/i)).toBeVisible();
    await expect(canvas.getByText("420")).toBeVisible();
  },
};

export const ReadOnly: Story = {
  render: () => <MealCardStory readOnly />,
};

