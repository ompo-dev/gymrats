"use client";

import { Suspense } from "react";
import { parseAsString, useQueryState } from "nuqs";
import { LearningPath } from "@/components/learning-path";
import { PersonalizationPage } from "@/components/personalization-page";
import { CardioFunctionalPage } from "@/components/cardio-functional-page";
import { DietPage } from "@/components/diet-page";
import { MuscleExplorer } from "@/components/muscle-explorer";
import { EducationalLessons } from "@/components/educational-lessons";
import { ShopCard } from "@/components/shop-card";
import { ProfilePage } from "@/components/profile-page";
import { StudentPaymentsPage } from "@/components/student-payments-page";
import { StudentMoreMenu } from "@/components/student-more-menu";
import { mockUnits } from "@/lib/mock-data";
import { GymMap } from "@/components/gym-map";
import { mockGymLocations } from "@/lib/gym-mock-data";
import { Home, Dumbbell, Heart } from "lucide-react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { HoverScale } from "@/components/animations/hover-scale";
import { WhileInView } from "@/components/animations/while-in-view";
import { motion } from "motion/react";
import { useUIStore, useStudentStore } from "@/stores";

function StudentHomeContent() {
  const [tab] = useQueryState("tab", parseAsString.withDefault("home"));
  const [educationView, setEducationView] = useQueryState(
    "view",
    parseAsString.withDefault("menu")
  );
  const [muscleId, setMuscleId] = useQueryState("muscle", parseAsString);
  const [exerciseId, setExerciseId] = useQueryState("exercise", parseAsString);
  const [lessonId, setLessonId] = useQueryState("lesson", parseAsString);
  const { progress, dayPasses, addDayPass } = useStudentStore();

  const handleLessonSelect = (lessonId: string) => {
    console.log("[v0] Selected lesson:", lessonId);
  };

  const handlePurchaseDayPass = (gymId: string) => {
    const gym = mockGymLocations.find((g) => g.id === gymId);
    if (!gym) return;

    const newPass = {
      id: `pass-${Date.now()}`,
      gymId: gym.id,
      gymName: gym.name,
      purchaseDate: new Date(),
      validDate: new Date(Date.now() + 86400000),
      price: gym.plans.daily,
      status: "active" as const,
      qrCode: `QR_${gym.id}_${Date.now()}`,
    };

    addDayPass(newPass);
    alert(`Diária comprada com sucesso! R$ ${gym.plans.daily.toFixed(2)}`);
  };

  return (
    <motion.div
      key={tab}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="px-4 py-6"
    >
      {tab === "home" && (
        <div className="mx-auto max-w-2xl space-y-6">
          <FadeIn>
            <div className="text-center">
              <h1 className="mb-2 text-3xl font-bold text-duo-text">
                Olá, Atleta!
              </h1>
              <p className="text-sm text-duo-gray-dark">
                Continue sua jornada fitness de hoje
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-2 gap-4">
            <HoverScale>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="rounded-2xl border-2 border-duo-orange bg-gradient-to-br from-duo-orange/10 to-duo-red/10 p-4 text-center"
              >
                <Home className="mx-auto mb-2 h-10 w-10 fill-duo-orange text-duo-orange" />
                <div className="mb-1 text-2xl font-bold text-duo-text">
                  {progress.currentStreak}
                </div>
                <div className="text-xs font-bold text-duo-gray-dark">
                  dias de sequência
                </div>
              </motion.div>
            </HoverScale>

            <HoverScale>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="rounded-2xl border-2 border-duo-green bg-gradient-to-br from-duo-green/10 to-duo-blue/10 p-4 text-center"
              >
                <Dumbbell className="mx-auto mb-2 h-10 w-10 text-duo-green" />
                <div className="mb-1 text-2xl font-bold text-duo-text">
                  {progress.todayXP} XP
                </div>
                <div className="text-xs font-bold text-duo-gray-dark">
                  ganho hoje
                </div>
              </motion.div>
            </HoverScale>
          </div>

          <SlideIn delay={0.2}>
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-duo-text">
                Comece seu treino
              </h2>

              <motion.a
                href="/student?tab=learn"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25, duration: 0.4 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="block w-full rounded-2xl border-2 border-duo-green bg-gradient-to-br from-duo-green/10 to-duo-blue/10 p-4 text-left shadow-sm transition-shadow hover:shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-duo-green text-2xl shadow-md">
                    <Dumbbell className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-duo-text">
                      Treino de Musculação
                    </h3>
                    <p className="text-xs text-duo-gray-dark">
                      Continue seu programa personalizado
                    </p>
                  </div>
                </div>
              </motion.a>

              <motion.a
                href="/student?tab=cardio"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="block w-full rounded-2xl border-2 border-duo-red bg-gradient-to-br from-duo-red/10 to-duo-orange/10 p-4 text-left shadow-sm transition-shadow hover:shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-duo-red text-2xl shadow-md">
                    <Heart className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-duo-text">
                      Cardio e Funcional
                    </h3>
                    <p className="text-xs text-duo-gray-dark">
                      Corrida, natação, exercícios funcionais
                    </p>
                  </div>
                </div>
              </motion.a>

              <motion.a
                href="/student?tab=diet"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35, duration: 0.4 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="block w-full rounded-2xl border-2 border-duo-orange bg-gradient-to-br from-duo-orange/10 to-duo-yellow/10 p-4 text-left shadow-sm transition-shadow hover:shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-duo-orange text-2xl shadow-md">
                    <Heart className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-duo-text">Gestão de Dieta</h3>
                    <p className="text-xs text-duo-gray-dark">
                      Acompanhe suas refeições e macros
                    </p>
                  </div>
                </div>
              </motion.a>
            </div>
          </SlideIn>

          <WhileInView delay={0.4}>
            <motion.div
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl border-2 border-duo-yellow bg-gradient-to-br from-duo-yellow/10 to-duo-orange/10 p-6"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-duo-yellow">
                  <Heart className="h-7 w-7 text-white" />
                </div>
                <div>
                  <div className="font-bold text-duo-text">
                    Personalização com IA
                  </div>
                  <div className="text-xs text-duo-gray-dark">
                    Crie treinos e dietas personalizados
                  </div>
                </div>
              </div>
              <PersonalizationPage />
            </motion.div>
          </WhileInView>

          <WhileInView delay={0.5}>
            <ShopCard />
          </WhileInView>
        </div>
      )}

      {tab === "learn" && (
        <div className="pb-8" key="learn-tab">
          {mockUnits && mockUnits.length > 0 ? (
            <LearningPath
              key="learning-path"
              units={mockUnits}
              onLessonSelect={handleLessonSelect}
            />
          ) : (
            <div className="flex items-center justify-center p-8">
              <p className="text-duo-gray-dark">Carregando treinos...</p>
            </div>
          )}
        </div>
      )}

      {tab === "cardio" && <CardioFunctionalPage />}

      {tab === "diet" && <DietPage />}

      {tab === "payments" && <StudentPaymentsPage />}

      {tab === "gyms" && (
        <div className="h-[calc(100vh-180px)]">
          <div className="mb-4 text-center">
            <h1 className="mb-2 text-2xl font-bold text-duo-text">
              Academias Parceiras
            </h1>
            <p className="text-sm text-duo-gray-dark">
              Encontre academias próximas e compre diárias
            </p>
          </div>
          <GymMap
            gyms={mockGymLocations}
            dayPasses={dayPasses}
            onPurchaseDayPass={handlePurchaseDayPass}
          />
        </div>
      )}

      {tab === "education" && (
        <>
          {educationView === "menu" && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="mb-2 text-3xl font-bold text-duo-text">
                  Central de Aprendizado
                </h1>
                <p className="text-sm text-duo-gray-dark">
                  Conhecimento baseado em ciência
                </p>
              </div>

              <div className="grid gap-4">
                <button
                  onClick={() => setEducationView("muscles")}
                  className="rounded-2xl border-2 border-duo-blue bg-gradient-to-br from-duo-blue/10 to-duo-green/10 p-6 text-left transition-all hover:shadow-lg"
                >
                  <div className="mb-2 text-4xl">💪</div>
                  <h3 className="mb-2 text-xl font-bold text-duo-text">
                    Anatomia e Exercícios
                  </h3>
                  <p className="text-sm text-duo-gray-dark">
                    Explore músculos, funções e técnicas corretas de execução
                  </p>
                </button>

                <button
                  onClick={() => setEducationView("lessons")}
                  className="rounded-2xl border-2 border-duo-green bg-gradient-to-br from-duo-green/10 to-duo-yellow/10 p-6 text-left transition-all hover:shadow-lg"
                >
                  <div className="mb-2 text-4xl">📚</div>
                  <h3 className="mb-2 text-xl font-bold text-duo-text">
                    Lições de Ciência
                  </h3>
                  <p className="text-sm text-duo-gray-dark">
                    Aprenda sobre hipertrofia, nutrição e recuperação com
                    evidências
                  </p>
                </button>
              </div>
            </div>
          )}

          {educationView === "muscles" && (
            <div>
              <button
                onClick={() => {
                  setEducationView("menu");
                  setMuscleId(null);
                  setExerciseId(null);
                }}
                className="mb-4 flex items-center gap-2 font-bold text-duo-blue hover:underline"
              >
                ← Voltar
              </button>
              <MuscleExplorer
                muscleId={muscleId || null}
                exerciseId={exerciseId || null}
                onMuscleSelect={(id) => setMuscleId(id)}
                onExerciseSelect={(id) => setExerciseId(id)}
                onBack={() => {
                  setMuscleId(null);
                  setExerciseId(null);
                }}
              />
            </div>
          )}

          {educationView === "lessons" && (
            <div>
              <button
                onClick={() => {
                  setEducationView("menu");
                  setLessonId(null);
                }}
                className="mb-4 flex items-center gap-2 font-bold text-duo-green hover:underline"
              >
                ← Voltar
              </button>
              <EducationalLessons
                lessonId={lessonId || null}
                onLessonSelect={(id) => setLessonId(id)}
                onBack={() => setLessonId(null)}
              />
            </div>
          )}
        </>
      )}

      {tab === "profile" && <ProfilePage />}

      {tab === "more" && <StudentMoreMenu />}
    </motion.div>
  );
}

export default function StudentHome() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-8">
          Carregando...
        </div>
      }
    >
      <StudentHomeContent />
    </Suspense>
  );
}
