import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { NutritionStatusCard } from "@/components/organisms/home/home/nutrition-status-card";

type NutritionStatusProps = Parameters<typeof NutritionStatusCard.Simple>[0];

const populatedNutrition = {
  date: "2026-03-26",
  meals: [
    {
      id: "meal-1",
      name: "Cafe da manha",
      type: "breakfast",
      calories: 430,
      protein: 25,
      carbs: 45,
      fats: 14,
      completed: true,
      foods: [],
    },
    {
      id: "meal-2",
      name: "Almoco",
      type: "lunch",
      calories: 620,
      protein: 40,
      carbs: 58,
      fats: 18,
      completed: false,
      foods: [],
    },
  ],
  totalCalories: 1050,
  totalProtein: 65,
  totalCarbs: 103,
  totalFats: 32,
  waterIntake: 1800,
  targetCalories: 2200,
  targetProtein: 140,
  targetCarbs: 220,
  targetFats: 60,
  targetWater: 2500,
} as NutritionStatusProps["dailyNutrition"];

const meta = {
  title: "Organisms/Home/NutritionStatusCard",
  component: NutritionStatusCard.Simple,
  tags: ["autodocs"],
} satisfies Meta<typeof NutritionStatusCard.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Populated: Story = {
  args: {
    dailyNutrition: populatedNutrition,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Nutricao de Hoje/i)).toBeVisible();
    await expect(canvas.getByText(/1\/2 refeicoes/i)).toBeVisible();
  },
};

export const EmptyState: Story = {
  args: {
    dailyNutrition: null,
  },
};
