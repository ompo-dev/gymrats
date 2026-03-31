"use client";

import {
  ArrowLeft,
  CreditCard,
  Dumbbell,
  MapPin,
  Monitor,
  UserMinus,
  Users,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { FadeIn } from "@/components/animations/fade-in";
import { DuoButton, DuoCard } from "@/components/duo";
import { AcademyListItemCard } from "@/components/organisms/sections/list-item-cards";
import { usePaymentFlow } from "@/hooks/use-payment-flow";
import { useStudent } from "@/hooks/use-student";
import { useToast } from "@/hooks/use-toast";
import type { DiscoveryPersonalProfile } from "@/lib/types/discovery-profiles";
import type { StudentPixPaymentPayload } from "@/lib/types/student-unified";
import { cn } from "@/lib/utils";
import {
  getPersonalProfileCacheKey,
  useDiscoveryProfilesStore,
} from "@/stores/discovery-profiles-store";

interface PersonalProfileViewProps {
  personalId: string;
  onBack: () => void;
  onCancelAssignment?: (assignmentId: string) => void | Promise<void>;
  onViewGym?: (gymId: string) => void;
  profileRefreshKey?: number;
  onSubscribe: (
    personalId: string,
    planId: string,
    paymentData: StudentPixPaymentPayload,
  ) => void;
  preSelectedPlan?: string | null;
  preSelectedCoupon?: string | null;
}

export function PersonalProfileView({
  personalId,
  onBack,
  onCancelAssignment,
  onViewGym,
  profileRefreshKey,
  onSubscribe,
  preSelectedPlan,
  preSelectedCoupon,
}: PersonalProfileViewProps) {
  const [subscribingPlanId, setSubscribingPlanId] = useState<string | null>(
    null,
  );
  const [autoStarted, setAutoStarted] = useState(false);
  const { subscribeToPersonal } = useStudent("actions");
  const { invalidatePaymentQueries } = usePaymentFlow();
  const { toast } = useToast();
  const cacheKey = getPersonalProfileCacheKey(personalId);
  const profile = useDiscoveryProfilesStore(
    (state) =>
      state.personalProfiles[cacheKey] as DiscoveryPersonalProfile | null,
  );
  const resource = useDiscoveryProfilesStore(
    (state) => state.resources[cacheKey],
  );
  const loadPersonalProfile = useDiscoveryProfilesStore(
    (state) => state.loadPersonalProfile,
  );
  const loading = !profile && (!resource || resource.status === "loading");
  const error = resource?.error ?? null;
  const profileGyms = Array.isArray(profile?.gyms) ? profile.gyms : [];
  const profilePlans = Array.isArray(profile?.plans) ? profile.plans : [];

  useEffect(() => {
    void loadPersonalProfile(personalId, profileRefreshKey !== undefined);
  }, [loadPersonalProfile, personalId, profileRefreshKey]);

  const handleSubscribe = useCallback(
    async (planId: string, couponId?: string | null) => {
      if (!profile) return;
      setSubscribingPlanId(planId);
      try {
        const paymentData = await subscribeToPersonal({
          personalId,
          planId,
          couponId: couponId || null,
        });
        await invalidatePaymentQueries();
        onSubscribe(personalId, planId, paymentData);
      } catch (err: unknown) {
        const msg =
          err && typeof err === "object" && "response" in err
            ? (err as { response?: { data?: { error?: string } } }).response
                ?.data?.error
            : err instanceof Error
              ? err.message
              : "Erro ao assinar";
        toast({
          variant: "destructive",
          title: "Erro",
          description: String(msg),
        });
      } finally {
        setSubscribingPlanId(null);
      }
    },
    [
      invalidatePaymentQueries,
      onSubscribe,
      personalId,
      profile,
      subscribeToPersonal,
      toast,
    ],
  );

  useEffect(() => {
    if (profile && preSelectedPlan && !autoStarted && !profile.isSubscribed) {
      const plan = profilePlans.find((p) => p.id === preSelectedPlan);
      if (plan) {
        setAutoStarted(true);
        handleSubscribe(preSelectedPlan, preSelectedCoupon);
      }
    }
  }, [
    profile,
    preSelectedPlan,
    preSelectedCoupon,
    autoStarted,
    handleSubscribe,
    profilePlans,
  ]);

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

      <div className="grid gap-4 sm:grid-cols-2">
        <DuoCard.Root variant="default" size="sm">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-duo-blue" />
            <div>
              <p className="text-xs text-duo-gray-dark">Alunos</p>
              <p className="text-lg font-bold">{profile.studentsCount ?? 0}</p>
            </div>
          </div>
        </DuoCard.Root>
        <DuoCard.Root variant="default" size="sm">
          <div className="flex items-center gap-3">
            <Dumbbell className="h-6 w-6 text-duo-orange" />
            <div>
              <p className="text-xs text-duo-gray-dark">Academias</p>
              <p className="text-lg font-bold">{profileGyms.length}</p>
            </div>
          </div>
        </DuoCard.Root>
      </div>

      {profileGyms.length > 0 && (
        <DuoCard.Root variant="default" padding="md">
          <DuoCard.Header>
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-duo-secondary" />
              <h2 className="font-bold text-duo-fg">Academias</h2>
            </div>
          </DuoCard.Header>
          <div className="space-y-3">
            {profileGyms.map((g) => (
              <AcademyListItemCard
                key={g.id}
                image={g.logo || g.image || "/placeholder.svg"}
                name={g.name}
                onClick={() => onViewGym?.(g.id)}
                address={g.address}
                hoverColor="duo-blue"
              />
            ))}
          </div>
        </DuoCard.Root>
      )}

      {profile.isSubscribed && profile.myAssignment && onCancelAssignment && (
        <DuoCard.Root variant="default" padding="md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold text-duo-fg">
                Você está vinculado a este personal
              </p>
              <p className="text-sm text-duo-fg-muted">
                Vínculo ativo
                {profile.myAssignment.activePlan && (
                  <>
                    {" "}
                    • Plano:{" "}
                    <span className="font-semibold text-duo-fg">
                      {profile.myAssignment.activePlan.name}
                    </span>{" "}
                    — R$ {profile.myAssignment.activePlan.price.toFixed(2)}
                  </>
                )}
              </p>
            </div>
            <DuoButton
              variant="outline"
              size="sm"
              onClick={() => onCancelAssignment(profile.myAssignment!.id)}
              className="gap-2 border-duo-red text-duo-red hover:bg-duo-red/10"
            >
              <UserMinus className="h-4 w-4" />
              Desvincular
            </DuoButton>
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
          {profilePlans.length === 0 ? (
            <p className="py-4 text-center text-sm text-duo-gray-dark">
              Nenhum plano disponível
            </p>
          ) : (
            profilePlans.map((plan) => (
              <DuoCard.Root
                key={plan.id}
                variant="default"
                size="default"
                className={cn(
                  !profile.isSubscribed &&
                    "cursor-pointer transition-all hover:border-duo-blue",
                  profile.myAssignment?.activePlan?.id === plan.id &&
                    "border-duo-green ring-1 ring-duo-green/30",
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
                    {profile.myAssignment?.activePlan?.id === plan.id && (
                      <span className="mt-1 inline-flex items-center rounded-full border-2 border-duo-green bg-duo-green/10 px-3 py-1 text-xs font-bold text-duo-green">
                        Plano ativo
                      </span>
                    )}
                    {!profile.isSubscribed && (
                      <DuoButton
                        size="sm"
                        variant="primary"
                        className="mt-2"
                        disabled={subscribingPlanId === plan.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSubscribe(plan.id, undefined);
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
