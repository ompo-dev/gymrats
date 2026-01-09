"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Loader2, Sparkles } from "lucide-react";
import type { FoodItem, Meal } from "@/lib/types";
import { apiClient } from "@/lib/api/client";
import {
  parseNutritionResponse,
  parsedFoodToFoodItem,
} from "@/lib/ai/parsers/nutrition-parser";
import { NUTRITION_INITIAL_MESSAGE } from "@/lib/ai/prompts/nutrition";
import { useStudent } from "@/hooks/use-student";
import { useStudentUnifiedStore } from "@/stores/student-unified-store";
import { Button } from "@/components/atoms/buttons/button";

interface FoodSearchChatProps {
  onAddFood: (
    foods: Array<{ food: FoodItem; servings: number }>,
    mealIds: string[]
  ) => void;
  onAddMeal: (
    mealsData: Array<{
      name: string;
      type: string;
      time?: string;
    }>
  ) => void;
  onClose: () => void;
  selectedMealId?: string | null;
  meals?: Meal[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ExtractedFood {
  name: string;
  servings: number;
  mealType: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servingSize: string;
  category:
    | "protein"
    | "carbs"
    | "vegetables"
    | "fruits"
    | "fats"
    | "dairy"
    | "snacks";
  confidence: number;
}

export function FoodSearchChat({
  onAddFood,
  onAddMeal,
  onClose,
  selectedMealId,
  meals: initialMeals = [],
}: FoodSearchChatProps) {
  // Buscar meals atualizados do store para ter dados sempre atualizados
  const storeMeals = useStudent("dailyNutrition")?.meals || [];
  const meals = storeMeals.length > 0 ? storeMeals : initialMeals;
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: NUTRITION_INITIAL_MESSAGE,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedFoods, setExtractedFoods] = useState<ExtractedFood[]>([]);
  const [conversationHistory, setConversationHistory] = useState<
    Array<{
      role: "user" | "assistant";
      content: string;
    }>
  >([]);
  const [remainingMessages, setRemainingMessages] = useState<number | null>(
    null
  );
  const [pendingFoodsToAdd, setPendingFoodsToAdd] = useState<{
    foodsByMealType: Record<
      string,
      Array<{ food: FoodItem; servings: number }>
    >;
    mealsToCreate: Array<{ name: string; type: string; time?: string }>;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus no input ao montar
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Observar mudanças nos meals para adicionar alimentos após criação de refeições
  useEffect(() => {
    if (!pendingFoodsToAdd) return;

    const { foodsByMealType, mealsToCreate } = pendingFoodsToAdd;

    console.log("[FoodSearchChat] Verificando se refeições foram criadas:", {
      mealsCount: meals.length,
      mealsToCreate: mealsToCreate.length,
      currentMeals: meals.map((m) => ({
        id: m.id,
        type: m.type,
        name: m.name,
      })),
      mealsToCreateTypes: mealsToCreate.map((m) => m.type),
    });

    // Verificar se todas as refeições foram criadas
    const allMealsCreated = mealsToCreate.every((mealToCreate) =>
      meals.some((m) => m.type === mealToCreate.type)
    );

    if (allMealsCreated && meals.length > 0) {
      console.log(
        "[FoodSearchChat] ✅ Todas as refeições foram criadas, adicionando alimentos agora"
      );

      // Adicionar alimentos nas refeições criadas
      let allFoodsAdded = true;
      Object.entries(foodsByMealType).forEach(([mealType, foods]) => {
        const meal = meals.find((m) => m.type === mealType);
        if (meal) {
          console.log(
            `[FoodSearchChat] Adicionando ${foods.length} alimento(s) na refeição ${meal.name} (${meal.id})`
          );
          onAddFood(foods, [meal.id]);
        } else {
          console.error(
            `[FoodSearchChat] ❌ ERRO: Refeição do tipo ${mealType} não encontrada após criação`
          );
          allFoodsAdded = false;
        }
      });

      if (allFoodsAdded) {
        // Limpar estado pendente apenas se todos os alimentos foram adicionados
        setPendingFoodsToAdd(null);
        console.log(
          "[FoodSearchChat] ✅ Todos os alimentos foram adicionados, fechando modal"
        );
        onClose();
      } else {
        console.error("[FoodSearchChat] ❌ Erro ao adicionar alguns alimentos");
      }
    } else {
      const missingMeals = mealsToCreate.filter(
        (mealToCreate) => !meals.some((m) => m.type === mealToCreate.type)
      );
      console.log(
        "[FoodSearchChat] ⏳ Ainda aguardando criação de refeições...",
        {
          allMealsCreated,
          mealsLength: meals.length,
          missingMeals: missingMeals.map((m) => m.type),
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meals, pendingFoodsToAdd]);

  // Timeout de segurança: se após 5 segundos ainda não adicionou, fechar
  useEffect(() => {
    if (!pendingFoodsToAdd) return;

    const timeoutId = setTimeout(() => {
      console.warn(
        "[FoodSearchChat] Timeout ao aguardar criação de refeições após 5 segundos"
      );
      console.warn("[FoodSearchChat] Estado pendente:", pendingFoodsToAdd);
      console.warn(
        "[FoodSearchChat] Meals atuais:",
        meals.map((m) => ({ id: m.id, type: m.type, name: m.name }))
      );
      setPendingFoodsToAdd(null);
      onClose();
    }, 5000); // Aumentado para 5 segundos para dar mais tempo

    return () => clearTimeout(timeoutId);
  }, [pendingFoodsToAdd, onClose, meals]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");

    // Adicionar mensagem do usuário
    const newUserMessage: ChatMessage = {
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setConversationHistory((prev) => [
      ...prev,
      { role: "user", content: userMessage },
    ]);

    setIsProcessing(true);

    try {
      // Preparar informações sobre refeições existentes para a IA
      const existingMeals = meals.map((m) => ({
        type: m.type,
        name: m.name,
      }));

      // Chamar API
      const response = await apiClient.post<{
        foods: ExtractedFood[];
        message: string;
        needsConfirmation: boolean;
        remainingMessages?: number;
      }>("/api/nutrition/chat", {
        message: userMessage,
        conversationHistory,
        existingMeals, // Enviar refeições existentes para a IA entender o contexto
      });

      // Adicionar resposta da IA
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: response.data.message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setConversationHistory((prev) => [
        ...prev,
        { role: "assistant", content: response.data.message },
      ]);

      // Processar alimentos extraídos (IA já retorna dados completos)
      if (response.data.foods && response.data.foods.length > 0) {
        setExtractedFoods(response.data.foods);
      }

      // Atualizar mensagens restantes
      if (response.data.remainingMessages !== undefined) {
        setRemainingMessages(response.data.remainingMessages);
      }
    } catch (error: any) {
      console.error("[FoodSearchChat] Erro:", error);

      // Tratar erro de limite atingido
      if (error.response?.status === 429) {
        const errorMessage: ChatMessage = {
          role: "assistant",
          content:
            error.response?.data?.message ||
            "Você atingiu o limite de 20 mensagens por dia. Tente novamente amanhã.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } else {
        const errorMessage: ChatMessage = {
          role: "assistant",
          content:
            error.response?.data?.message ||
            "Desculpe, ocorreu um erro. Tente novamente.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmAdd = async () => {
    if (extractedFoods.length === 0) return;

    console.log("[FoodSearchChat] Iniciando adição de alimentos:", {
      extractedFoodsCount: extractedFoods.length,
      currentMealsCount: meals.length,
      currentMeals: meals.map((m) => ({
        id: m.id,
        type: m.type,
        name: m.name,
      })),
    });

    // Agrupar alimentos por tipo de refeição
    const foodsByMealType = extractedFoods.reduce((acc, extracted) => {
      if (!acc[extracted.mealType]) {
        acc[extracted.mealType] = [];
      }
      acc[extracted.mealType].push(extracted);
      return acc;
    }, {} as Record<string, ExtractedFood[]>);

    const mealsToCreate: Array<{
      name: string;
      type: string;
      time?: string;
    }> = [];
    const foodsToAddByMealType: Record<
      string,
      Array<{
        food: FoodItem;
        servings: number;
      }>
    > = {};

    // Processar cada tipo de refeição
    Object.entries(foodsByMealType).forEach(([mealType, foods]) => {
      // Verificar se refeição existe
      const existingMeal = meals.find((m) => m.type === mealType);

      if (!existingMeal) {
        // Criar refeição
        const mealNames: Record<string, string> = {
          breakfast: "Café da Manhã",
          lunch: "Almoço",
          dinner: "Jantar",
          snack: "Lanche",
          "afternoon-snack": "Café da Tarde",
          "pre-workout": "Pré Treino",
          "post-workout": "Pós Treino",
        };

        mealsToCreate.push({
          name: mealNames[mealType] || mealType,
          type: mealType,
          time: getDefaultTime(mealType),
        });
        console.log(
          `[FoodSearchChat] Refeição ${mealType} não existe, será criada`
        );
      } else {
        console.log(
          `[FoodSearchChat] Refeição ${mealType} já existe: ${existingMeal.name} (${existingMeal.id})`
        );
      }

      // Converter alimentos extraídos para FoodItem (IA já retorna dados completos)
      if (!foodsToAddByMealType[mealType]) {
        foodsToAddByMealType[mealType] = [];
      }

      foods.forEach((extracted, idx) => {
        const foodItem = parsedFoodToFoodItem(extracted, idx);
        foodsToAddByMealType[mealType].push({
          food: foodItem,
          servings: extracted.servings,
        });
      });
    });

    // IMPORTANTE: Criar refeições COM alimentos já dentro, tudo de uma vez
    // Isso evita problemas de timing e garante que tudo seja feito em uma única operação
    if (mealsToCreate.length > 0) {
      console.log(
        "[FoodSearchChat] Criando refeições com alimentos já dentro:",
        {
          mealsToCreate: mealsToCreate.length,
          foodsToAdd: Object.values(foodsToAddByMealType).flat().length,
        }
      );

      // Buscar store atual para pegar meals existentes
      const storeState = useStudentUnifiedStore.getState();
      const currentNutrition = storeState.data.dailyNutrition;
      const currentMeals = currentNutrition?.meals || [];

      // Criar novas refeições COM alimentos já dentro
      const newMeals = mealsToCreate.map((mealToCreate) => {
        const foods = foodsToAddByMealType[mealToCreate.type] || [];

        // Calcular totais dos alimentos
        const totalCalories = foods.reduce(
          (sum, { food, servings }) => sum + food.calories * servings,
          0
        );
        const totalProtein = foods.reduce(
          (sum, { food, servings }) => sum + food.protein * servings,
          0
        );
        const totalCarbs = foods.reduce(
          (sum, { food, servings }) => sum + food.carbs * servings,
          0
        );
        const totalFats = foods.reduce(
          (sum, { food, servings }) => sum + food.fats * servings,
          0
        );

        // Criar refeição com alimentos já dentro
        return {
          id: `meal-${Date.now()}-${Math.random()}`,
          name: mealToCreate.name,
          type: mealToCreate.type,
          calories: totalCalories,
          protein: totalProtein,
          carbs: totalCarbs,
          fats: totalFats,
          completed: false,
          time: mealToCreate.time,
          foods: foods.map(({ food, servings }, idx) => ({
            id: `food-${Date.now()}-${idx}-${Math.random()}`,
            foodId: food.id,
            foodName: food.name,
            servings,
            calories: food.calories * servings,
            protein: food.protein * servings,
            carbs: food.carbs * servings,
            fats: food.fats * servings,
            servingSize: food.servingSize,
          })),
        };
      });

      // Adicionar refeições existentes que já têm alimentos
      Object.entries(foodsToAddByMealType).forEach(([mealType, foods]) => {
        const existingMeal = currentMeals.find((m) => m.type === mealType);
        if (existingMeal) {
          // Adicionar alimentos na refeição existente
          const mealIndex = currentMeals.findIndex(
            (m) => m.id === existingMeal.id
          );
          if (mealIndex !== -1) {
            const newFoods = foods.map(({ food, servings }, idx) => ({
              id: `food-${Date.now()}-${idx}-${Math.random()}`,
              foodId: food.id,
              foodName: food.name,
              servings,
              calories: food.calories * servings,
              protein: food.protein * servings,
              carbs: food.carbs * servings,
              fats: food.fats * servings,
              servingSize: food.servingSize,
            }));

            const updatedFoods = [...(existingMeal.foods || []), ...newFoods];
            const totalNewCalories = newFoods.reduce(
              (sum, f) => sum + f.calories,
              0
            );
            const totalNewProtein = newFoods.reduce(
              (sum, f) => sum + f.protein,
              0
            );
            const totalNewCarbs = newFoods.reduce((sum, f) => sum + f.carbs, 0);
            const totalNewFats = newFoods.reduce((sum, f) => sum + f.fats, 0);

            currentMeals[mealIndex] = {
              ...existingMeal,
              foods: updatedFoods,
              calories: existingMeal.calories + totalNewCalories,
              protein: existingMeal.protein + totalNewProtein,
              carbs: existingMeal.carbs + totalNewCarbs,
              fats: existingMeal.fats + totalNewFats,
            };
          }
        }
      });

      // Combinar todas as refeições (existentes atualizadas + novas)
      const allMeals = [...currentMeals, ...newMeals];

      // Calcular totais apenas de refeições completadas
      const completedMeals = allMeals.filter((m: any) => m.completed === true);
      const totals = {
        totalCalories: completedMeals.reduce(
          (sum: number, m: any) => sum + (m.calories || 0),
          0
        ),
        totalProtein: completedMeals.reduce(
          (sum: number, m: any) => sum + (m.protein || 0),
          0
        ),
        totalCarbs: completedMeals.reduce(
          (sum: number, m: any) => sum + (m.carbs || 0),
          0
        ),
        totalFats: completedMeals.reduce(
          (sum: number, m: any) => sum + (m.fats || 0),
          0
        ),
      };

      // Atualizar store UMA ÚNICA VEZ com tudo
      const { updateNutrition } = useStudentUnifiedStore.getState();
      console.log("[FoodSearchChat] Atualizando store com", {
        totalMeals: allMeals.length,
        newMeals: newMeals.length,
        foodsAdded: Object.values(foodsToAddByMealType).flat().length,
      });

      await updateNutrition({
        meals: allMeals,
        ...totals,
      });

      console.log(
        "[FoodSearchChat] ✅ Refeições e alimentos adicionados com sucesso, fechando modal"
      );
      onClose();
    } else {
      // Todas as refeições já existem, adicionar diretamente
      console.log(
        "[FoodSearchChat] Todas as refeições já existem, adicionando alimentos diretamente"
      );
      let allFoodsAdded = true;

      Object.entries(foodsToAddByMealType).forEach(([mealType, foods]) => {
        const meal = meals.find((m) => m.type === mealType);
        if (meal) {
          console.log(
            `[FoodSearchChat] Adicionando ${foods.length} alimento(s) na refeição ${meal.name} (${meal.id})`
          );
          onAddFood(foods, [meal.id]);
        } else {
          console.error(
            `[FoodSearchChat] ERRO: Refeição do tipo ${mealType} não encontrada mesmo após verificação`
          );
          allFoodsAdded = false;
        }
      });

      if (allFoodsAdded) {
        console.log(
          "[FoodSearchChat] Todos os alimentos foram adicionados, fechando modal"
        );
        onClose();
      } else {
        console.error("[FoodSearchChat] Erro ao adicionar alguns alimentos");
      }
    }
  };

  const getDefaultTime = (mealType: string): string => {
    const times: Record<string, string> = {
      breakfast: "08:00",
      lunch: "12:30",
      dinner: "19:30",
      snack: "15:00",
      "afternoon-snack": "15:00",
      "pre-workout": "17:00",
      "post-workout": "18:30",
    };
    return times[mealType] || "12:00";
  };

  const getMealName = (mealType: string): string => {
    const names: Record<string, string> = {
      breakfast: "Café da Manhã",
      lunch: "Almoço",
      dinner: "Jantar",
      snack: "Lanche",
      "afternoon-snack": "Café da Tarde",
      "pre-workout": "Pré Treino",
      "post-workout": "Pós Treino",
    };
    return names[mealType] || mealType;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-60 flex items-end justify-center bg-black/50 sm:items-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 300,
            duration: 0.3,
          }}
          className="w-full max-w-2xl rounded-t-3xl bg-white sm:rounded-3xl"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div className="border-b-2 border-gray-300 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-duo-green" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Chat IA - Nutrição
                </h2>
              </div>
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
              >
                ✕
              </button>
            </div>
            {remainingMessages !== null && remainingMessages >= 0 && (
              <div className="mt-2 text-xs">
                {remainingMessages > 0 ? (
                  <span className="text-duo-green font-bold">
                    {remainingMessages} mensagem
                    {remainingMessages !== 1 ? "s" : ""} restante
                    {remainingMessages !== 1 ? "s" : ""} hoje
                  </span>
                ) : (
                  <span className="text-red-600 font-bold">
                    Limite diário atingido. Tente novamente amanhã.
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto p-6 space-y-4"
            style={{ maxHeight: "50vh" }}
          >
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-duo-green text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>
              </motion.div>
            ))}

            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-duo-green" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Extracted Foods Preview */}
          {extractedFoods.length > 0 && (
            <div className="border-t-2 border-gray-300 p-4 bg-gray-50">
              <h3 className="text-sm font-bold text-gray-900 mb-2">
                Alimentos identificados:
              </h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {extractedFoods.map((extracted, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs bg-white rounded-lg p-2"
                  >
                    <div className="flex-1">
                      <span className="font-bold text-gray-900">
                        {extracted.name}
                      </span>
                      <span className="text-gray-600 ml-2">
                        ({extracted.servings} porção
                        {extracted.servings !== 1 ? "ões" : ""})
                      </span>
                      <div className="text-gray-500 mt-0.5">
                        {extracted.calories} cal • P: {extracted.protein}g • C:{" "}
                        {extracted.carbs}g • G: {extracted.fats}g
                      </div>
                      <div className="text-gray-400 text-xs mt-0.5">
                        {getMealName(extracted.mealType)}
                      </div>
                    </div>
                    {extracted.confidence >= 0.8 ? (
                      <span className="text-duo-green text-xs">✓</span>
                    ) : (
                      <span className="text-duo-orange text-xs">⚠</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t-2 border-gray-300 p-4">
            {remainingMessages !== null && remainingMessages >= 0 && (
              <div className="mb-2 text-xs text-gray-600 text-center">
                {remainingMessages > 0 ? (
                  <span className="text-duo-green font-bold">
                    {remainingMessages} mensagem
                    {remainingMessages !== 1 ? "s" : ""} restante
                    {remainingMessages !== 1 ? "s" : ""} hoje
                  </span>
                ) : (
                  <span className="text-red-600 font-bold">
                    Limite diário atingido. Tente novamente amanhã.
                  </span>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Descreva o que você comeu..."
                className="flex-1 rounded-xl border-2 border-gray-300 px-4 py-3 text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:border-duo-green focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={
                  isProcessing ||
                  (remainingMessages !== null && remainingMessages <= 0)
                }
              />
              <button
                onClick={handleSendMessage}
                disabled={
                  !inputMessage.trim() ||
                  isProcessing ||
                  (remainingMessages !== null && remainingMessages <= 0)
                }
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-duo-green text-white disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Button */}
          {extractedFoods.length > 0 && (
            <div className="border-t-2 border-gray-300 p-4">
              <Button
                onClick={handleConfirmAdd}
                className="w-full"
                variant="default"
              >
                ADICIONAR {extractedFoods.length} ALIMENTO
                {extractedFoods.length !== 1 ? "S" : ""}
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
