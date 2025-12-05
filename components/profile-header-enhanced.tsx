"use client"

import { Camera, Edit2, Share2 } from "lucide-react"
import { useState } from "react"

export function ProfileHeaderEnhanced() {
  const [isEditing, setIsEditing] = useState(false)

  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-duo-border bg-gradient-to-br from-duo-blue to-duo-purple p-8 text-white shadow-lg">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white" />
      </div>

      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            {/* Avatar com upload */}
            <div className="group relative">
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white/20 text-5xl shadow-xl backdrop-blur-sm">
                👤
              </div>
              <button className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="h-6 w-6" />
              </button>
            </div>

            <div>
              <div className="mb-2 flex items-center gap-3">
                <h1 className="text-3xl font-bold">AtletaFit</h1>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="rounded-full bg-white/20 p-2 backdrop-blur-sm transition-colors hover:bg-white/30"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>
              <p className="mb-3 text-white/80">@atletafit • Membro desde Jan 2025</p>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="font-bold">23</span> Treinos
                </div>
                <div className="h-4 w-px bg-white/30" />
                <div>
                  <span className="font-bold">12</span> Amigos
                </div>
                <div className="h-4 w-px bg-white/30" />
                <div>
                  <span className="font-bold">5</span> Dias streak
                </div>
              </div>
            </div>
          </div>

          <button className="rounded-full bg-white/20 p-3 backdrop-blur-sm transition-colors hover:bg-white/30">
            <Share2 className="h-5 w-5" />
          </button>
        </div>

        {/* Stats rápidas */}
        <div className="mt-6 grid grid-cols-4 gap-4">
          <div className="rounded-xl bg-white/10 p-3 text-center backdrop-blur-sm">
            <div className="mb-1 text-2xl font-bold">8</div>
            <div className="text-xs text-white/80">Nível</div>
          </div>
          <div className="rounded-xl bg-white/10 p-3 text-center backdrop-blur-sm">
            <div className="mb-1 text-2xl font-bold">1287</div>
            <div className="text-xs text-white/80">XP Total</div>
          </div>
          <div className="rounded-xl bg-white/10 p-3 text-center backdrop-blur-sm">
            <div className="mb-1 text-2xl font-bold">82.5</div>
            <div className="text-xs text-white/80">kg Atual</div>
          </div>
          <div className="rounded-xl bg-white/10 p-3 text-center backdrop-blur-sm">
            <div className="mb-1 text-2xl font-bold">+4.5</div>
            <div className="text-xs text-white/80">kg Ganhos</div>
          </div>
        </div>
      </div>
    </div>
  )
}
