"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

export interface GymSubscriptionData {
  id: string;
  plan: string;
  status: string;
  basePrice: number;
  pricePerStudent: number;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  trialStart: Date | null;
  trialEnd: Date | null;
  isTrial: boolean;
  daysRemaining: number | null;
  activeStudents: number;
  totalAmount: number;
}

interface UseGymSubscriptionOptions {
  includeDaysRemaining?: boolean;
  includeTrialInfo?: boolean;
  includeActiveStudents?: boolean;
}

export function useGymSubscription(options?: UseGymSubscriptionOptions) {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery<GymSubscriptionData | null>({
    queryKey: ["gym-subscription", options],
    queryFn: async () => {
      const response = await apiClient.get<{
        subscription: GymSubscriptionData | null;
      }>("/api/gym-subscriptions/current");
      const sub = response.data.subscription;
      
      if (!sub) {
        return null;
      }

      // Converter strings de data para Date objects
      return {
        ...sub,
        currentPeriodStart: new Date(sub.currentPeriodStart),
        currentPeriodEnd: new Date(sub.currentPeriodEnd),
        trialStart: sub.trialStart ? new Date(sub.trialStart) : null,
        trialEnd: sub.trialEnd ? new Date(sub.trialEnd) : null,
        canceledAt: sub.canceledAt ? new Date(sub.canceledAt) : null,
        isTrial: sub.trialEnd ? new Date(sub.trialEnd) > new Date() : false,
        daysRemaining: sub.trialEnd
          ? Math.max(
              0,
              Math.ceil(
                (new Date(sub.trialEnd).getTime() - new Date().getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            )
          : null,
        activeStudents: sub.activeStudents || 0,
        totalAmount: sub.totalAmount || 0,
      };
    },
    staleTime: 0, // Sempre considerar stale para permitir refetch imediato
    retry: false,
    onSuccess: (data) => {
      // Se data for null, verificar se há uma subscription temporária no cache antes de sobrescrever
      if (data === null) {
        const currentCache = queryClient.getQueryData<GymSubscriptionData | null>(["gym-subscription", options]);
        // Se houver uma subscription temporária (otimista), manter ela
        if (currentCache && currentCache.id === "temp-trial-id") {
          // Não atualizar, manter a temporária
          return;
        }
      }
      // Atualizar com os dados reais (ou null se não houver temporária)
    },
  });

  const startTrialMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<{
        success?: boolean;
        error?: string;
      }>("/api/gym-subscriptions/start-trial");
      return response.data;
    },
    onMutate: async () => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: ["gym-subscription"] });
      
      // Snapshot do valor anterior
      const previousSubscription = queryClient.getQueryData<GymSubscriptionData | null>(["gym-subscription", options]);
      
      // Criar subscription otimista para trial
      const now = new Date();
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + 14);
      
      const optimisticSubscription: GymSubscriptionData = {
        id: "temp-trial-id",
        plan: "basic",
        status: "trialing",
        basePrice: 199,
        pricePerStudent: 2,
        currentPeriodStart: now,
        currentPeriodEnd: trialEnd,
        cancelAtPeriodEnd: false,
        canceledAt: null,
        trialStart: now,
        trialEnd: trialEnd,
        isTrial: true,
        daysRemaining: 14,
        activeStudents: 0,
        totalAmount: 199,
      };
      
      // Atualizar o cache do React Query para atualização imediata da UI
      queryClient.setQueryData<GymSubscriptionData | null>(["gym-subscription", options], optimisticSubscription);
      
      return { previousSubscription };
    },
    onError: (err, variables, context) => {
      // Reverter para o valor anterior em caso de erro
      if (context?.previousSubscription !== undefined) {
        queryClient.setQueryData<GymSubscriptionData | null>(["gym-subscription", options], context.previousSubscription);
      }
    },
    onSuccess: async () => {
      // Aguardar um pouco para garantir que o banco processou a criação
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      // Invalidar todas as queries de subscription para forçar refetch
      queryClient.invalidateQueries({ 
        queryKey: ["gym-subscription"],
        exact: false 
      });
      
      // Fazer refetch com retry para garantir que pegamos os dados
      let retries = 0;
      const maxRetries = 5;
      let foundValidData = false;
      
      while (retries < maxRetries && !foundValidData) {
        const result = await queryClient.refetchQueries({ 
          queryKey: ["gym-subscription"],
          exact: false 
        });
        
        // Verificar se algum resultado retornou dados válidos
        for (const query of result) {
          const data = query.state?.data as GymSubscriptionData | null;
          if (data !== null && data !== undefined && data.id !== "temp-trial-id") {
            foundValidData = true;
            break;
          }
        }
        
        if (!foundValidData) {
          retries++;
          if (retries < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
        }
      }
      
      // Se após todas as tentativas não encontramos dados, manter o otimista
      // O usuário verá o trial ativo e na próxima vez que a página carregar terá os dados reais
    },
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: async ({ plan, billingPeriod }: { plan: "basic" | "premium" | "enterprise"; billingPeriod: "monthly" | "annual" }) => {
      const response = await apiClient.post<{
        billingUrl?: string;
        error?: string;
      }>("/api/gym-subscriptions/create", {
        plan,
        billingPeriod,
      });
      return response.data;
    },
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<{
        success?: boolean;
        error?: string;
      }>("/api/gym-subscriptions/cancel");
      return response.data;
    },
    onMutate: async () => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: ["gym-subscription"] });
      
      // Snapshot do valor anterior
      const previousSubscription = queryClient.getQueryData<GymSubscriptionData | null>(["gym-subscription", options]);
      
      // Update otimista no Zustand (se tiver store de gym subscription)
      // Por enquanto apenas invalidamos, mas pode adicionar store depois
      
      return { previousSubscription };
    },
    onError: (err, variables, context) => {
      // Reverter para o valor anterior em caso de erro
      if (context?.previousSubscription) {
        queryClient.setQueryData(["gym-subscription", options], context.previousSubscription);
      }
    },
    onSuccess: () => {
      // Invalidar e refetch para garantir sincronização com backend
      queryClient.invalidateQueries({ queryKey: ["gym-subscription"] });
    },
  });

  const createSubscription = async (
    plan: "basic" | "premium" | "enterprise",
    billingPeriod: "monthly" | "annual" = "monthly"
  ) => {
    return await createSubscriptionMutation.mutateAsync({ plan, billingPeriod });
  };

  return {
    subscription: data,
    isLoading,
    error,
    refetch,
    startTrial: startTrialMutation.mutateAsync,
    isStartingTrial: startTrialMutation.isPending,
    createSubscription,
    isCreatingSubscription: createSubscriptionMutation.isPending,
    cancelSubscription: cancelSubscriptionMutation.mutateAsync,
    isCancelingSubscription: cancelSubscriptionMutation.isPending,
  };
}

