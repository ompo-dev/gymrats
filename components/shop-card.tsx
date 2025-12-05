"use client"

import { ShoppingBag, Zap } from "lucide-react"

export function ShopCard() {
  return (
    <div className="rounded-2xl border-2 border-duo-blue bg-gradient-to-br from-duo-blue/10 to-duo-purple/10 p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-duo-blue">
          <ShoppingBag className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-duo-text">Loja de Recursos</h3>
          <p className="text-xs text-duo-gray-dark">Troque XP por benefícios</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between rounded-xl border border-duo-border bg-white p-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔥</span>
            <div>
              <p className="text-xs font-bold text-duo-text">Proteção de Streak</p>
              <p className="text-xs text-duo-gray-dark">1 dia de proteção</p>
            </div>
          </div>
          <button className="flex items-center gap-1 rounded-lg bg-duo-blue px-3 py-1 text-xs font-bold text-white hover:brightness-110">
            <Zap className="h-3 w-3" />
            200
          </button>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-duo-border bg-white p-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">💪</span>
            <div>
              <p className="text-xs font-bold text-duo-text">Treino Personalizado</p>
              <p className="text-xs text-duo-gray-dark">Gerado por IA</p>
            </div>
          </div>
          <button className="flex items-center gap-1 rounded-lg bg-duo-blue px-3 py-1 text-xs font-bold text-white hover:brightness-110">
            <Zap className="h-3 w-3" />
            500
          </button>
        </div>
      </div>
    </div>
  )
}
