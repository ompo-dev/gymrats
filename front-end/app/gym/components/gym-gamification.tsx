"use client";

import type { GymProfile } from "@/lib/types";
import { SectionCard } from "@/components/ui/section-card";
import { DuoCard } from "@/components/ui/duo-card";
import { StatCardLarge } from "@/components/ui/stat-card-large";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { motion } from "motion/react";
import {
  Trophy,
  Flame,
  Target,
  TrendingUp,
  Award,
  Users,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GymGamificationPageProps {
  profile: GymProfile;
}

export function GymGamificationPage({ profile }: GymGamificationPageProps) {
  const { gamification } = profile;

  const mockAchievements = [
    {
      id: "1",
      title: "100 Alunos Ativos",
      description: "Alcance 100 alunos ativos simultaneamente",
      icon: "👥",
      progress: 87,
      target: 100,
      xpReward: 500,
      unlocked: false,
    },
    {
      id: "2",
      title: "Sequência de 30 Dias",
      description: "Mantenha a academia aberta por 30 dias consecutivos",
      icon: "🔥",
      progress: 30,
      target: 30,
      xpReward: 300,
      unlocked: true,
    },
    {
      id: "3",
      title: "Taxa de Retenção 95%",
      description: "Mantenha uma taxa de retenção acima de 95%",
      icon: "💎",
      progress: 94,
      target: 95,
      xpReward: 1000,
      unlocked: false,
    },
    {
      id: "4",
      title: "200 Check-ins em um Dia",
      description: "Alcance 200 check-ins em um único dia",
      icon: "⚡",
      progress: 67,
      target: 200,
      xpReward: 400,
      unlocked: false,
    },
  ];

  const mockRanking = [
    { position: 1, name: "FitLife Academia", xp: 15670, city: "São Paulo" },
    { position: 2, name: "Strong Gym", xp: 12450, city: "Rio de Janeiro" },
    {
      position: 3,
      name: "PowerFit Academia",
      xp: 2450,
      city: "São Paulo",
      isCurrentGym: true,
    },
    { position: 4, name: "Iron Paradise", xp: 2120, city: "Belo Horizonte" },
    { position: 5, name: "Muscle Factory", xp: 1980, city: "Curitiba" },
  ];

  const progressToNextLevel =
    (gamification.xp / (gamification.xp + gamification.xpToNextLevel)) * 100;

  return (
    <div className="mx-auto max-w-4xl space-y-6  ">
      <FadeIn>
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold text-duo-text">
            Gamificação da Academia
          </h1>
          <p className="text-sm text-duo-gray-dark">
            Acompanhe suas conquistas e compare-se com outras academias
          </p>
        </div>
      </FadeIn>

      <SlideIn delay={0.1}>
        <SectionCard title="Nível e Progresso" icon={Trophy} variant="orange">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-duo-orange">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-duo-gray-dark">
                  Nível Atual
                </p>
                <p className="text-3xl font-bold text-duo-orange">
                  {gamification.level}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-duo-gray-dark">
                Próximo Nível
              </p>
              <p className="text-3xl font-bold text-duo-text">
                {gamification.level + 1}
              </p>
            </div>
          </div>

          <div className="mb-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-bold text-duo-text">Progresso</span>
              <span className="text-xs text-duo-gray-dark">
                {gamification.xp} /{" "}
                {gamification.xp + gamification.xpToNextLevel} XP
              </span>
            </div>
            <div className="h-6 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-duo-orange transition-all"
                style={{ width: `${progressToNextLevel}%` }}
              />
            </div>
          </div>
          <p className="text-center text-xs text-duo-gray-dark">
            Faltam{" "}
            <span className="font-bold text-duo-orange">
              {gamification.xpToNextLevel} XP
            </span>{" "}
            para o próximo nível
          </p>
        </SectionCard>
      </SlideIn>

      <SlideIn delay={0.2}>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCardLarge
            icon={Flame}
            value={String(gamification.currentStreak)}
            label="Sequência"
            subtitle={`Recorde: ${gamification.longestStreak} dias`}
            iconColor="duo-orange"
          />
          <StatCardLarge
            icon={TrendingUp}
            value={`#${gamification.ranking}`}
            label="Ranking"
            subtitle="Entre academias da região"
            iconColor="duo-purple"
          />
          <StatCardLarge
            icon={Users}
            value={`${profile.totalStudents}/${gamification.monthlyStudentGoal}`}
            label="Meta de Alunos"
            iconColor="duo-blue"
          />
          <StatCardLarge
            icon={Target}
            value={`${gamification.equipmentUtilization}%`}
            label="Utilização"
            subtitle="Equipamentos em uso"
            iconColor="duo-green"
          />
        </div>
      </SlideIn>

      <div className="grid gap-6 lg:grid-cols-2">
        <SlideIn delay={0.3}>
          <SectionCard title="Conquistas" icon={Award} variant="orange">
            <div className="space-y-3">
              {mockAchievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                >
                  <DuoCard
                    variant={achievement.unlocked ? "highlighted" : "default"}
                    size="default"
                    className={cn(
                      achievement.unlocked && "border-duo-green bg-duo-green/10"
                    )}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{achievement.icon}</div>
                        <div>
                          <h3 className="text-sm font-bold text-duo-text">
                            {achievement.title}
                          </h3>
                          <p className="text-xs text-duo-gray-dark">
                            {achievement.description}
                          </p>
                        </div>
                      </div>
                      {achievement.unlocked && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-duo-green">
                          <Trophy className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>

                    <div className="mb-2">
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-bold text-duo-text">
                          {achievement.progress}/{achievement.target}
                        </span>
                        <span className="text-duo-orange">
                          +{achievement.xpReward} XP
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={cn(
                            "h-full",
                            achievement.unlocked
                              ? "bg-duo-green"
                              : "bg-duo-orange"
                          )}
                          style={{
                            width: `${
                              (achievement.progress / achievement.target) * 100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </DuoCard>
                </motion.div>
              ))}
            </div>
          </SectionCard>
        </SlideIn>

        <SlideIn delay={0.4}>
          <SectionCard title="Ranking Regional" icon={Star} variant="default">
            <div className="space-y-2">
              {mockRanking.map((gym, index) => (
                <motion.div
                  key={gym.position}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                >
                  <DuoCard
                    variant="default"
                    size="default"
                    className={cn(
                      gym.isCurrentGym && "border-duo-orange bg-duo-orange/10"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold",
                          gym.position === 1 && "bg-duo-yellow text-white",
                          gym.position === 2 && "bg-gray-400 text-white",
                          gym.position === 3 && "bg-duo-orange text-white",
                          gym.isCurrentGym &&
                            gym.position > 3 &&
                            "bg-duo-orange text-white",
                          !gym.isCurrentGym &&
                            gym.position > 3 &&
                            "bg-gray-200 text-duo-gray-dark"
                        )}
                      >
                        {gym.position}
                      </div>
                      <div className="flex-1">
                        <p
                          className={cn(
                            "text-sm font-bold",
                            gym.isCurrentGym
                              ? "text-duo-orange"
                              : "text-duo-text"
                          )}
                        >
                          {gym.name}
                          {gym.isCurrentGym && " (Você)"}
                        </p>
                        <p className="text-xs text-duo-gray-dark">{gym.city}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-duo-blue">
                          {gym.xp}
                        </p>
                        <p className="text-xs text-duo-gray-dark">XP</p>
                      </div>
                    </div>
                  </DuoCard>
                </motion.div>
              ))}
            </div>
          </SectionCard>
        </SlideIn>
      </div>
    </div>
  );
}
