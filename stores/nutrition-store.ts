import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { DailyNutrition, FoodItem, Meal, MealFoodItem, DietType } from "@/lib/types"
import { mockDailyNutrition } from "@/lib/mock-data"

interface NutritionState {
  dailyNutrition: DailyNutrition
  foodDatabase: FoodItem[]
  setDailyNutrition: (nutrition: DailyNutrition) => void
  updateMeal: (mealId: string, updates: Partial<Meal>) => void
  toggleMealComplete: (mealId: string) => void
  addFoodToMeal: (mealId: string, food: FoodItem, servings: number) => void
  addMeal: (mealData: {
    name: string
    type: DietType | "afternoon-snack" | "pre-workout" | "post-workout"
    time: string
  }) => void
  addMeals: (mealsData: Array<{
    name: string
    type: DietType | "afternoon-snack" | "pre-workout" | "post-workout"
    time: string
  }>) => void
  removeMeal: (mealId: string) => void
  removeFoodFromMeal: (mealId: string, foodId: string) => void
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
          
          // Calcula totais de TODAS as refeições (não só completas) e arredonda para 1 casa decimal
          const totalCalories = Math.round(updatedMeals.reduce((sum, m) => sum + m.calories, 0) * 10) / 10
          const totalProtein = Math.round(updatedMeals.reduce((sum, m) => sum + m.protein, 0) * 10) / 10
          const totalCarbs = Math.round(updatedMeals.reduce((sum, m) => sum + m.carbs, 0) * 10) / 10
          const totalFats = Math.round(updatedMeals.reduce((sum, m) => sum + m.fats, 0) * 10) / 10

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
          
          // Calcula totais de TODAS as refeições (não só completas) e arredonda para 1 casa decimal
          const totalCalories = Math.round(updatedMeals.reduce((sum, m) => sum + m.calories, 0) * 10) / 10
          const totalProtein = Math.round(updatedMeals.reduce((sum, m) => sum + m.protein, 0) * 10) / 10
          const totalCarbs = Math.round(updatedMeals.reduce((sum, m) => sum + m.carbs, 0) * 10) / 10
          const totalFats = Math.round(updatedMeals.reduce((sum, m) => sum + m.fats, 0) * 10) / 10

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

          // Calcula valores nutricionais do alimento multiplicado pelas porções
          const calories = food.calories * servings
          const protein = food.protein * servings
          const carbs = food.carbs * servings
          const fats = food.fats * servings

          // Cria o item de alimento para a lista
          const mealFoodItem: MealFoodItem = {
            id: `${food.id}-${Date.now()}`,
            foodId: food.id,
            foodName: food.name,
            servings,
            calories,
            protein,
            carbs,
            fats,
            servingSize: food.servingSize,
          }

          // Adiciona o alimento à lista de alimentos da refeição
          const existingFoods = meal.foods || []
          const updatedFoods = [...existingFoods, mealFoodItem]

          // Adiciona os valores à refeição e arredonda para 1 casa decimal
          const updatedMeal: Meal = {
            ...meal,
            calories: Math.round((meal.calories + calories) * 10) / 10,
            protein: Math.round((meal.protein + protein) * 10) / 10,
            carbs: Math.round((meal.carbs + carbs) * 10) / 10,
            fats: Math.round((meal.fats + fats) * 10) / 10,
            foods: updatedFoods,
          }

          const updatedMeals = state.dailyNutrition.meals.map((m) =>
            m.id === mealId ? updatedMeal : m
          )

