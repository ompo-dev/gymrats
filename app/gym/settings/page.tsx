"use client";

import { useState } from "react";
import { mockGymProfile, mockMembershipPlans } from "@/lib/gym-mock-data";
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  CreditCard,
  Shield,
  Bell,
  Users,
  FileText,
  Edit2,
  Plus,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const operatingHours = [
    { day: "Segunda a Sexta", hours: "06:00 - 22:00" },
    { day: "Sábado", hours: "08:00 - 20:00" },
    { day: "Domingo", hours: "09:00 - 14:00" },
  ];

  return (
    <div className="container px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-black text-duo-gray-darkest">
          Configurações
        </h1>
        <p className="text-sm text-duo-gray-dark">
          Gerencie o perfil e configurações da academia
        </p>
      </div>

      {/* Perfil da Academia */}
      <div className="mb-6 overflow-hidden rounded-2xl border-2 border-duo-border bg-white">
        <div className="bg-linear-to-r from-[#FF9600] to-orange-500 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-white bg-white">
              <Building2 className="h-8 w-8 text-[#FF9600]" />
            </div>
            <div className="flex-1 text-white">
              <h2 className="text-xl font-black">{mockGymProfile.name}</h2>
              <p className="text-sm opacity-90">Plano {mockGymProfile.plan}</p>
            </div>
            <button className="rounded-xl bg-white/20 p-2 backdrop-blur-sm hover:bg-white/30">
              <Edit2 className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        <div className="p-5">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-duo-gray-dark" />
              <div className="flex-1">
                <div className="text-xs font-bold text-duo-gray-dark">
                  Endereço
                </div>
                <div className="text-sm font-bold text-duo-gray-darkest">
                  {mockGymProfile.address}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-duo-gray-dark" />
              <div className="flex-1">
                <div className="text-xs font-bold text-duo-gray-dark">
                  Telefone
                </div>
                <div className="text-sm font-bold text-duo-gray-darkest">
                  {mockGymProfile.phone}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-duo-gray-dark" />
              <div className="flex-1">
                <div className="text-xs font-bold text-duo-gray-dark">
                  Email
                </div>
                <div className="text-sm font-bold text-duo-gray-darkest">
                  {mockGymProfile.email}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-duo-gray-dark" />
              <div className="flex-1">
                <div className="text-xs font-bold text-duo-gray-dark">CNPJ</div>
                <div className="text-sm font-bold text-duo-gray-darkest">
                  {mockGymProfile.cnpj}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Horários de Funcionamento */}
      <div className="mb-6 rounded-2xl border-2 border-duo-border bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-duo-blue" />
            <h2 className="text-lg font-black text-duo-gray-darkest">
              Horários de Funcionamento
            </h2>
          </div>
          <button className="rounded-xl bg-duo-blue/10 p-2 hover:bg-duo-blue/20">
            <Edit2 className="h-4 w-4 text-duo-blue" />
          </button>
        </div>

        <div className="space-y-3">
          {operatingHours.map((schedule) => (
            <div
              key={schedule.day}
              className="flex items-center justify-between rounded-xl bg-gray-50 p-3"
            >
              <span className="text-sm font-bold text-duo-gray-darkest">
                {schedule.day}
              </span>
              <span className="text-sm font-black text-duo-blue">
                {schedule.hours}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Planos de Assinatura */}
      <div className="mb-6 rounded-2xl border-2 border-duo-border bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-duo-green" />
            <h2 className="text-lg font-black text-duo-gray-darkest">
              Planos de Assinatura
            </h2>
          </div>
          <button className="rounded-xl bg-duo-green/10 p-2 hover:bg-duo-green/20">
            <Plus className="h-4 w-4 text-duo-green" />
          </button>
        </div>

        <div className="space-y-3">
          {mockMembershipPlans.slice(0, 4).map((plan) => (
            <div
              key={plan.id}
              className="rounded-xl border-2 border-gray-100 bg-gray-50 p-4"
            >
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <div className="text-sm font-black text-duo-gray-darkest">
                    {plan.name}
                  </div>
                  <div className="text-xs text-duo-gray-dark">
                    {plan.duration} dias
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-duo-green">
                    R$ {plan.price}
                  </div>
                  <div className="text-xs text-duo-gray-dark">
                    {plan.type === "monthly" ? "/mês" : "total"}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 rounded-lg bg-duo-blue/10 py-2 text-xs font-bold text-duo-blue hover:bg-duo-blue/20">
                  Editar
                </button>
                <button className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Outras Configurações */}
      <div className="space-y-3">
        <button className="flex w-full items-center gap-3 rounded-2xl border-2 border-duo-border bg-white p-4 hover:bg-gray-50">
          <div className="rounded-xl bg-purple-50 p-3">
            <Users className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-black text-duo-gray-darkest">
              Gerenciar Equipe
            </div>
            <div className="text-xs text-duo-gray-dark">
              Adicionar e remover funcionários
            </div>
          </div>
        </button>

        <button className="flex w-full items-center gap-3 rounded-2xl border-2 border-duo-border bg-white p-4 hover:bg-gray-50">
          <div className="rounded-xl bg-yellow-50 p-3">
            <Bell className="h-5 w-5 text-yellow-600" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-black text-duo-gray-darkest">
              Notificações
            </div>
            <div className="text-xs text-duo-gray-dark">
              Configurar alertas e lembretes
            </div>
          </div>
        </button>

        <button className="flex w-full items-center gap-3 rounded-2xl border-2 border-duo-border bg-white p-4 hover:bg-gray-50">
          <div className="rounded-xl bg-red-50 p-3">
            <Shield className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-black text-duo-gray-darkest">
              Privacidade e Segurança
            </div>
            <div className="text-xs text-duo-gray-dark">
              Gerencie dados e permissões
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
