"use client"

import { useState, useEffect } from "react"
import { MapPin, Star, Clock, Check, Navigation, Phone, ChevronRight, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"
import type { GymLocation, DayPass } from "@/lib/types"

interface GymMapProps {
  gyms: GymLocation[]
  dayPasses: DayPass[]
  onPurchaseDayPass: (gymId: string) => void
}

export function GymMap({ gyms, dayPasses, onPurchaseDayPass }: GymMapProps) {
  const [selectedGym, setSelectedGym] = useState<GymLocation | null>(null)
  const [filter, setFilter] = useState<"all" | "open" | "near">("all")
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    // Simular obtenção de localização do usuário
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        () => {
          // Localização padrão (São Paulo) se não conseguir obter
          setUserLocation({ lat: -23.5505, lng: -46.6333 })
        },
      )
    }
  }, [])

  const filteredGyms = gyms.filter((gym) => {
    if (filter === "open") return gym.openNow
    if (filter === "near") return gym.distance! < 3
    return true
  })

  const sortedGyms = [...filteredGyms].sort((a, b) => (a.distance || 0) - (b.distance || 0))

  return (
    <div className="flex h-full flex-col">
      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto px-4 py-3">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-bold transition-all whitespace-nowrap",
            filter === "all"
              ? "bg-duo-green text-white shadow-duo-green"
              : "border-2 border-duo-border bg-white text-duo-gray-dark",
          )}
        >
          Todas
        </button>
        <button
          onClick={() => setFilter("near")}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-bold transition-all whitespace-nowrap",
            filter === "near"
              ? "bg-duo-green text-white shadow-duo-green"
              : "border-2 border-duo-border bg-white text-duo-gray-dark",
          )}
        >
          <Navigation className="mr-1 inline h-4 w-4" />
          Próximas (&lt;3km)
        </button>
        <button
          onClick={() => setFilter("open")}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-bold transition-all whitespace-nowrap",
            filter === "open"
              ? "bg-duo-green text-white shadow-duo-green"
              : "border-2 border-duo-border bg-white text-duo-gray-dark",
          )}
        >
          <Clock className="mr-1 inline h-4 w-4" />
          Abertas Agora
        </button>
      </div>

      {/* Mapa simplificado (placeholder) */}
      <div className="relative mx-4 h-48 overflow-hidden rounded-2xl border-4 border-duo-border bg-gray-100">
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-100 to-green-100">
          <MapPin className="h-16 w-16 text-duo-blue" />
        </div>
        <div className="absolute bottom-2 left-2 rounded-full bg-white px-3 py-1 text-xs font-bold shadow-lg">
          <Navigation className="mr-1 inline h-3 w-3" />
          {sortedGyms.length} academias próximas
        </div>
      </div>

      {/* Lista de academias */}
      <div className="flex-1 overflow-y-auto px-4 pb-20 pt-4">
        <h2 className="mb-3 text-lg font-black text-duo-gray-darkest">Academias Cadastradas</h2>

        <div className="space-y-3">
          {sortedGyms.map((gym) => {
            const hasActivePass = dayPasses.some((pass) => pass.gymId === gym.id && pass.status === "active")

            return (
              <button
                key={gym.id}
                onClick={() => setSelectedGym(selectedGym?.id === gym.id ? null : gym)}
                className="w-full rounded-2xl border-4 border-duo-border bg-white p-4 text-left transition-all hover:shadow-lg"
              >
                {/* Header da academia */}
                <div className="flex items-start gap-3">
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border-2 border-duo-border bg-gray-100">
                    <img src={gym.logo || "/placeholder.svg"} alt={gym.name} className="h-full w-full object-cover" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-duo-gray-darkest">{gym.name}</h3>
                      {gym.openNow && (
                        <span className="rounded-full bg-duo-green px-2 py-0.5 text-[10px] font-bold text-white">
                          ABERTA
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex items-center gap-3 text-xs text-duo-gray-dark">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-duo-yellow text-duo-yellow" />
                        <span className="font-bold">{gym.rating}</span>
                        <span>({gym.totalReviews})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span className="font-bold">{gym.distance?.toFixed(1)} km</span>
                      </div>
                    </div>

                    <p className="mt-1 text-xs text-duo-gray">{gym.address}</p>
                  </div>

                  <ChevronRight
                    className={cn(
                      "h-5 w-5 flex-shrink-0 text-duo-gray transition-transform",
                      selectedGym?.id === gym.id && "rotate-90",
                    )}
                  />
                </div>

                {/* Detalhes expandidos */}
                {selectedGym?.id === gym.id && (
                  <div className="mt-4 space-y-3 border-t-2 border-duo-border pt-4">
                    {/* Horário */}
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-duo-blue" />
                      <span className="font-bold text-duo-gray-dark">
                        {gym.openingHours.open === "24h"
                          ? "Aberto 24 horas"
                          : `${gym.openingHours.open} - ${gym.openingHours.close}`}
                      </span>
                    </div>

                    {/* Comodidades */}
                    <div>
                      <p className="mb-2 text-xs font-bold text-duo-gray-dark">Comodidades:</p>
                      <div className="flex flex-wrap gap-1">
                        {gym.amenities.map((amenity) => (
                          <span
                            key={amenity}
                            className="rounded-full border-2 border-duo-border bg-duo-blue/5 px-2 py-1 text-[10px] font-bold text-duo-blue"
                          >
                            <Check className="mr-1 inline h-3 w-3" />
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Planos */}
                    <div>
                      <p className="mb-2 text-xs font-bold text-duo-gray-dark">Planos disponíveis:</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-xl border-2 border-duo-border bg-duo-yellow/10 p-2 text-center">
                          <p className="text-[10px] font-bold text-duo-gray">Diária</p>
                          <p className="mt-1 text-sm font-black text-duo-yellow">R$ {gym.plans.daily}</p>
                        </div>
                        <div className="rounded-xl border-2 border-duo-border bg-duo-orange/10 p-2 text-center">
                          <p className="text-[10px] font-bold text-duo-gray">Semanal</p>
                          <p className="mt-1 text-sm font-black text-duo-orange">R$ {gym.plans.weekly}</p>
                        </div>
                        <div className="rounded-xl border-2 border-duo-border bg-duo-green/10 p-2 text-center">
                          <p className="text-[10px] font-bold text-duo-gray">Mensal</p>
                          <p className="mt-1 text-sm font-black text-duo-green">R$ {gym.plans.monthly}</p>
                        </div>
                      </div>
                    </div>

                    {/* Botões de ação */}
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`tel:${gym.address}`}
                        className="flex items-center justify-center gap-2 rounded-xl border-4 border-duo-border bg-white py-2 font-bold text-duo-blue transition-all hover:bg-duo-blue/5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone className="h-4 w-4" />
                        Ligar
                      </a>

                      {hasActivePass ? (
                        <div className="flex items-center justify-center gap-2 rounded-xl border-4 border-duo-green bg-duo-green py-2 font-bold text-white">
                          <Check className="h-4 w-4" />
                          Passe Ativo
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onPurchaseDayPass(gym.id)
                          }}
                          className="duo-button-green flex items-center justify-center gap-2 py-2"
                        >
                          <CreditCard className="h-4 w-4" />
                          Comprar Diária
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
