import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { DailyNutrition, FoodItem, Meal } from "@/lib/types"
import { mockDailyNutrition } from "@/lib/mock-data"

interface NutritionState {
  dailyNutrition: DailyNutrition
  foodDatabase: FoodItem[]
  setDailyNutrition: (nutrition: DailyNutrition) => void
  updateMeal: (mealId: string, updates: Partial<Meal>) => void
  toggleMealComplete: (mealId: string) => void
  addFoodToMeal: (mealId: string, food: FoodItem, servings: number) => void
  updateWaterIntake: (amount: number) => void
  setFoodDatabase: (foods: FoodItem[]) => void
  addFoodToDatabase: (food: FoodItem) => void
}

export const useNutritionStore = create<NutritionState>()(
  persist(
    (set, get) => ({
      dailyNutrition: mockDailyNutrition,
      foodDatabase: [],
      setDailyNutrition: (nutrition) => set({ dailyNutrition: nutrition }),
      updateMeal: (mealId, updates) =>
        set((state) => {
          const updatedMeals = state.dailyNutrition.meals.map((meal) =>
            meal.id === mealId ? { ...meal, ...updates } : meal
          )
          
          const completedMeals = updatedMeals.filter((m) => m.completed)
          const totalCalories = completedMeals.reduce((sum, m) => sum + m.calories, 0)
          const totalProtein = completedMeals.reduce((sum, m) => sum + m.protein, 0)
          const totalCarbs = completedMeals.reduce((sum, m) => sum + m.carbs, 0)
          const totalFats = completedMeals.reduce((sum, m) => sum + m.fats, 0)

          return {
            dailyNutrition: {
              ...state.dailyNutrition,
              meals: updatedMeals,
              totalCalories,
              totalProtein,
              totalCarbs,
              totalFats,
            },
          }
        }),
      toggleMealComplete: (mealId) =>
        set((state) => {
          const updatedMeals = state.dailyNutrition.meals.map((meal) =>
            meal.id === mealId ? { ...meal, completed: !meal.completed } : meal
          )
          
          const completedMeals = updatedMeals.filter((m) => m.completed)
          const totalCalories = completedMeals.reduce((sum, m) => sum + m.calories, 0)
          const totalProtein = completedMeals.reduce((sum, m) => sum + m.protein, 0)
          const totalCarbs = completedMeals.reduce((sum, m) => sum + m.carbs, 0)
          const totalFats = completedMeals.reduce((sum, m) => sum + m.fats, 0)

          return {
            dailyNutrition: {
              ...state.dailyNutrition,
              meals: updatedMeals,
              totalCalories,
              totalProtein,
              totalCarbs,
              totalFats,
            },
          }
        }),
      addFoodToMeal: (mealId, food, servings) =>
        set((state) => {
          const meal = state.dailyNutrition.meals.find((m) => m.id === mealId)
          if (!meal) return state

          const calories = food.calories * servings
          const protein = food.protein * servings
          const carbs = food.carbs * servings
          const fats = food.fats * servings

          const updatedMeal: Meal = {
            ...meal,
            calories: meal.calories + calories,
            protein: meal.protein + protein,
            carbs: meal.carbs + carbs,
            fats: meal.fats + fats,
          }

          const updatedMeals = state.dailyNutrition.meals.map((m) =>
            m.id === mealId ? updatedMeal : m
          )

          const completedMeals = updatedMeals.filter((m) => m.completed)
          const totalCalories = completedMeals.reduce((sum, m) => sum + m.calories, 0)
          const totalProtein = completedMeals.reduce((sum, m) => sum + m.protein, 0)
          const totalCarbs = completedMeals.reduce((sum, m) => sum + m.carbs, 0)
          const totalFats = completedMeals.reduce((sum, m) => sum + m.fats, 0)

          return {
            dailyNutrition: {
              ...state.dailyNutrition,
              meals: updatedMeals,
              totalCalories,
              totalProtein,
              totalCarbs,
              totalFats,
            },
          }
        }),
      updateWaterIntake: (amount) =>
        set((state) => ({
          dailyNutrition: {
            ...state.dailyNutrition,
            waterIntake: amount,
          },
        })),
      setFoodDatabase: (foods) => set({ foodDatabase: foods }),
      addFoodToDatabase: (food) =>
        set((state) => ({
          foodDatabase: [...state.foodDatabase, food],
        })),
    }),
    {
      name: "nutrition-storage",
    }
  )
)

