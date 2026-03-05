"use client";

import {
  ArrowLeft,
  CreditCard,
  Dumbbell,
  MapPin,
  Monitor,
  Phone,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { FadeIn } from "@/components/animations/fade-in";
import { DuoButton, DuoCard } from "@/components/duo";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface PersonalProfileData {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  atendimentoPresencial: boolean;
  atendimentoRemoto: boolean;
  gyms: { id: string; name: string; address?: string }[];
  plans: {
    id: string;
    name: string;
    type: string;
    price: number;
    duration: number;
    benefits?: string[];
  }[];
  isSubscribed: boolean;
}

interface PersonalProfileViewProps {
  personalId: string;
  onBack: () => void;
  onSubscribe: (
    personalId: string,
    planId: string,
    paymentData: {
      brCode: string;
      brCodeBase64: string;
      amount: number;
      paymentId: string;
      pixId: string;
      expiresAt?: string;
      planName: string;
      originalPrice: number;
      appliedCoupon?: { code: string; discountString: string };
    },
  ) => void;
}

export function PersonalProfileView({
  personalId,
  onBack,
  onSubscribe,
}: PersonalProfileViewProps) {
  const [profile, setProfile] = useState<PersonalProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscribingPlanId, setSubscribingPlanId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiClient
      .get<PersonalProfileData>(`/api/students/personals/${personalId}/profile`)
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
  }, [personalId]);

  const handleSubscribe = async (planId: string) => {
    if (!profile) return;
    setSubscribingPlanId(planId);
    try {
      const res = await apiClient.post<{
        brCode: string;
        brCodeBase64: string;
        amount: number;
        paymentId: string;
        pixId: string;
        expiresAt?: string;
        planName: string;
        originalPrice: number;
        appliedCoupon?: { code: string; discountString: string };
      }>(`/api/students/personals/${personalId}/subscribe`, { planId });
      onSubscribe(personalId, planId, res.data);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : "Erro ao assinar";
      alert(msg);
    } finally {
      setSubscribingPlanId(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <DuoButton variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </DuoButton>
        <div className="py-12 text-center text-duo-gray-dark">
          Carregando perfil...
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
          {error || "Personal não encontrado"}
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
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-duo-border">
                <Image
                  src={profile.avatar || "/placeholder.svg"}
                  alt={profile.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-duo-fg">{profile.name}</h2>
                <div className="mt-1 flex flex-wrap gap-2">
                  {profile.atendimentoPresencial && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-duo-blue/10 px-2 py-0.5 text-xs font-bold text-duo-blue">
                      <MapPin className="h-3 w-3" />
                      Presencial
                    </span>
                  )}
                  {profile.atendimentoRemoto && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-duo-purple/10 px-2 py-0.5 text-xs font-bold text-duo-purple">
                      <Monitor className="h-3 w-3" />
                      Remoto
                    </span>
                  )}
                  {profile.isSubscribed && (
                    <span className="rounded-full bg-duo-green/10 px-2 py-0.5 text-xs font-bold text-duo-green">
                      Inscrito
                    </span>
                  )}
                </div>
              </div>
            </div>
          </DuoCard.Header>
          {profile.bio && (
            <p className="text-sm text-duo-gray-dark">{profile.bio}</p>
          )}
        </DuoCard.Root>
      </FadeIn>

      {profile.gyms.length > 0 && (
        <DuoCard.Root variant="default" padding="md">
          <DuoCard.Header>
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-duo-secondary" />
              <h2 className="font-bold text-duo-fg">Academias</h2>
            </div>
          </DuoCard.Header>
          <div className="space-y-2">
            {profile.gyms.map((g) => (
              <div
                key={g.id}
                className="flex items-center gap-2 text-sm text-duo-gray-dark"
              >
                <MapPin className="h-4 w-4 shrink-0" />
                {g.name}
                {g.address && (
                  <span className="text-duo-gray-dark"> • {g.address}</span>
                )}
              </div>
            ))}
          </div>
        </DuoCard.Root>
      )}

      <DuoCard.Root variant="default" padding="md">
        <DuoCard.Header>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-duo-secondary" />
            <h2 className="font-bold text-duo-fg">Planos</h2>
          </div>
        </DuoCard.Header>
        <div className="space-y-3">
          {profile.plans.length === 0 ? (
            <p className="py-4 text-center text-sm text-duo-gray-dark">
              Nenhum plano disponível
            </p>
          ) : (
            profile.plans.map((plan) => (
              <DuoCard.Root
                key={plan.id}
                variant="default"
                size="default"
                className={cn(
                  !profile.isSubscribed &&
                    "cursor-pointer transition-all hover:border-duo-blue",
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-duo-text">{plan.name}</p>
                    <p className="text-xs text-duo-gray-dark">
                      {plan.duration} dias • {plan.type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-duo-green">
                      R$ {plan.price.toFixed(2)}
                    </p>
                    {!profile.isSubscribed && (
                      <DuoButton
                        size="sm"
                        variant="primary"
                        className="mt-2"
                        disabled={subscribingPlanId === plan.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSubscribe(plan.id);
                        }}
                      >
                        {subscribingPlanId === plan.id
                          ? "Processando..."
                          : "Assinar"}
                      </DuoButton>
                    )}
                  </div>
                </div>
              </DuoCard.Root>
            ))
          )}
        </div>
      </DuoCard.Root>
    </div>
  );
}
