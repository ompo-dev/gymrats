"use client"

import { useState } from "react"
import { SocialFeed } from "./social-feed"
import { Leaderboard } from "./leaderboard"
import { Challenges } from "./challenges"
import { FriendsList } from "./friends-list"
import { Users, Trophy, Target, Activity } from "lucide-react"

export function SocialPage() {
  const [activeView, setActiveView] = useState<"feed" | "leaderboard" | "challenges" | "friends">("leaderboard")

  return (
    <div className="space-y-6">
      <div className="flex gap-2 rounded-2xl border-2 border-duo-gray-border bg-white p-1">
        <button
          onClick={() => setActiveView("leaderboard")}
          className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all ${
            activeView === "leaderboard" ? "bg-duo-yellow text-white" : "text-duo-gray-dark hover:bg-duo-gray-light"
          }`}
        >
          <Trophy className="mx-auto mb-1 h-5 w-5" />
          Ranking
        </button>
        <button
          onClick={() => setActiveView("challenges")}
          className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all ${
            activeView === "challenges" ? "bg-duo-green text-white" : "text-duo-gray-dark hover:bg-duo-gray-light"
          }`}
        >
          <Target className="mx-auto mb-1 h-5 w-5" />
          Desafios
        </button>
        <button
          onClick={() => setActiveView("friends")}
          className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all ${
            activeView === "friends" ? "bg-duo-blue text-white" : "text-duo-gray-dark hover:bg-duo-gray-light"
          }`}
        >
          <Users className="mx-auto mb-1 h-5 w-5" />
          Amigos
        </button>
        <button
          onClick={() => setActiveView("feed")}
          className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all ${
            activeView === "feed" ? "bg-duo-orange text-white" : "text-duo-gray-dark hover:bg-duo-gray-light"
          }`}
        >
          <Activity className="mx-auto mb-1 h-5 w-5" />
          Feed
        </button>
      </div>

      {activeView === "leaderboard" && <Leaderboard />}
      {activeView === "challenges" && <Challenges />}
      {activeView === "friends" && <FriendsList />}
      {activeView === "feed" && (
        <div>
          <div className="mb-6 text-center">
            <h1 className="mb-2 text-3xl font-bold text-duo-text">Feed de Atividades</h1>
            <p className="text-sm text-duo-gray-dark">Veja o que seus amigos estão fazendo</p>
          </div>
          <SocialFeed />
        </div>
      )}
    </div>
  )
}
