"use client";

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
import { SectionCard } from "@/components/ui/section-card";
import { DuoCard } from "@/components/ui/duo-card";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function GymSettingsPage() {
  const operatingHours = [
    { day: "Segunda a Sexta", hours: "06:00 - 22:00" },
    { day: "Sábado", hours: "08:00 - 20:00" },
    { day: "Domingo", hours: "09:00 - 14:00" },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6  ">
      <FadeIn>
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold text-duo-text">
            Configurações
          </h1>
          <p className="text-sm text-duo-gray-dark">
            Gerencie o perfil e configurações da academia
          </p>
        </div>
      </FadeIn>

      <SlideIn delay={0.1}>
        <SectionCard
          title={mockGymProfile.name}
          icon={Building2}
          variant="orange"
        >
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-duo-gray-dark">
              Plano {mockGymProfile.plan}
            </p>
            <Button size="sm" variant="outline">
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-3">
            {[
              {
                icon: MapPin,
                label: "Endereço",
                value: mockGymProfile.address,
              },
              {
                icon: Phone,
                label: "Telefone",
                value: mockGymProfile.phone,
              },
              {
                icon: Mail,
                label: "Email",
                value: mockGymProfile.email,
              },
              {
                icon: FileText,
                label: "CNPJ",
                value: mockGymProfile.cnpj,
              },
            ].map((info, index) => (
              <DuoCard key={index} variant="default" size="sm">
                <div className="flex items-start gap-3">
                  <info.icon className="h-5 w-5 shrink-0 text-duo-gray-dark" />
                  <div className="flex-1">
                    <div className="text-xs font-bold text-duo-gray-dark">
                      {info.label}
                    </div>
                    <div className="text-sm font-bold text-duo-text">
                      {info.value}
                    </div>
                  </div>
                </div>
              </DuoCard>
            ))}
          </div>
        </SectionCard>
      </SlideIn>

      <SlideIn delay={0.2}>
        <SectionCard
          title="Horários de Funcionamento"
          icon={Clock}
          variant="blue"
          headerAction={
            <Button size="sm" variant="outline">
              <Edit2 className="h-4 w-4" />
            </Button>
          }
        >
          <div className="space-y-3">
            {operatingHours.map((schedule, index) => (
              <DuoCard key={schedule.day} variant="default" size="sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-duo-text">
                    {schedule.day}
                  </span>
                  <span className="text-sm font-bold text-duo-blue">
                    {schedule.hours}
                  </span>
                </div>
              </DuoCard>
            ))}
          </div>
        </SectionCard>
      </SlideIn>

      <SlideIn delay={0.3}>
        <SectionCard
          title="Planos de Assinatura"
          icon={CreditCard}
          variant="highlighted"
          headerAction={
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          }
        >
          <div className="space-y-3">
            {mockMembershipPlans.slice(0, 4).map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
              >
                <DuoCard variant="default" size="default">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <div className="text-sm font-bold text-duo-text">
                        {plan.name}
                      </div>
                      <div className="text-xs text-duo-gray-dark">
                        {plan.duration} dias
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-duo-green">
                        R$ {plan.price}
                      </div>
                      <div className="text-xs text-duo-gray-dark">
                        {plan.type === "monthly" ? "/mês" : "total"}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      Editar
                    </Button>
                    <Button size="sm" variant="destructive">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </DuoCard>
              </motion.div>
            ))}
          </div>
        </SectionCard>
      </SlideIn>

      <SlideIn delay={0.4}>
        <SectionCard title="Outras Configurações" icon={Shield}>
          <div className="space-y-3">
            {[
              {
                icon: Users,
                title: "Gerenciar Equipe",
                description: "Adicionar e remover funcionários",
                color: "duo-purple",
              },
              {
                icon: Bell,
                title: "Notificações",
                description: "Configurar alertas e lembretes",
                color: "duo-yellow",
              },
              {
                icon: Shield,
                title: "Privacidade e Segurança",
                description: "Gerencie dados e permissões",
                color: "duo-red",
              },
            ].map((setting, index) => (
              <motion.div
                key={setting.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
              >
                <DuoCard
                  variant="default"
                  size="default"
                  className="cursor-pointer transition-all hover:border-duo-blue active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "rounded-xl p-3",
                        setting.color === "duo-purple" && "bg-duo-purple/10",
                        setting.color === "duo-yellow" && "bg-duo-yellow/10",
                        setting.color === "duo-red" && "bg-duo-red/10"
                      )}
                    >
                      {setting.color === "duo-purple" && (
                        <Users className="h-5 w-5 text-duo-purple" />
                      )}
                      {setting.color === "duo-yellow" && (
                        <Bell className="h-5 w-5 text-duo-yellow" />
                      )}
                      {setting.color === "duo-red" && (
                        <Shield className="h-5 w-5 text-duo-red" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-bold text-duo-text">
                        {setting.title}
                      </div>
                      <div className="text-xs text-duo-gray-dark">
                        {setting.description}
                      </div>
                    </div>
                  </div>
                </DuoCard>
              </motion.div>
            ))}
          </div>
        </SectionCard>
      </SlideIn>
    </div>
  );
}
