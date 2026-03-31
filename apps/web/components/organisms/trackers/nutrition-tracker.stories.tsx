import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, within } from "storybook/test";
import type { DailyNutrition } from "@/lib/types";
import { NutritionTracker } from "./nutrition-tracker";

const dailyNutrition: DailyNutrition = {
  date: "2026-03-26",
  meals: [
    {
      id: "meal-breakfast",
      name: "Cafe da manha",
      calories: 420,
      protein: 28,
      carbs: 42,
      fats: 12,
      completed: false,
      type: "breakfast",
      time: "08:00",
      foods: [
        {
          id: "food-eggs",
          foodId: "eggs",
          foodName: "Ovos mexidos",
          servings: 2,
          calories: 180,
          protein: 14,
          carbs: 2,
          fats: 12,
          servingSize: "2 un",
        },
      ],
    },
  ],
  totalCalories: 420,
  totalProtein: 28,
  totalCarbs: 42,
  totalFats: 12,
  waterIntake: 500,
  targetCalories: 2200,
  targetProtein: 160,
  targetCarbs: 240,
  targetFats: 70,
  targetWater: 2500,
};

const meta = {
  title: "Organisms/Trackers/NutritionTracker",
  component: NutritionTracker.Simple,
  tags: ["autodocs"],
  args: {
    nutrition: dailyNutrition,
    onMealComplete: fn(),
    onAddMeal: fn(),
    onAddFoodToMeal: fn(),
    onDeleteMeal: fn(),
    onDeleteFood: fn(),
    onToggleWaterGlass: fn(),
    onOpenLibrary: fn(),
    libraryButtonLabel: "Biblioteca",
    readOnly: false,
    waterReadOnly: false,
    showCompletionControls: true,
    showHydration: true,
  },
} satisfies Meta<typeof NutritionTracker.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Refeicoes de Hoje/i)).toBeVisible();
    await expect(canvas.getByText(/Cafe da manha/i)).toBeVisible();
  },
};

export const EmptyDay: Story = {
  args: {
    nutrition: {
      ...dailyNutrition,
      meals: [],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFats: 0,
      waterIntake: 0,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Hidrate-se/i)).toBeVisible();
    await expect(
      canvas.getByText(/Comece a registrar suas refeicoes/i),
    ).toBeVisible();
  },
};
