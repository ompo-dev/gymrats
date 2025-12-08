"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, Building2, Dumbbell } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SelectModePage() {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<"student" | "gym" | null>(
    null
  );
  const [isChecking, setIsChecking] = useState(false);

  const checkStudentProfile = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return false;

      const response = await fetch("/api/students/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) return false;

      const data = await response.json();
      return data.hasProfile === true;
    } catch (error) {
      console.error("Erro ao verificar perfil:", error);
      return false;
    }
  };

  const checkGymProfile = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return false;

      const response = await fetch("/api/gyms/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) return false;

      const data = await response.json();
      return data.hasProfile === true;
    } catch (error) {
      console.error("Erro ao verificar perfil:", error);
      return false;
    }
  };

  const handleSelectMode = async (mode: "student" | "gym") => {
    setSelectedMode(mode);
    setIsChecking(true);

    localStorage.setItem("userMode", mode);

    if (mode === "student") {
      const hasProfile = await checkStudentProfile();

      if (!hasProfile) {
        router.push("/student/onboarding");
      } else {
        router.push("/student");
      }
    } else {
      const hasProfile = await checkGymProfile();

      if (!hasProfile) {
        router.push("/gym/onboarding");
      } else {
        router.push("/gym/dashboard");
      }
    }

    setIsChecking(false);
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-[#58CC02] to-[#47A302] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Dumbbell className="w-12 h-12 text-white" />
            <h1 className="text-5xl font-black text-white">GymRats</h1>
          </div>
          <p className="text-xl text-white/90 font-medium">
            Escolha como você quer usar o GymRats
          </p>
        </div>

        {/* Mode Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Student Mode */}
          <Card
            className={`p-8 cursor-pointer transition-all duration-300 hover:scale-105 ${
              selectedMode === "student"
                ? "ring-4 ring-white shadow-2xl"
                : "hover:shadow-xl"
            }`}
            onClick={() => handleSelectMode("student")}
          >
            <div className="text-center">
              <div className="w-24 h-24 bg-linear-to-br from-[#58CC02] to-[#47A302] rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Sou Aluno
              </h2>
              <p className="text-gray-600 text-lg mb-6">
                Acompanhe seus treinos, dieta, progresso e compete com amigos
              </p>
              <div className="space-y-2 text-left text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-[#58CC02] rounded-full mt-1.5" />
                  <span>Sistema de gamificação completo</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-[#58CC02] rounded-full mt-1.5" />
                  <span>Treinos e dietas personalizadas</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-[#58CC02] rounded-full mt-1.5" />
                  <span>Análise de postura com IA</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-[#58CC02] rounded-full mt-1.5" />
                  <span>Competição com amigos</span>
                </div>
              </div>
              <Button
                className="w-full mt-6 h-14 text-lg font-bold bg-[#58CC02] hover:bg-[#47A302]"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectMode("student");
                }}
                disabled={isChecking}
              >
                {isChecking ? "Verificando..." : "Começar como Aluno"}
              </Button>
            </div>
          </Card>

          {/* Gym Mode */}
          <Card
            className={`p-8 cursor-pointer transition-all duration-300 hover:scale-105 ${
              selectedMode === "gym"
                ? "ring-4 ring-white shadow-2xl"
                : "hover:shadow-xl"
            }`}
            onClick={() => handleSelectMode("gym")}
          >
            <div className="text-center">
              <div className="w-24 h-24 bg-linear-to-br from-[#FF9600] to-[#E68A00] rounded-full flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Sou Academia
              </h2>
              <p className="text-gray-600 text-lg mb-6">
                Gerencie alunos, equipamentos e acompanhe o crescimento da sua
                academia
              </p>
              <div className="space-y-2 text-left text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-[#FF9600] rounded-full mt-1.5" />
                  <span>Gestão completa de alunos</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-[#FF9600] rounded-full mt-1.5" />
                  <span>Controle de equipamentos em tempo real</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-[#FF9600] rounded-full mt-1.5" />
                  <span>Estatísticas e métricas detalhadas</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-[#FF9600] rounded-full mt-1.5" />
                  <span>Sistema de gamificação para academias</span>
                </div>
              </div>
              <Button
                className="w-full mt-6 h-14 text-lg font-bold bg-[#FF9600] hover:bg-[#E68A00]"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectMode("gym");
                }}
                disabled={isChecking}
              >
                {isChecking ? "Verificando..." : "Começar como Academia"}
              </Button>
            </div>
          </Card>
        </div>

        <p className="text-center text-white/80 mt-8 text-sm">
          Você poderá mudar entre os modos a qualquer momento
        </p>
      </div>
    </div>
  );
}