          // IMPORTANTE: Calcula totais de TODAS as refeições (completas ou não)
          // Esses valores são usados automaticamente nos cards de macro nutrientes
          // Arredonda para 1 casa decimal
          const totalCalories = Math.round(updatedMeals.reduce((sum, m) => sum + m.calories, 0) * 10) / 10
          const totalProtein = Math.round(updatedMeals.reduce((sum, m) => sum + m.protein, 0) * 10) / 10
          const totalCarbs = Math.round(updatedMeals.reduce((sum, m) => sum + m.carbs, 0) * 10) / 10
          const totalFats = Math.round(updatedMeals.reduce((sum, m) => sum + m.fats, 0) * 10) / 10

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
      addMeal: (mealData) =>
        set((state) => {
          // Mapeia tipos customizados para tipos padrão quando necessário
          const mealType: DietType =
            mealData.type === "afternoon-snack" || mealData.type === "pre-workout" || mealData.type === "post-workout"
              ? "snack"
              : mealData.type

          const newMeal: Meal = {
            id: `meal-${Date.now()}`,
            name: mealData.name,
            type: mealType,
            calories: 0,
            protein: 0,
            carbs: 0,
            fats: 0,
            completed: false,
            time: mealData.time,
            foods: [],
          }

          const updatedMeals = [...state.dailyNutrition.meals, newMeal]

          return {
            dailyNutrition: {
              ...state.dailyNutrition,
              meals: updatedMeals,
            },
          }
        }),
      addMeals: (mealsData) =>
        set((state) => {
          const newMeals: Meal[] = mealsData.map((mealData, index) => {
            // Mapeia tipos customizados para tipos padrão quando necessário
            const mealType: DietType =
              mealData.type === "afternoon-snack" || mealData.type === "pre-workout" || mealData.type === "post-workout"
                ? "snack"
                : mealData.type

            return {
              id: `meal-${Date.now()}-${index}`,
              name: mealData.name,
              type: mealType,
              calories: 0,
              protein: 0,
              carbs: 0,
              fats: 0,
              completed: false,
              time: mealData.time,
              foods: [],
            }
          })

          const updatedMeals = [...state.dailyNutrition.meals, ...newMeals]

          return {
            dailyNutrition: {
              ...state.dailyNutrition,
              meals: updatedMeals,
            },
          }
        }),
      removeMeal: (mealId) =>
        set((state) => {
          const updatedMeals = state.dailyNutrition.meals.filter((m) => m.id !== mealId)
          
          // Recalcula totais após remover a refeição e arredonda para 1 casa decimal
          const totalCalories = Math.round(updatedMeals.reduce((sum, m) => sum + m.calories, 0) * 10) / 10
          const totalProtein = Math.round(updatedMeals.reduce((sum, m) => sum + m.protein, 0) * 10) / 10
          const totalCarbs = Math.round(updatedMeals.reduce((sum, m) => sum + m.carbs, 0) * 10) / 10
          const totalFats = Math.round(updatedMeals.reduce((sum, m) => sum + m.fats, 0) * 10) / 10

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
      removeFoodFromMeal: (mealId, foodId) =>
        set((state) => {
          const meal = state.dailyNutrition.meals.find((m) => m.id === mealId)
          if (!meal) return state

          const foodToRemove = meal.foods?.find((f) => f.id === foodId)
          if (!foodToRemove) return state

          // Remove o alimento da lista
          const updatedFoods = meal.foods?.filter((f) => f.id !== foodId) || []

          // Subtrai os valores nutricionais do alimento removido e arredonda para 1 casa decimal
          const updatedMeal: Meal = {
            ...meal,
            calories: Math.max(0, Math.round((meal.calories - foodToRemove.calories) * 10) / 10),
            protein: Math.max(0, Math.round((meal.protein - foodToRemove.protein) * 10) / 10),
            carbs: Math.max(0, Math.round((meal.carbs - foodToRemove.carbs) * 10) / 10),
            fats: Math.max(0, Math.round((meal.fats - foodToRemove.fats) * 10) / 10),
            foods: updatedFoods,
          }

          const updatedMeals = state.dailyNutrition.meals.map((m) =>
            m.id === mealId ? updatedMeal : m
          )

          // Recalcula totais após remover o alimento e arredonda para 1 casa decimal
          const totalCalories = Math.round(updatedMeals.reduce((sum, m) => sum + m.calories, 0) * 10) / 10
          const totalProtein = Math.round(updatedMeals.reduce((sum, m) => sum + m.protein, 0) * 10) / 10
          const totalCarbs = Math.round(updatedMeals.reduce((sum, m) => sum + m.carbs, 0) * 10) / 10
          const totalFats = Math.round(updatedMeals.reduce((sum, m) => sum + m.fats, 0) * 10) / 10

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

