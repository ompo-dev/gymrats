"use client"

import { Trophy, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LevelUpModalProps {
  level: number
  onClose: () => void
}

export function LevelUpModal({ level, onClose }: LevelUpModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-card shadow-lg"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="rounded-3xl bg-gradient-to-br from-primary via-success to-accent p-8 text-center text-primary-foreground shadow-2xl">
          <div className="mb-4 flex justify-center">
            <div className="relative">
              <Trophy className="h-24 w-24 animate-bounce" />
              <Sparkles className="absolute -right-2 -top-2 h-8 w-8 animate-pulse text-warning" />
              <Sparkles className="absolute -left-2 -bottom-2 h-6 w-6 animate-pulse text-warning" />
            </div>
          </div>

          <h2 className="mb-2 text-4xl font-bold">Subiu de Nível!</h2>
          <p className="mb-6 text-xl opacity-90">Você chegou ao nível {level}</p>

          <div className="mb-6 rounded-2xl bg-primary-foreground/20 p-4 backdrop-blur">
            <p className="text-sm opacity-90">Continue treinando para desbloquear</p>
            <p className="font-bold">novas lições e conquistas!</p>
          </div>

          <Button
            onClick={onClose}
            size="lg"
            className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90"
          >
            Continuar Aprendendo
          </Button>
        </div>
      </div>
    </div>
  )
}
