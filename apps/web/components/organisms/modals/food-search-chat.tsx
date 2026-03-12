"use client";

import {
  Check,
  Loader2,
  RotateCcw,
  Send,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { DuoButton } from "@/components/duo";
import { useStudent } from "@/hooks/use-student";
import {
  buildNutritionPreviewPlan,
  getNutritionMealName,
  getNutritionMealTime,
  parsedFoodToFoodItem,
  type NutritionPreviewMeal,
  type NutritionPreviewPlan,
} from "@/lib/ai/parsers/nutrition-parser";
import { NUTRITION_INITIAL_MESSAGE } from "@/lib/ai/prompts/nutrition";
import type { DietType, FoodItem, Meal, NutritionPlanData } from "@/lib/types";
import { nutritionPlanToMeals } from "@/lib/utils/nutrition/nutrition-plan";
import { cn } from "@/lib/utils";
import { useAssistantTransportStore } from "@/stores/assistant-transport-store";
import { useStudentUnifiedStore } from "@/stores/student-unified-store";
import { NutritionPreviewCard } from "./nutrition-preview-card";

interface FoodSearchChatProps {
  onAddFood: (
    foods: Array<{ food: FoodItem; servings: number }>,
    mealIds: string[],
  ) => void;
  onAddMeal: (
    mealsData: Array<{
      name: string;
      type: DietType;
      time?: string;
    }>,
  ) => void;
  onClose: () => void;
  selectedMealId?: string | null;
  meals?: Meal[];
  onSelectMeal?: (mealId: string | null) => void;
  chatStreamUrl?: string;
  onApplyNutrition?: (data: {
    meals: Meal[];
    totals: {
      totalCalories: number;
      totalProtein: number;
      totalCarbs: number;
      totalFats: number;
    };
  }) => Promise<void> | void;
  contextMode?: "student" | "external";
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  nutritionPreview?: NutritionPreviewMeal;
  nutritionPreviewIndex?: number;
}

const EMPTY_MEALS: Meal[] = [];

function isCompletePlanRequest(message: string): boolean {
  return /plano|completo|dia todo|todas as refeicoes|todas refeicoes|todas as meals|todas as refei/i.test(
    message,
  );
}

function normalizeMealIdentity(meal: {
  type?: string | null;
  name?: string | null;
}) {
  return `${meal.type?.trim().toLowerCase() || "snack"}::${meal.name?.trim().toLowerCase() || ""}`;
}

function findMatchingMealIndex(
  meals: Meal[],
  target: { type?: string | null; name?: string | null },
) {
  const exactMatchIndex = meals.findIndex(
    (meal) => normalizeMealIdentity(meal) === normalizeMealIdentity(target),
  );

  if (exactMatchIndex >= 0) {
    return exactMatchIndex;
  }

  return meals.findIndex(
    (meal) =>
      meal.type?.trim().toLowerCase() === target.type?.trim().toLowerCase(),
  );
}

function createMealSkeletons(meals: Meal[]): NutritionPreviewMeal[] {
  const seenKeys = new Set<string>();

  return meals.reduce<NutritionPreviewMeal[]>((accumulator, meal) => {
    const key = `${meal.type}:${meal.name}`;
    if (seenKeys.has(key)) {
      return accumulator;
    }

    seenKeys.add(key);
    accumulator.push({
      type: meal.type,
      name: meal.name || getNutritionMealName(meal.type),
      time: meal.time || getNutritionMealTime(meal.type),
      foods: [],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFats: 0,
    });

    return accumulator;
  }, []);
}

function mergePreviewMeals(
  skeletonMeals: NutritionPreviewMeal[],
  previewMeals: NutritionPreviewMeal[],
): NutritionPreviewMeal[] {
  if (skeletonMeals.length === 0) {
    return previewMeals;
  }

  const previewByType = new Map(
    previewMeals.map((meal) => [meal.type, meal] as const),
  );
  const mergedMeals = skeletonMeals.map((meal) => previewByType.get(meal.type) ?? meal);
  const extraMeals = previewMeals.filter(
    (meal) => !skeletonMeals.some((skeletonMeal) => skeletonMeal.type === meal.type),
  );

  return [...mergedMeals, ...extraMeals];
}

function syncPreviewMessages(
  messages: ChatMessage[],
  previewMeals: NutritionPreviewMeal[],
): ChatMessage[] {
  if (previewMeals.length === 0) {
    return messages.filter((message) => !message.nutritionPreview);
  }

  const nextMessages = [...messages];
  const validIndexes = new Set(previewMeals.map((_, index) => index));

  previewMeals.forEach((meal, index) => {
    const existingIndex = nextMessages.findIndex(
      (message) =>
        message.nutritionPreview &&
        message.nutritionPreviewIndex === index,
    );
    const nextPreviewMessage: ChatMessage = {
      id: `nutrition-preview-${index}`,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      nutritionPreview: meal,
      nutritionPreviewIndex: index,
    };

    if (existingIndex >= 0) {
      nextMessages[existingIndex] = {
        ...nextMessages[existingIndex],
        ...nextPreviewMessage,
      };
      return;
    }

    nextMessages.push(nextPreviewMessage);
  });

  return nextMessages.filter((message) => {
    if (!message.nutritionPreview) {
      return true;
    }

    return (
      typeof message.nutritionPreviewIndex === "number" &&
      validIndexes.has(message.nutritionPreviewIndex)
    );
  });
}

function cloneMeal(meal: Meal): Meal {
  return {
    ...meal,
    foods: [...(meal.foods || [])],
  };
}

function mergeMealsForChat(baseMeals: Meal[], overlayMeals: Meal[]) {
  const mergedMeals = baseMeals.map(cloneMeal);

  overlayMeals.forEach((overlayMeal) => {
    const matchIndex = findMatchingMealIndex(mergedMeals, overlayMeal);
    const nextOverlayMeal = cloneMeal(overlayMeal);

    if (matchIndex >= 0) {
      const baseMeal = mergedMeals[matchIndex];
      mergedMeals[matchIndex] = {
        ...baseMeal,
        ...nextOverlayMeal,
        id: baseMeal.id || nextOverlayMeal.id,
        name: nextOverlayMeal.name || baseMeal.name,
        type: nextOverlayMeal.type || baseMeal.type,
        time: nextOverlayMeal.time || baseMeal.time,
      };
      return;
    }

    mergedMeals.push(nextOverlayMeal);
  });

  return mergedMeals;
}

function upsertPreviewMeal(
  currentMeals: NutritionPreviewMeal[],
  skeletonMeals: NutritionPreviewMeal[],
  nextMeal: NutritionPreviewMeal,
  targetIndex?: number,
) {
  const nextMeals =
    currentMeals.length > 0 ? [...currentMeals] : [...skeletonMeals];

  const resolvedIndex =
    typeof targetIndex === "number" && targetIndex >= 0
      ? targetIndex
      : nextMeals.findIndex(
          (meal) => normalizeMealIdentity(meal) === normalizeMealIdentity(nextMeal),
        );

  if (resolvedIndex >= 0) {
    const previousMeal = nextMeals[resolvedIndex];
    nextMeals[resolvedIndex] = previousMeal
      ? { ...previousMeal, ...nextMeal }
      : nextMeal;
    return nextMeals;
  }

  nextMeals.push(nextMeal);
  return nextMeals;
}

function buildDailyTotals(meals: Meal[]) {
  const completedMeals = meals.filter((meal) => meal.completed);

  return {
    totalCalories: completedMeals.reduce(
      (sum, meal) => sum + (meal.calories || 0),
      0,
    ),
    totalProtein: completedMeals.reduce(
      (sum, meal) => sum + (meal.protein || 0),
      0,
    ),
    totalCarbs: completedMeals.reduce((sum, meal) => sum + (meal.carbs || 0), 0),
    totalFats: completedMeals.reduce((sum, meal) => sum + (meal.fats || 0), 0),
  };
}

function buildFoodsFromPreviewMeal(
  previewMeal: NutritionPreviewMeal,
  mealIndex: number,
  existingFoodsCount: number,
) {
  return previewMeal.foods.map((food, foodIndex) => {
    const parsedFood = parsedFoodToFoodItem(food, existingFoodsCount + foodIndex);
    return {
      id: `food-${Date.now()}-${mealIndex}-${foodIndex}`,
      foodId: parsedFood.id,
      foodName: parsedFood.name,
      servings: food.servings,
      calories: food.calories * food.servings,
      protein: food.protein * food.servings,
      carbs: food.carbs * food.servings,
      fats: food.fats * food.servings,
      servingSize: food.servingSize,
    };
  });
}

function createMealFromPreview(
  previewMeal: NutritionPreviewMeal,
  mealIndex: number,
  existingMeal?: Meal | null,
): Meal {
  const foods = buildFoodsFromPreviewMeal(previewMeal, mealIndex, 0);

  return {
    id: existingMeal?.id || `meal-${Date.now()}-${mealIndex}`,
    name:
      previewMeal.name ||
      existingMeal?.name ||
      getNutritionMealName(previewMeal.type),
    type: previewMeal.type as DietType,
    calories:
      foods.reduce((sum, food) => sum + food.calories, 0) ||
      Math.round(previewMeal.totalCalories),
    protein:
      foods.reduce((sum, food) => sum + food.protein, 0) ||
      Math.round(previewMeal.totalProtein),
    carbs:
      foods.reduce((sum, food) => sum + food.carbs, 0) ||
      Math.round(previewMeal.totalCarbs),
    fats:
      foods.reduce((sum, food) => sum + food.fats, 0) ||
      Math.round(previewMeal.totalFats),
    completed: existingMeal?.completed ?? false,
    time:
      previewMeal.time ||
      existingMeal?.time ||
      getNutritionMealTime(previewMeal.type),
    foods,
  };
}

function replaceMealsWithPreviewPlan(
  baseMeals: Meal[],
  previewMeals: NutritionPreviewMeal[],
) {
  const nextMeals = baseMeals.map(cloneMeal);

  previewMeals.forEach((previewMeal, mealIndex) => {
    const matchIndex = findMatchingMealIndex(nextMeals, previewMeal);
    const existingMeal = matchIndex >= 0 ? nextMeals[matchIndex] : null;
    const nextMeal = createMealFromPreview(previewMeal, mealIndex, existingMeal);

    if (matchIndex >= 0) {
      nextMeals[matchIndex] = nextMeal;
      return;
    }

    nextMeals.push(nextMeal);
  });

  return nextMeals;
}

function appendPreviewPlanToMeals(
  baseMeals: Meal[],
  previewMeals: NutritionPreviewMeal[],
  selectedMeal: Meal | null,
) {
  const nextMeals = baseMeals.map(cloneMeal);

  previewMeals.forEach((previewMeal, mealIndex) => {
    let targetMealIndex = -1;

    if (
      selectedMeal &&
      previewMeal.type === selectedMeal.type &&
      previewMeal.name === selectedMeal.name
    ) {
      targetMealIndex = nextMeals.findIndex((meal) => meal.id === selectedMeal.id);
    }

    if (targetMealIndex === -1) {
      targetMealIndex = findMatchingMealIndex(nextMeals, previewMeal);
    }

    if (targetMealIndex === -1) {
      nextMeals.push({
        id: `meal-${Date.now()}-${mealIndex}`,
        name: previewMeal.name || getNutritionMealName(previewMeal.type),
        type: previewMeal.type as DietType,
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        completed: false,
        time: previewMeal.time || getNutritionMealTime(previewMeal.type),
        foods: [],
      });
      targetMealIndex = nextMeals.length - 1;
    }

    const meal = nextMeals[targetMealIndex];
    const newFoods = buildFoodsFromPreviewMeal(
      previewMeal,
      mealIndex,
      meal.foods.length,
    );

    meal.foods = [...(meal.foods || []), ...newFoods];
    meal.calories += newFoods.reduce((sum, food) => sum + food.calories, 0);
    meal.protein += newFoods.reduce((sum, food) => sum + food.protein, 0);
    meal.carbs += newFoods.reduce((sum, food) => sum + food.carbs, 0);
    meal.fats += newFoods.reduce((sum, food) => sum + food.fats, 0);
  });

  return nextMeals;
}

export function FoodSearchChat({
  onAddFood: _onAddFood,
  onAddMeal: _onAddMeal,
  onClose,
  selectedMealId,
  meals: initialMeals = EMPTY_MEALS,
  onSelectMeal,
  chatStreamUrl = "/api/nutrition/chat-stream",
  onApplyNutrition,
  contextMode = "student",
}: FoodSearchChatProps) {
  const studentDailyNutrition =
    (useStudent("dailyNutrition") as { meals?: Meal[] } | null) ?? null;
  const studentActiveNutritionPlan =
    (useStudent("activeNutritionPlan") as unknown as NutritionPlanData | null) ??
    null;
  const storeMeals = Array.isArray(studentDailyNutrition?.meals)
    ? studentDailyNutrition.meals
    : EMPTY_MEALS;
  const activePlanMeals = useMemo(
    () => nutritionPlanToMeals(studentActiveNutritionPlan),
    [studentActiveNutritionPlan],
  );
  const meals = useMemo(() => {
    if (contextMode !== "student") {
      return initialMeals;
    }

    if (activePlanMeals.length > 0) {
      return mergeMealsForChat(activePlanMeals, storeMeals);
    }

    if (storeMeals.length > 0) {
      return storeMeals;
    }

    return initialMeals;
  }, [activePlanMeals, contextMode, initialMeals, storeMeals]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "nutrition-chat-init",
      role: "assistant",
      content: NUTRITION_INITIAL_MESSAGE,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [previewMeals, setPreviewMeals] = useState<NutritionPreviewMeal[]>([]);
  const [pendingNutritionPlan, setPendingNutritionPlan] =
    useState<NutritionPreviewPlan | null>(null);
  const [pendingApplyMode, setPendingApplyMode] = useState<
    "append" | "replace-plan"
  >("append");
  const [allPreviewComplete, setAllPreviewComplete] = useState(false);
  const [missingExpectedMeals, setMissingExpectedMeals] = useState<string[]>([]);
  const [conversationHistory, setConversationHistory] = useState<
    Array<{
      role: "user" | "assistant";
      content: string;
    }>
  >([]);
  const [remainingMessages, setRemainingMessages] = useState<number | null>(
    null,
  );
  const [localSelectedMealId, setLocalSelectedMealId] = useState<string | null>(
    selectedMealId ?? null,
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const approveInFlightRef = useRef(false);

  const selectedMeal = localSelectedMealId
    ? meals.find((meal) => meal.id === localSelectedMealId) ?? null
    : null;

  useEffect(() => {
    setLocalSelectedMealId(selectedMealId ?? null);
  }, [selectedMealId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const buildPreviewPlan = (
    foods: Array<Record<string, unknown>>,
    fallbackMealType: string | null = selectedMeal?.type ?? null,
  ) =>
    buildNutritionPreviewPlan(
      foods as unknown as Parameters<typeof buildNutritionPreviewPlan>[0],
      {
        fallbackMealType,
        existingMeals: meals.map((meal) => ({
          type: meal.type,
          name: meal.name,
          time: meal.time,
        })),
      },
    );

  const canApprove =
    allPreviewComplete &&
    previewMeals.some((meal) => meal.foods.length > 0) &&
    missingExpectedMeals.length === 0;

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return;

    const userMessage = inputMessage.trim();
    const assistantMessageId = `nutrition-assistant-${Date.now()}`;
    const streamRequestKey = `nutrition-chat:${localSelectedMealId ?? "all"}`;
    const shouldCoverAllMeals =
      isCompletePlanRequest(userMessage) && meals.length > 0;
    const mealSkeletons = shouldCoverAllMeals ? createMealSkeletons(meals) : [];
    const applyMode = shouldCoverAllMeals ? "replace-plan" : "append";
    const fallbackMealTypeForPreview = shouldCoverAllMeals
      ? null
      : selectedMeal?.type ?? null;

    setInputMessage("");
    setAllPreviewComplete(false);
    setPreviewMeals([]);
    setPendingNutritionPlan(null);
    setPendingApplyMode(applyMode);
    setMissingExpectedMeals([]);

    const nextMessages = syncPreviewMessages(
      [
        ...messages,
        {
          id: `nutrition-user-${Date.now()}`,
          role: "user",
          content: userMessage,
          timestamp: new Date(),
        },
        {
          id: assistantMessageId,
          role: "assistant",
          content: "Montando refeicoes...",
          timestamp: new Date(),
        },
      ],
      mealSkeletons,
    );

    setPreviewMeals(mealSkeletons);
    setMessages(nextMessages);
    setConversationHistory((prev) => [
      ...prev,
      { role: "user", content: userMessage },
    ]);
    setIsProcessing(true);

    try {
      const response = await useAssistantTransportStore.getState().openSse({
        key: streamRequestKey,
        url: chatStreamUrl,
        body: {
          message: userMessage,
          conversationHistory,
          existingMeals: meals.map((meal) => ({
            type: meal.type,
            name: meal.name,
            time: meal.time,
          })),
          selectedMeal: shouldCoverAllMeals
            ? null
            : selectedMeal
            ? {
                id: selectedMeal.id,
                type: selectedMeal.type,
                name: selectedMeal.name,
              }
            : null,
        },
      });

      if (!response.ok) {
        const fallbackText = await response.text();
        throw new Error(fallbackText || `HTTP ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/event-stream")) {
        const fallbackText = await response.text();
        throw new Error(fallbackText || "Resposta invalida do servidor.");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) {
        throw new Error("Stream nao disponivel");
      }

      let buffer = "";
      let fullMessage = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() || "";

        for (const block of chunks) {
          if (!block.trim()) continue;

          const eventMatch = block.match(/event: (\w+)/);
          const dataLine = block
            .split("\n")
            .find((line) => line.startsWith("data: "));
          const event = eventMatch?.[1];
          const dataStr = dataLine?.slice(6);

          if (!event || !dataStr) continue;

          const data = JSON.parse(dataStr) as {
            error?: string;
            message?: string;
            delta?: string;
            foods?: Array<Record<string, unknown>>;
            meals?: NutritionPreviewMeal[];
            remainingMessages?: number | null;
          };

          if (event === "status" && data.message) {
            setMessages((prev) =>
              prev.map((message) =>
                message.id === assistantMessageId
                  ? { ...message, content: data.message ?? message.content }
                  : message,
              ),
            );
            continue;
          }

          if (event === "token" && data.delta) {
            fullMessage += data.delta;
            continue;
          }

          if (event === "meal_progress" && data.meals) {
            const streamingMeals = (data.meals as NutritionPreviewMeal[]) ?? [];
            const mergedMeals = mergePreviewMeals(mealSkeletons, streamingMeals);

            setPreviewMeals(mergedMeals);
            setMessages((prev) => syncPreviewMessages(prev, mergedMeals));
            continue;
          }

          if (event === "food_progress" && Array.isArray(data.foods)) {
            const previewPlan = buildPreviewPlan(
              data.foods,
              fallbackMealTypeForPreview,
            );
            const mergedMeals = mergePreviewMeals(
              mealSkeletons,
              previewPlan.meals,
            );

            setPreviewMeals(mergedMeals);
            setMessages((prev) => syncPreviewMessages(prev, mergedMeals));
            continue;
          }

          if (event === "complete") {
            const finalMessage =
              data.message || fullMessage || "Plano alimentar montado.";
            const previewPlan = buildPreviewPlan(
              data.foods || [],
              fallbackMealTypeForPreview,
            );
            const mergedMeals = mergePreviewMeals(
              mealSkeletons,
              previewPlan.meals,
            );
            const missingMeals = mealSkeletons
              .filter((meal) => !previewPlan.meals.some((preview) => preview.type === meal.type))
              .map((meal) => meal.name);
            const finalAssistantMessage =
              missingMeals.length > 0
                ? `${finalMessage} Ainda faltaram: ${missingMeals.join(", ")}.`
                : finalMessage;

            setPreviewMeals(mergedMeals);
            setPendingNutritionPlan(
              mergedMeals.length > 0
                ? {
                    ...previewPlan,
                    meals: mergedMeals,
                  }
                : null,
            );
            setAllPreviewComplete(previewPlan.meals.length > 0);
            setMissingExpectedMeals(missingMeals);
            setRemainingMessages(data.remainingMessages ?? null);
            setConversationHistory((prev) => [
              ...prev,
              { role: "assistant", content: finalAssistantMessage },
            ]);
            setMessages((prev) =>
              syncPreviewMessages(
                prev.map((message) =>
                  message.id === assistantMessageId
                    ? { ...message, content: finalAssistantMessage }
                    : message,
                ),
                mergedMeals,
              ),
            );
            continue;
          }

          if (event === "error") {
            throw new Error(data.error || "Erro ao processar mensagem");
          }
        }
      }
    } catch (error) {
      console.error("[FoodSearchChat] Erro:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Desculpe, ocorreu um erro. Tente novamente.";

      setMessages((prev) =>
        syncPreviewMessages(
          prev.map((chatMessage) =>
            chatMessage.id === assistantMessageId
              ? { ...chatMessage, content: message }
              : chatMessage,
          ),
          [],
        ),
      );
    } finally {
      useAssistantTransportStore.getState().finishRequest(streamRequestKey);
      setIsProcessing(false);
    }
  };

  const handleRefazer = () => {
    const refazerMessage =
      "O que voce quer ajustar? Posso trocar alimentos, distribuir melhor os macros ou reorganizar as refeicoes.";

    setPreviewMeals([]);
    setPendingNutritionPlan(null);
    setAllPreviewComplete(false);
    setMissingExpectedMeals([]);
    setMessages((prev) =>
      syncPreviewMessages(
        [
          ...prev,
          {
            id: `nutrition-refazer-${Date.now()}`,
            role: "assistant",
            content: refazerMessage,
            timestamp: new Date(),
          },
        ],
        [],
      ),
    );
    setConversationHistory((prev) => [
      ...prev,
      { role: "assistant", content: refazerMessage },
    ]);
  };

  const handleApprove = async () => {
    if (
      approveInFlightRef.current ||
      !pendingNutritionPlan ||
      pendingNutritionPlan.meals.length === 0
    ) {
      return;
    }

    approveInFlightRef.current = true;
    setIsApproving(true);

    try {
      const nextMeals =
        pendingApplyMode === "replace-plan"
          ? replaceMealsWithPreviewPlan(meals, pendingNutritionPlan.meals)
          : appendPreviewPlanToMeals(meals, pendingNutritionPlan.meals, selectedMeal);

      const totals = buildDailyTotals(nextMeals);

      if (onApplyNutrition) {
        await onApplyNutrition({ meals: nextMeals, totals });
      } else if (contextMode === "student") {
        await useStudentUnifiedStore.getState().updateNutrition({
          meals: nextMeals,
          ...totals,
        });
      } else {
        throw new Error("Nao foi possivel aplicar o plano alimentar.");
      }

      onClose();
    } catch (error) {
      console.error("[FoodSearchChat] Erro ao aprovar plano:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao aplicar plano alimentar.";
      setMessages((prev) => [
        ...prev,
        {
          id: `nutrition-approve-error-${Date.now()}`,
          role: "assistant",
          content: message,
          timestamp: new Date(),
        },
      ]);
    } finally {
      approveInFlightRef.current = false;
      setIsApproving(false);
    }
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
          className="w-full max-w-2xl rounded-t-3xl bg-duo-bg-card sm:rounded-3xl"
          onClick={(event) => event.stopPropagation()}
          style={{
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div className="border-b-2 border-duo-border p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-duo-green" />
                <h2 className="text-2xl font-bold text-duo-text">
                  Chat IA - Nutricao
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-duo-bg-elevated"
              >
                x
              </button>
            </div>

            {remainingMessages !== null && remainingMessages >= 0 && (
              <div className="mt-2 text-xs">
                {remainingMessages > 0 ? (
                  <span className="font-bold text-duo-green">
                    {remainingMessages} mensagem
                    {remainingMessages !== 1 ? "s" : ""} restante
                    {remainingMessages !== 1 ? "s" : ""} hoje
                  </span>
                ) : (
                  <span className="font-bold text-red-600">
                    Limite diario atingido. Tente novamente amanha.
                  </span>
                )}
              </div>
            )}

            {meals.length > 0 && (
              <div className="mt-4">
                <div className="mb-2 text-xs font-bold text-duo-fg-muted">
                  Refeicao padrao (opcional)
                </div>
                <div className="flex flex-wrap gap-2">
                  <DuoButton
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setLocalSelectedMealId(null);
                      onSelectMeal?.(null);
                    }}
                    className={cn(
                      "min-h-0 rounded-lg border-2 px-3 py-1.5 text-xs",
                      !localSelectedMealId
                        ? "border-duo-green bg-duo-green/10 text-duo-green shadow-[0_2px_0_#58A700]"
                        : "border-duo-border bg-duo-bg-card text-duo-text hover:border-duo-green/50",
                    )}
                  >
                    Qualquer
                  </DuoButton>
                  {meals.map((meal) => {
                    const isSelected = localSelectedMealId === meal.id;

                    return (
                      <DuoButton
                        key={meal.id}
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setLocalSelectedMealId(meal.id);
                          onSelectMeal?.(meal.id);
                        }}
                        className={cn(
                          "min-h-0 rounded-lg border-2 px-3 py-1.5 text-xs",
                          isSelected
                            ? "border-duo-green bg-duo-green/10 text-duo-green shadow-[0_2px_0_#58A700]"
                            : "border-duo-border bg-duo-bg-card text-duo-text hover:border-duo-green/50",
                        )}
                      >
                        {meal.name}
                      </DuoButton>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div
            className="flex-1 space-y-4 overflow-y-auto p-6"
            style={{ maxHeight: "50vh" }}
          >
            {messages.map((message, index) => {
              if (message.nutritionPreview) {
                const previewIndex =
                  typeof message.nutritionPreviewIndex === "number"
                    ? message.nutritionPreviewIndex
                    : index;

                return (
                  <div
                    key={`${message.id}-${previewIndex}-${message.nutritionPreview.type}`}
                    className="flex justify-start"
                  >
                    <div className="w-full max-w-[92%]">
                      <NutritionPreviewCard
                        meal={message.nutritionPreview}
                        index={previewIndex}
                        defaultExpanded={
                          !allPreviewComplete &&
                          previewIndex === previewMeals.length - 1
                        }
                        isStreaming={
                          !allPreviewComplete &&
                          previewIndex === previewMeals.length - 1
                        }
                      />
                    </div>
                  </div>
                );
              }

              if (!message.content.trim()) return null;

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-duo-primary text-white"
                        : "bg-duo-bg-elevated text-duo-fg"
                    }`}
                  >
                    <p className="text-sm text-inherit">{message.content}</p>
                  </div>
                </motion.div>
              );
            })}

            {allPreviewComplete && previewMeals.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex justify-center gap-3"
              >
                <DuoButton
                  onClick={handleApprove}
                  disabled={isApproving || !canApprove}
                  variant="primary"
                  className="flex items-center gap-2 px-6 py-3"
                >
                  {isApproving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Aplicando...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Aprovar
                    </>
                  )}
                </DuoButton>
                <DuoButton
                  onClick={handleRefazer}
                  disabled={isApproving || isProcessing}
                  variant="outline"
                  className="flex items-center gap-2 rounded-xl border-2 border-duo-border px-6 py-3 font-bold hover:bg-duo-bg-elevated"
                >
                  <RotateCcw className="h-4 w-4" />
                  Refazer
                </DuoButton>
              </motion.div>
            )}

            {allPreviewComplete && missingExpectedMeals.length > 0 && (
              <div className="rounded-xl border border-duo-orange bg-duo-orange/10 p-3 text-center text-sm font-bold text-duo-orange">
                Ainda faltam refeicoes para completar o plano:{" "}
                {missingExpectedMeals.join(", ")}.
              </div>
            )}

            {isProcessing && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-duo-bg-elevated px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-duo-green" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="border-t-2 border-duo-border p-4">
            {remainingMessages !== null && remainingMessages >= 0 && (
              <div className="mb-2 text-center text-xs text-duo-fg-muted">
                {remainingMessages > 0 ? (
                  <span className="font-bold text-duo-green">
                    {remainingMessages} mensagem
                    {remainingMessages !== 1 ? "s" : ""} restante
                    {remainingMessages !== 1 ? "s" : ""} hoje
                  </span>
                ) : (
                  <span className="font-bold text-red-600">
                    Limite diario atingido. Tente novamente amanha.
                  </span>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(event) => setInputMessage(event.target.value)}
                onKeyPress={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleSendMessage();
                  }
                }}
                placeholder="Descreva as refeicoes ou o plano que voce quer montar..."
                className="flex-1 rounded-xl border-2 border-duo-border px-4 py-3 text-sm font-bold text-duo-text placeholder:text-duo-fg-muted focus:border-duo-green focus:outline-none disabled:cursor-not-allowed disabled:bg-duo-bg-elevated"
                disabled={
                  isProcessing ||
                  (remainingMessages !== null && remainingMessages <= 0)
                }
              />
              <button
                type="button"
                onClick={() => void handleSendMessage()}
                disabled={
                  !inputMessage.trim() ||
                  isProcessing ||
                  (remainingMessages !== null && remainingMessages <= 0)
                }
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-duo-primary text-white transition-colors disabled:cursor-not-allowed disabled:bg-duo-border"
              >
                {isProcessing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
