"use client";

import { Suspense, useState, useEffect } from "react";
import { parseAsString, useQueryState } from "nuqs";

import { PersonalizationPage } from "@/app/student/personalization/personalization-page";
import { CardioFunctionalPage } from "@/app/student/cardio/cardio-functional-page";
import { DietPage } from "@/app/student/diet/diet-page";
import { EducationPage } from "@/app/student/education/education-page";
import { ProfilePage } from "@/app/student/profile/profile-page";
import { StudentPaymentsPage } from "@/app/student/payments/student-payments-page";
import { LearningPath } from "@/app/student/learn/learning-path";
import { StudentMoreMenu } from "@/app/student/more/student-more-menu";
import { MuscleExplorer } from "@/app/student/education/muscle-explorer";
import { EducationalLessons } from "@/app/student/education/educational-lessons";

import { GymMap } from "@/components/gym-map";
import { Heart, Flame, Zap } from "lucide-react";
import { FadeIn } from "@/components/animations/fade-in";
import { WhileInView } from "@/components/animations/while-in-view";
import { motion } from "motion/react";
import { useStudentStore } from "@/stores";
import { StatCardLarge } from "@/components/ui/stat-card-large";
import { SectionCard } from "@/components/ui/section-card";
import { ShopCard } from "@/components/shop-card";
import type { Unit } from "@/lib/types";
import type { GymLocation } from "@/lib/types";

import type { UserProgress, WorkoutHistory, PersonalRecord } from "@/lib/types";

interface ProfileData {
  progress: UserProgress;
  workoutHistory: WorkoutHistory[];
  personalRecords: PersonalRecord[];
  weightHistory: Array<{ date: Date | string; weight: number }>;
}

interface StudentHomeContentProps {
  units: Unit[];
  gymLocations: GymLocation[];
  initialProgress: {
    currentStreak: number;
    longestStreak: number;
    totalXP: number;
    todayXP: number;
  };
  profileData?: ProfileData;
  subscription?: {
    id: string;
    plan: string;
    status: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    canceledAt: Date | null;
    trialStart: Date | null;
    trialEnd: Date | null;
    isTrial: boolean;
    daysRemaining: number | null;
  } | null;
}

function StudentHomeContent({
  units,
  gymLocations,
  initialProgress,
  profileData,
  subscription,
}: StudentHomeContentProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [tab] = useQueryState("tab", parseAsString.withDefault("home"));
  const [educationView, setEducationView] = useQueryState(
    "view",
    parseAsString.withDefault("menu")
  );
  const [muscleId, setMuscleId] = useQueryState("muscle", parseAsString);
  const [exerciseId, setExerciseId] = useQueryState("exercise", parseAsString);
  const [lessonId, setLessonId] = useQueryState("lesson", parseAsString);
  const { dayPasses, addDayPass } = useStudentStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const progress = useStudentStore((state) => state.progress);
  const displayProgress = {
    currentStreak: progress.currentStreak || initialProgress.currentStreak,
    longestStreak: progress.longestStreak || initialProgress.longestStreak,
    totalXP: progress.totalXP || initialProgress.totalXP,
    todayXP: progress.todayXP || initialProgress.todayXP,
  };

  const handleLessonSelect = (_lessonId: string) => {
    // Lesson selection handled by workout store
  };

  const handlePurchaseDayPass = (gymId: string) => {
    const gym = gymLocations.find((g) => g.id === gymId);
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
      initial={isMounted ? { opacity: 0 } : false}
      animate={isMounted ? { opacity: 1 } : false}
      transition={{ duration: 0.2 }}
      className="px-4 py-6"
      suppressHydrationWarning
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
                value={displayProgress.currentStreak}
                label="dias de sequência"
                subtitle={`Recorde: ${displayProgress.longestStreak || 0}`}
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
                value={`${displayProgress.todayXP} XP`}
                label="ganho hoje"
                subtitle={`Total: ${displayProgress.totalXP || 0} XP`}
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
          {units && units.length > 0 ? (
            <LearningPath
              key="learning-path"
              units={units}
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

      {tab === "payments" && (
        <StudentPaymentsPage
          subscription={subscription}
          startTrial={async () => {
            const response = await fetch("/api/subscriptions/start-trial", {
              method: "POST",
            });
            const data = await response.json();
            return data;
          }}
        />
      )}

      {tab === "gyms" && (
        <GymMap
          gyms={gymLocations}
          dayPasses={dayPasses}
          onPurchaseDayPass={handlePurchaseDayPass}
        />
      )}

      {tab === "education" && (
        <>
          {educationView === "menu" &&
            !exerciseId &&
            !muscleId &&
            !lessonId && (
              <EducationPage
                onSelectView={(view) => {
                  setEducationView(view);
                }}
              />
            )}

          {(educationView === "muscles" || exerciseId || muscleId) && (
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

          {educationView === "lessons" && !exerciseId && !muscleId && (
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

      {tab === "profile" && profileData && (
        <ProfilePage
          progress={profileData.progress}
          workoutHistory={profileData.workoutHistory}
          personalRecords={profileData.personalRecords}
          weightHistory={profileData.weightHistory}
        />
      )}

      {tab === "more" && <StudentMoreMenu />}
    </motion.div>
  );
}

export default function StudentHome({
  units,
  gymLocations,
  initialProgress,
  profileData,
  subscription,
}: StudentHomeContentProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-8">
          Carregando...
        </div>
      }
    >
      <StudentHomeContent
        units={units}
        gymLocations={gymLocations}
        initialProgress={initialProgress}
        profileData={profileData}
        subscription={subscription}
      />
    </Suspense>
  );
}
