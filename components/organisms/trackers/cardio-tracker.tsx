"use client";

import { useState, useEffect } from "react";
import type { CardioType, UserProfile } from "@/lib/types";
import {
  calculateCardioCalories,
  calculateTargetHeartRateZone,
} from "@/lib/calorie-calculator";
import {
  Play,
  Pause,
  Square,
  Heart,
  Flame,
  Timer,
  TrendingUp,
} from "lucide-react";
import { OptionSelector } from "@/components/molecules/selectors/option-selector";
import { Button } from "@/components/atoms/buttons/button";
import { StatCardLarge } from "@/components/molecules/cards/stat-card-large";
import { SectionCard } from "@/components/molecules/cards/section-card";
import { DuoCard } from "@/components/molecules/cards/duo-card";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

const mockUserProfile: UserProfile = {
  id: "1",
  name: "User",
  age: 28,
  gender: "male",
  weight: 75,
  height: 175,
  fitnessLevel: "intermediario",
  weeklyWorkoutFrequency: 4,
  workoutDuration: 60,
  goals: ["ganhar-massa"],
  availableEquipment: [],
  gymType: "academia-completa",
  preferredWorkoutTime: "manha",
  preferredSets: 3,
  preferredRepRange: "hipertrofia",
  restTime: "medio",
};

const cardioTypes: {
  type: CardioType;
  label: string;
  emoji: string;
  avgCaloriesPerMin: number;
}[] = [
  { type: "corrida", label: "Corrida", emoji: "🏃", avgCaloriesPerMin: 10 },
  {
    type: "bicicleta",
    label: "Bicicleta",
    emoji: "🚴",
    avgCaloriesPerMin: 8,
  },
  { type: "natacao", label: "Natação", emoji: "🏊", avgCaloriesPerMin: 11 },
  { type: "remo", label: "Remo", emoji: "🚣", avgCaloriesPerMin: 9 },
  {
    type: "eliptico",
    label: "Elíptico",
    emoji: "⚡",
    avgCaloriesPerMin: 7,
  },
  {
    type: "pular-corda",
    label: "Pular Corda",
    emoji: "🪢",
    avgCaloriesPerMin: 12,
  },
  {
    type: "caminhada",
    label: "Caminhada",
    emoji: "🚶",
    avgCaloriesPerMin: 4,
  },
  { type: "hiit", label: "HIIT", emoji: "💥", avgCaloriesPerMin: 14 },
];

const intensityOptions = [
  { value: "baixa", label: "Baixa", emoji: "🐢" },
  { value: "moderada", label: "Moderada", emoji: "🚶" },
  { value: "alta", label: "Alta", emoji: "🏃" },
  { value: "muito-alta", label: "Muito Alta", emoji: "💥" },
];

export function CardioTracker() {
  const [selectedType, setSelectedType] = useState<CardioType>("corrida");
  const [isRunning, setIsRunning] = useState(false);
  const [duration, setDuration] = useState(0);
  const [intensity, setIntensity] = useState<
    "baixa" | "moderada" | "alta" | "muito-alta"
  >("moderada");
  const [heartRate, setHeartRate] = useState(0);
  const [distance, setDistance] = useState(0);

  const selected = cardioTypes.find((c) => c.type === selectedType)!;
  const targetHRZone = calculateTargetHeartRateZone(
    mockUserProfile.age,
    "cardio"
  );
  const estimatedCalories =
    duration > 0
      ? calculateCardioCalories(
          selectedType,
          duration,
          intensity,
          mockUserProfile
        )
      : 0;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
        setDistance((prev) => prev + 0.01);
        setHeartRate(() => {
          const baseHR = 60 + mockUserProfile.age;
          const intensityMultiplier = {
            baixa: 1.2,
            moderada: 1.4,
            alta: 1.6,
            "muito-alta": 1.8,
          }[intensity];
          return Math.round(baseHR * intensityMultiplier);
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, intensity]);

  const cardioOptions = cardioTypes.map((cardio) => ({
    value: cardio.type,
    label: cardio.label,
    emoji: cardio.emoji,
  }));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <FadeIn>
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold text-duo-text">
            Treino Cardio
          </h1>
          <p className="text-sm text-duo-gray-dark">
            Acompanhe seu treino em tempo real
          </p>
        </div>
      </FadeIn>

      <SlideIn delay={0.1}>
        <SectionCard title="Selecione a Modalidade" icon={Heart}>
          <OptionSelector
            options={cardioOptions}
            value={selectedType}
            onChange={(value) => setSelectedType(value as CardioType)}
            layout="grid"
            columns={2}
            size="md"
            textAlign="center"
            animate={true}
          />
        </SectionCard>
      </SlideIn>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <StatCardLarge
            icon={Timer}
            value={formatTime(duration)}
            label="Duração"
            iconColor="duo-orange"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          <StatCardLarge
            icon={Flame}
            value={estimatedCalories}
            label="Calorias"
            iconColor="duo-red"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <StatCardLarge
            icon={TrendingUp}
            value={distance.toFixed(2)}
            label="Distância (km)"
            iconColor="duo-green"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
        >
          <StatCardLarge
            icon={Heart}
            value={heartRate}
            label="FC (bpm)"
            iconColor="duo-red"
          />
        </motion.div>
      </div>

      <SlideIn delay={0.4}>
        <SectionCard title="Zona de FC Alvo (Cardio)" icon={Heart}>
          <div className="mb-2 flex items-center justify-between text-xs text-duo-gray-dark">
            <span>{targetHRZone.min} bpm</span>
            <span>{targetHRZone.max} bpm</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-duo-border">
            <div
              className="h-full bg-linear-to-r from-pink-400 to-pink-600 transition-all"
              style={{
                width:
                  heartRate > 0
                    ? `${Math.min((heartRate / targetHRZone.max) * 100, 100)}%`
                    : "0%",
              }}
            />
          </div>
        </SectionCard>
      </SlideIn>

      <SlideIn delay={0.5}>
        <SectionCard title="Intensidade" icon={Flame}>
          <OptionSelector
            options={intensityOptions}
            value={intensity}
            onChange={(value) =>
              setIntensity(
                value as "baixa" | "moderada" | "alta" | "muito-alta"
              )
            }
            layout="grid"
            columns={2}
            size="md"
            textAlign="center"
            animate={true}
          />
        </SectionCard>
      </SlideIn>

      <SlideIn delay={0.6}>
        <div className="flex gap-3">
          <Button
            onClick={() => setIsRunning(!isRunning)}
            className="flex-1"
            variant="default"
          >
            {isRunning ? (
              <>
                <Pause className="h-5 w-5" />
                PAUSAR
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                INICIAR
              </>
            )}
          </Button>
          <Button
            onClick={() => {
              setIsRunning(false);
              setDuration(0);
              setDistance(0);
              setHeartRate(0);
            }}
            variant="white"
            size="icon-lg"
          >
            <Square className="h-5 w-5" />
          </Button>
        </div>
      </SlideIn>

      <SlideIn delay={0.7}>
        <DuoCard variant="blue" size="md">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <div className="mb-1 text-sm font-bold text-duo-blue">Dica</div>
              <p className="text-xs text-duo-gray-dark">
                O cálculo de calorias considera seu peso, idade, gênero e perfil
                hormonal para maior precisão!
              </p>
            </div>
          </div>
        </DuoCard>
      </SlideIn>
    </div>
  );
}
