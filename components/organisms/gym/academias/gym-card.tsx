"use client";

import { Building2, Check, MapPin, Users } from "lucide-react";
import { DuoButton } from "@/components/duo";
import type { GymData } from "@/stores/gyms-list-store";

export interface GymCardProps {
  gym: GymData;
  isActive: boolean;
  onSelect: (gymId: string) => void;
}

export function GymCard({ gym, isActive, onSelect }: GymCardProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border-2 p-6 transition-all ${
        isActive
          ? "border-green-500 shadow-md"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div
              className={`p-2 rounded-lg ${
                isActive ? "bg-green-100" : "bg-gray-100"
              }`}
            >
              <Building2
                className={`w-5 h-5 ${
                  isActive ? "text-green-600" : "text-gray-600"
                }`}
              />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900">
                {gym.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    gym.plan === "basic"
                      ? "bg-gray-100 text-gray-700"
                      : gym.plan === "premium"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {gym.plan === "basic"
                    ? "Básico"
                    : gym.plan === "premium"
                      ? "Premium"
                      : "Empresarial"}
                </span>
                {!gym.hasActiveSubscription && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-orange-100 text-orange-700">
                    Trial
                  </span>
                )}
                {isActive && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Ativa
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{gym.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Alunos cadastrados na academia</span>
            </div>
          </div>
        </div>

        <div>
          {!isActive ? (
            <DuoButton
              onClick={() => onSelect(gym.id)}
              variant="outline"
              size="sm"
              className="border-green-500 text-green-600 hover:bg-green-50"
            >
              Selecionar
            </DuoButton>
          ) : (
            <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
