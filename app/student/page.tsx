"use client";

import { Suspense } from "react";
import { parseAsString, useQueryState } from "nuqs";
import { LearningPath } from "@/components/learning-path";
import { PersonalizationPage } from "@/components/personalization-page";
import { CardioFunctionalPage } from "@/components/cardio-functional-page";
import { DietPage } from "@/components/diet-page";
import { MuscleExplorer } from "@/components/muscle-explorer";
import { EducationalLessons } from "@/components/educational-lessons";
import { EducationPage } from "@/components/education-page";
import { ShopCard } from "@/components/shop-card";
import { ProfilePage } from "@/components/profile-page";
import { StudentPaymentsPage } from "@/components/student-payments-page";
import { StudentMoreMenu } from "@/components/student-more-menu";
import { mockUnits } from "@/lib/mock-data";
import { GymMap } from "@/components/gym-map";
import { mockGymLocations } from "@/lib/gym-mock-data";
import { Home, Dumbbell, Heart, Flame, Zap } from "lucide-react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { HoverScale } from "@/components/animations/hover-scale";
import { WhileInView } from "@/components/animations/while-in-view";
import { motion } from "motion/react";
import { useUIStore, useStudentStore } from "@/stores";
import { StatCardLarge } from "@/components/ui/stat-card-large";
import { SectionCard } from "@/components/ui/section-card";
import { NavigationCard } from "@/components/ui/navigation-card";

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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <StatCardLarge
                icon={Flame}
                value={progress.currentStreak}
                label="dias de sequência"
                subtitle={`Recorde: ${progress.longestStreak || 0}`}
                iconColor="duo-orange"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
            >
              <StatCardLarge
                icon={Zap}
                value={`${progress.todayXP} XP`}
                label="ganho hoje"
                subtitle={`Total: ${progress.totalXP || 0} XP`}
                iconColor="duo-yellow"
              />
            </motion.div>
          </div>

          <WhileInView delay={0.4}>
            <SectionCard
              icon={Heart}
              title="Personalização com IA"
              className="space-y-4"
            >
              <p className="text-sm text-duo-gray-dark">
                Crie treinos e dietas personalizados
              </p>
              <PersonalizationPage />
            </SectionCard>
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
        <GymMap
          gyms={mockGymLocations}
          dayPasses={dayPasses}
          onPurchaseDayPass={handlePurchaseDayPass}
        />
      )}

      {tab === "education" && (
        <>
          {educationView === "menu" && (
            <EducationPage
              onSelectView={(view) => {
                setEducationView(view);
              }}
            />
          )}

          {educationView === "muscles" && (
            <MuscleExplorer
              muscleId={muscleId || null}
              exerciseId={exerciseId || null}
              onMuscleSelect={(id) => setMuscleId(id)}
              onExerciseSelect={(id) => setExerciseId(id)}
              onBack={() => {
                setEducationView("menu");
                setMuscleId(null);
                setExerciseId(null);
              }}
            />
          )}

          {educationView === "lessons" && (
            <EducationalLessons
              lessonId={lessonId || null}
              onLessonSelect={(id) => setLessonId(id)}
              onBack={() => {
                setEducationView("menu");
                setLessonId(null);
              }}
            />
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
