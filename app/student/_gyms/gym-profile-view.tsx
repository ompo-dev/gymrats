"use client";

import {
  ArrowLeft,
  Check,
  Clock,
  CreditCard,
  ChevronRight,
  Dumbbell,
  MapPin,
  Phone,
  Star,
  UserMinus,
  Users,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { FadeIn } from "@/components/animations/fade-in";
import { DuoButton, DuoCard } from "@/components/duo";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";

interface GymProfileData {
  id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  logo?: string;
  photos?: string[];
  rating: number;
  totalReviews: number;
  openingHours?: { open?: string; close?: string };
  amenities: string[];
  equipmentCount: number;
  totalStudents: number;
  activeStudents: number;
  equipment: Array<{ id: string; name: string; type: string; status: string }>;
  plans: Array<{
    id: string;
    name: string;
    type: string;
    price: number;
    duration: number;
    benefits?: string[];
  }>;
  myMembership?: {
    id: string;
    status: string;
    planId: string | null;
  } | null;
  personals?: Array<{ id: string; name: string; avatar: string | null }>;
}

interface GymProfileViewProps {
  gymId: string;
  onBack: () => void;
  onJoinPlan?: (gymId: string, planId: string, couponId?: string) => void;
  onChangePlan?: (membershipId: string, planId: string) => void;
  onCancelMembership?: (membershipId: string) => void | Promise<void>;
  onViewPersonal?: (personalId: string) => void;
  profileRefreshKey?: number;
  preSelectedPlan?: string | null;
  preSelectedCoupon?: string | null;
  /** "student" usa /api/students/gyms, "personal" usa /api/personals/gyms */
  variant?: "student" | "personal";
}

export function GymProfileView({
  gymId,
  onBack,
  onJoinPlan,
  onChangePlan,
  onCancelMembership,
  onViewPersonal,
  profileRefreshKey,
  preSelectedPlan,
  preSelectedCoupon,
  variant = "student",
}: GymProfileViewProps) {
  const profileUrl =
    variant === "personal"
      ? `/api/personals/gyms/${gymId}/profile`
      : `/api/students/gyms/${gymId}/profile`;
  const [profile, setProfile] = useState<GymProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoStarted, setAutoStarted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiClient
      .get<GymProfileData>(profileUrl)
      .then((res) => {
        if (!cancelled) {
          setProfile(res.data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.response?.data?.error || "Erro ao carregar perfil");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [profileUrl, profileRefreshKey]);

  useEffect(() => {
    if (
      profile &&
      preSelectedPlan &&
      !autoStarted &&
      onJoinPlan &&
      variant === "student"
    ) {
      const plan = profile.plans.find((p) => p.id === preSelectedPlan);
      const hasMembership = !!profile.myMembership;
      if (plan && !hasMembership) {
        setAutoStarted(true);
        onJoinPlan(gymId, plan.id, preSelectedCoupon || undefined);
      }
    }
  }, [
    profile,
    preSelectedPlan,
    preSelectedCoupon,
    autoStarted,
    gymId,
    onJoinPlan,
    variant,
  ]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <DuoButton variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </DuoButton>
        <div className="py-12 text-center text-duo-gray-dark">
          Carregando perfil da academia...
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <DuoButton variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </DuoButton>
        <div className="py-12 text-center text-duo-red">
          {error || "Academia não encontrada"}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <DuoButton variant="ghost" onClick={onBack} className="gap-2 font-bold">
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </DuoButton>

      <FadeIn>
        <DuoCard.Root variant="default" padding="md">
          <DuoCard.Header>
            <div className="flex items-center gap-2">
              <Dumbbell
                className="h-5 w-5 shrink-0 text-duo-secondary"
                aria-hidden
              />
              <h2 className="font-bold text-duo-fg">{profile.name}</h2>
            </div>
          </DuoCard.Header>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            {(profile.logo || profile.photos?.[0]) && (
              <div className="flex shrink-0 gap-2">
                <div className="h-20 w-20 overflow-hidden rounded-xl border-2 border-duo-border">
                  <img
                    src={profile.logo || profile.photos?.[0]}
                    alt={profile.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                {profile.photos && profile.photos.length > 1 && (
                  <div className="flex gap-1 overflow-x-auto">
                    {profile.photos.slice(1, 4).map((url, i) => (
                      <div
                        key={i}
                        className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 border-duo-border"
                      >
                        <img
                          src={url}
                          alt={`${profile.name} ${i + 2}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-duo-yellow text-duo-yellow" />
                <span className="font-bold">{profile.rating}</span>
                <span className="text-sm text-duo-gray-dark">
                  ({profile.totalReviews} avaliações)
                </span>
              </div>
              {profile.address && (
                <div className="flex items-center gap-2 text-sm text-duo-gray-dark">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {profile.address}
                </div>
              )}
              {profile.phone && (
                <div className="flex items-center gap-2 text-sm text-duo-gray-dark">
                  <Phone className="h-4 w-4 shrink-0" />
                  {profile.phone}
                </div>
              )}
              {profile.openingHours && (
                <div className="flex items-center gap-2 text-sm text-duo-gray-dark">
                  <Clock className="h-4 w-4 shrink-0" />
                  {profile.openingHours.open === "24h"
                    ? "Aberto 24 horas"
                    : `${profile.openingHours.open} - ${profile.openingHours.close}`}
                </div>
              )}
            </div>
          </div>
        </DuoCard.Root>
      </FadeIn>

      <div className="grid gap-4 sm:grid-cols-2">
        <DuoCard.Root variant="default" size="sm">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-duo-blue" />
            <div>
              <p className="text-xs text-duo-gray-dark">Alunos ativos</p>
              <p className="text-lg font-bold">{profile.activeStudents}</p>
            </div>
          </div>
        </DuoCard.Root>
        <DuoCard.Root variant="default" size="sm">
          <div className="flex items-center gap-3">
            <Dumbbell className="h-6 w-6 text-duo-orange" />
            <div>
              <p className="text-xs text-duo-gray-dark">Equipamentos</p>
              <p className="text-lg font-bold">{profile.equipmentCount}</p>
            </div>
          </div>
        </DuoCard.Root>
      </div>

      {profile.amenities && profile.amenities.length > 0 && (
        <DuoCard.Root variant="default" padding="md">
          <DuoCard.Header>
            <div className="flex items-center gap-2">
              <Check
                className="h-5 w-5 shrink-0 text-duo-secondary"
                aria-hidden
              />
              <h2 className="font-bold text-duo-fg">Comodidades</h2>
            </div>
          </DuoCard.Header>
          <div className="flex flex-wrap gap-2">
            {profile.amenities.map((a) => (
              <span
                key={a}
                className="rounded-full border-2 border-duo-border bg-duo-blue/10 px-3 py-1 text-xs font-bold text-duo-blue"
              >
                {a}
              </span>
            ))}
          </div>
        </DuoCard.Root>
      )}

      {profile.equipment && profile.equipment.length > 0 && (
        <DuoCard.Root variant="default" padding="md">
          <DuoCard.Header>
            <div className="flex items-center gap-2">
              <Dumbbell
                className="h-5 w-5 shrink-0 text-duo-secondary"
                aria-hidden
              />
              <h2 className="font-bold text-duo-fg">Equipamentos</h2>
            </div>
          </DuoCard.Header>
          <div className="flex flex-wrap gap-2">
            {profile.equipment.slice(0, 12).map((e) => (
              <span
                key={e.id}
                className={cn(
                  "rounded-lg border-2 px-2 py-1 text-xs font-bold",
                  e.status === "available"
                    ? "border-duo-green bg-duo-green/10 text-duo-green"
                    : "border-duo-border bg-duo-bg-elevated text-duo-gray-dark",
                )}
              >
                {e.name}
              </span>
            ))}
            {profile.equipment.length > 12 && (
              <span className="rounded-lg border-2 border-duo-border px-2 py-1 text-xs font-bold text-duo-gray-dark">
                +{profile.equipment.length - 12} mais
              </span>
            )}
          </div>
        </DuoCard.Root>
      )}

      {profile.personals &&
        profile.personals.length > 0 &&
        variant === "student" &&
        onViewPersonal && (
          <DuoCard.Root variant="default" padding="md">
            <DuoCard.Header>
              <div className="flex items-center gap-2">
                <Users
                  className="h-5 w-5 shrink-0 text-duo-secondary"
                  aria-hidden
                />
                <h2 className="font-bold text-duo-fg">Personais</h2>
              </div>
            </DuoCard.Header>
            <div className="space-y-3">
              {profile.personals.map((p) => (
                <DuoCard.Root
                  key={p.id}
                  variant="default"
                  size="default"
                  onClick={() => onViewPersonal(p.id)}
                  className="cursor-pointer transition-all hover:border-duo-primary/40 active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border-2 border-duo-border bg-gray-100">
                        <Image
                          src={p.avatar || "/placeholder.svg"}
                          alt={p.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <p className="font-bold text-duo-text">{p.name}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-duo-gray-dark" />
                  </div>
                </DuoCard.Root>
              ))}
            </div>
          </DuoCard.Root>
        )}

      {profile.myMembership &&
        (profile.myMembership.status === "active" ||
          profile.myMembership.status === "pending") &&
        onCancelMembership && (
          <DuoCard.Root variant="default" padding="md">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold text-duo-fg">
                  Sua matrícula nesta academia
                </p>
                <p className="text-sm text-duo-fg-muted">
                  {profile.myMembership.status === "active"
                    ? "Ativa"
                    : "Pendente de pagamento"}
                </p>
              </div>
              <DuoButton
                variant="outline"
                size="sm"
                onClick={() => {
                  if (profile.myMembership)
                    onCancelMembership(profile.myMembership.id);
                }}
                className="gap-2 border-duo-red text-duo-red hover:bg-duo-red/10"
              >
                <UserMinus className="h-4 w-4" />
                Cancelar assinatura
              </DuoButton>
            </div>
          </DuoCard.Root>
        )}

      <DuoCard.Root variant="default" padding="md">
        <DuoCard.Header>
          <div className="flex items-center gap-2">
            <CreditCard
              className="h-5 w-5 shrink-0 text-duo-secondary"
              aria-hidden
            />
            <h2 className="font-bold text-duo-fg">Planos disponíveis</h2>
          </div>
        </DuoCard.Header>
        <div className="space-y-3">
          {profile.plans.length === 0 ? (
            <p className="py-4 text-center text-sm text-duo-gray-dark">
              Nenhum plano disponível no momento
            </p>
          ) : (
            profile.plans.map((plan) => {
              const hasMembership = !!profile.myMembership;
              const isMyPlan = profile.myMembership?.planId === plan.id;
              const isActive = profile.myMembership?.status === "active";
              const isPending = profile.myMembership?.status === "pending";
              const showActions = variant === "student";
              const canContract =
                showActions && !hasMembership && !!onJoinPlan;
              const canChangePlan =
                showActions &&
                hasMembership &&
                isActive &&
                !isMyPlan &&
                !!onChangePlan;

              return (
                <DuoCard.Root
                  key={plan.id}
                  variant="default"
                  size="default"
                  className={cn(
                    (canContract || canChangePlan) &&
                      "cursor-pointer transition-all hover:border-duo-blue",
                    preSelectedPlan === plan.id && "ring-2 ring-duo-accent",
                  )}
                  onClick={() => {
                    if (canContract)
                      onJoinPlan?.(
                        profile.id,
                        plan.id,
                        preSelectedCoupon || undefined,
                      );
                    if (canChangePlan && profile.myMembership)
                      onChangePlan?.(profile.myMembership.id, plan.id);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-duo-text">{plan.name}</p>
                      <p className="text-xs text-duo-gray-dark">
                        {plan.duration} dias • Tipo: {plan.type}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-duo-green">
                        R$ {plan.price.toFixed(2)}
                      </p>
                      {isMyPlan && isActive && (
                        <span className="mt-2 inline-flex items-center rounded-full border-2 border-duo-green bg-duo-green/10 px-3 py-1 text-xs font-bold text-duo-green">
                          Plano ativo
                        </span>
                      )}
                      {isMyPlan && isPending && (
                        <span className="mt-2 inline-flex items-center rounded-full border-2 border-duo-yellow bg-duo-yellow/10 px-3 py-1 text-xs font-bold text-duo-yellow">
                          Mensalidade pendente
                        </span>
                      )}
                      {canContract && (
                        <DuoButton size="sm" variant="primary" className="mt-2">
                          Contratar
                        </DuoButton>
                      )}
                      {canChangePlan && (
                        <DuoButton size="sm" variant="outline" className="mt-2">
                          Trocar de plano
                        </DuoButton>
                      )}
                    </div>
                  </div>
                </DuoCard.Root>
              );
            })
          )}
        </div>
      </DuoCard.Root>
    </div>
  );
}
