"use client";

import { mockChallenges } from "@/lib/social-data";
import type { Challenge } from "@/lib/types";
import { Users, Calendar, Trophy, Target } from "lucide-react";

export function Challenges() {
  const challenges = mockChallenges;

  const formatTimeRemaining = (endDate: Date) => {
    const diff = endDate.getTime() - Date.now();
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);

    if (days > 0) return `${days}d ${hours}h restantes`;
    return `${hours}h restantes`;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "streak":
        return "from-duo-orange/20 to-duo-red/20 border-duo-orange";
      case "xp":
        return "from-duo-yellow/20 to-duo-green/20 border-duo-yellow";
      case "workout":
        return "from-duo-blue/20 to-duo-green/20 border-duo-blue";
      default:
        return "from-duo-gray-light to-white border-duo-gray-border";
    }
  };

  const progressPercentage = (challenge: Challenge) => {
    return Math.min((challenge.currentProgress / challenge.goal) * 100, 100);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-bold text-duo-text">Desafios</h1>
        <p className="text-sm text-duo-gray-dark">
          Compete com amigos e ganhe recompensas
        </p>
      </div>

      <button className="duo-button-green w-full">
        <Target className="mr-2 h-5 w-5" />
        CRIAR NOVO DESAFIO
      </button>

      <div className="space-y-4">
        {challenges.map((challenge) => (
          <ChallengeCard key={challenge.id} challenge={challenge} />
        ))}
      </div>
    </div>
  );
}

function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const progressPercentage = Math.min(
    (challenge.currentProgress / challenge.goal) * 100,
    100
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case "streak":
        return "from-duo-orange/20 to-duo-red/20 border-duo-orange";
      case "xp":
        return "from-duo-yellow/20 to-duo-green/20 border-duo-yellow";
      case "workout":
        return "from-duo-blue/20 to-duo-green/20 border-duo-blue";
      default:
        return "from-duo-gray-light to-white border-duo-gray-border";
    }
  };

  const formatTimeRemaining = (endDate: Date) => {
    const diff = endDate.getTime() - Date.now();
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);

    if (days > 0) return `${days}d ${hours}h restantes`;
    return `${hours}h restantes`;
  };

  return (
    <div
      className={`rounded-2xl border-2 bg-linear-to-br p-6 ${getTypeColor(
        challenge.type
      )}`}
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="mb-1 text-xl font-bold text-duo-text">
            {challenge.title}
          </div>
          <div className="text-sm text-duo-gray-dark">
            {challenge.description}
          </div>
        </div>
        <div className="text-3xl">{challenge.reward.badge}</div>
      </div>

      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between text-sm font-bold">
          <span className="text-duo-text">
            Progresso: {challenge.currentProgress}/{challenge.goal}
          </span>
          <span className="text-duo-gray-dark">
            {progressPercentage.toFixed(0)}%
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-white">
          <div
            className="h-full rounded-full bg-duo-green transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-duo-gray-dark">
          <Users className="h-4 w-4" />
          {challenge.participants.length} participantes
        </div>
        <div className="flex items-center gap-2 text-sm font-bold text-duo-gray-dark">
          <Calendar className="h-4 w-4" />
          {formatTimeRemaining(challenge.endDate)}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-lg bg-white/50 p-3">
        <Trophy className="h-5 w-5 text-duo-yellow" />
        <span className="text-sm font-bold text-duo-text">
          Recompensa: +{challenge.reward.xp} XP
        </span>
      </div>
    </div>
  );
}
