"use client"

import { mockProgressPhotos } from "@/lib/mock-data"
import { Camera, Plus } from "lucide-react"

export function ProgressPhotosGallery() {
  return (
    <div className="rounded-2xl border-2 border-duo-border bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-duo-purple" />
          <h2 className="font-bold text-duo-text">Fotos de Progresso</h2>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-duo-blue px-4 py-2 text-sm font-bold text-white transition-transform hover:scale-105">
          <Plus className="h-4 w-4" />
          Adicionar
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {mockProgressPhotos.map((photo) => (
          <div key={photo.id} className="group relative aspect-[2/3] overflow-hidden rounded-xl">
            <img src={photo.url || "/placeholder.svg"} alt={photo.notes} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="absolute bottom-0 left-0 right-0 p-3 text-white opacity-0 transition-opacity group-hover:opacity-100">
              <div className="text-xs font-bold">{photo.notes}</div>
              <div className="mt-1 text-xs text-white/80">
                {new Date(photo.date).toLocaleDateString("pt-BR")} • {photo.weight}kg
              </div>
            </div>
          </div>
        ))}

        {/* Add photo button */}
        <button className="group flex aspect-[2/3] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-duo-border bg-gray-50 transition-colors hover:border-duo-blue hover:bg-duo-blue/5">
          <Plus className="h-8 w-8 text-duo-gray transition-colors group-hover:text-duo-blue" />
          <span className="text-sm font-bold text-duo-gray transition-colors group-hover:text-duo-blue">Nova foto</span>
        </button>
      </div>
    </div>
  )
}
