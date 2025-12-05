"use client"

import { useState } from "react"
import { mockFoodDatabase } from "@/lib/mock-data"
import type { FoodItem } from "@/lib/types"
import { Search, Plus } from "lucide-react"

interface FoodSearchProps {
  onAddFood: (food: FoodItem, servings: number) => void
  onClose: () => void
}

export function FoodSearch({ onAddFood, onClose }: FoodSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null)
  const [servings, setServings] = useState(1)

  const filteredFoods = mockFoodDatabase.filter((food) => food.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleAddFood = () => {
    if (selectedFood) {
      onAddFood(selectedFood, servings)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="w-full max-w-2xl rounded-t-3xl bg-white sm:rounded-3xl">
        <div className="border-b-2 border-duo-gray-border p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-duo-text">Adicionar Alimento</h2>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-duo-gray-light"
            >
              ✕
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-duo-gray-dark" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar alimentos..."
              className="w-full rounded-xl border-2 border-duo-gray-border py-3 pl-12 pr-4 font-bold text-duo-text placeholder:text-duo-gray-light focus:border-duo-blue focus:outline-none"
            />
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto p-6">
          <div className="space-y-2">
            {filteredFoods.map((food) => (
              <button
                key={food.id}
                onClick={() => setSelectedFood(food)}
                className={`w-full rounded-2xl border-2 p-4 text-left transition-all hover:border-duo-blue ${
                  selectedFood?.id === food.id ? "border-duo-blue bg-duo-blue/5" : "border-duo-gray-border"
                }`}
              >
                <div className="mb-2 font-bold text-duo-text">{food.name}</div>
                <div className="flex gap-4 text-sm text-duo-gray-dark">
                  <span>{food.calories} cal</span>
                  <span>P: {food.protein}g</span>
                  <span>C: {food.carbs}g</span>
                  <span>G: {food.fats}g</span>
                </div>
                <div className="mt-1 text-xs text-duo-gray-dark">{food.servingSize}</div>
              </button>
            ))}
          </div>
        </div>

        {selectedFood && (
          <div className="border-t-2 border-duo-gray-border p-6">
            <div className="mb-4">
              <label className="mb-2 block text-sm font-bold text-duo-gray-dark">Porções</label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={servings}
                onChange={(e) => setServings(Number.parseFloat(e.target.value) || 1)}
                className="w-full rounded-xl border-2 border-duo-gray-border px-4 py-3 font-bold text-duo-text focus:border-duo-blue focus:outline-none"
              />
            </div>
            <button onClick={handleAddFood} className="duo-button-green w-full">
              <Plus className="mr-2 h-5 w-5" />
              ADICIONAR ALIMENTO
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
