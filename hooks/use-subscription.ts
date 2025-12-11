"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { useSubscriptionStore } from "@/stores/subscription-store";

export interface SubscriptionData {
  id: string;
  plan: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  trialStart: Date | null;
  trialEnd: Date | null;
  isTrial: boolean;
  daysRemaining: number | null;
}

interface UseSubscriptionOptions {
  includeDaysRemaining?: boolean;
  includeTrialInfo?: boolean;
}

export function useSubscription(options?: UseSubscriptionOptions) {
  const queryClient = useQueryClient();
  const { setSubscription } = useSubscriptionStore();

  const { data, isLoading, error, refetch } = useQuery<SubscriptionData | null>({
    queryKey: ["subscription", options],
    queryFn: async () => {
      try {
        const response = await apiClient.get<{ subscription: SubscriptionData | null }>(
          "/api/subscriptions/current"
        );
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
        };
      } catch (error) {
        console.error("Erro ao buscar subscription:", error);
        return null;
      }
    },
    staleTime: 0, // Sempre considerar stale para permitir refetch imediato
    retry: false,
    onSuccess: (data) => {
      // Sincronizar com store
      // Se data for null, verificar se há uma subscription temporária no store antes de sobrescrever
      if (data === null) {
        const storeState = useSubscriptionStore.getState();
        const currentStore = storeState.subscription;
        // Se houver uma subscription temporária (otimista), manter ela
        if (currentStore && currentStore.id === "temp-trial-id") {
          // Não atualizar, manter a temporária até que o refetch retorne dados válidos
          return;
        }
      }
      // Atualizar com os dados reais (ou null se não houver temporária)
      setSubscription(data);
    },
  });

  const startTrialMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<{
        success?: boolean;
        error?: string;
      }>("/api/subscriptions/start-trial");
      return response.data;
    },
    onMutate: async () => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: ["subscription"] });
      
      // Snapshot do valor anterior
      const previousSubscription = queryClient.getQueryData<SubscriptionData | null>(["subscription", options]);
      
      // Criar subscription otimista para trial
      const now = new Date();
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + 14);
      
      const optimisticSubscription: SubscriptionData = {
        id: "temp-trial-id",
        plan: "premium",
        status: "trialing",
        currentPeriodStart: now,
        currentPeriodEnd: trialEnd,
        cancelAtPeriodEnd: false,
        canceledAt: null,
        trialStart: now,
        trialEnd: trialEnd,
        isTrial: true,
        daysRemaining: 14,
      };
      
      // Update otimista no Zustand PRIMEIRO para atualização imediata
      setSubscription(optimisticSubscription);
      
      // Atualizar o cache do React Query para que subscriptionData reflita a mudança imediatamente
      // Isso garante que o componente veja a mudança instantaneamente
      queryClient.setQueryData<SubscriptionData | null>(["subscription", options], optimisticSubscription);
      
      return { previousSubscription };
    },
    onError: (err, variables, context) => {
      // Reverter para o valor anterior em caso de erro
      if (context?.previousSubscription !== undefined) {
        setSubscription(context.previousSubscription);
        queryClient.setQueryData<SubscriptionData | null>(["subscription", options], context.previousSubscription);
      }
    },
    onSuccess: async () => {
      // Aguardar um pouco para garantir que o banco processou a criação
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      // Invalidar todas as queries de subscription para forçar refetch
      queryClient.invalidateQueries({ 
        queryKey: ["subscription"],
        exact: false 
      });
      
      // Fazer refetch com retry para garantir que pegamos os dados
      let retries = 0;
      const maxRetries = 5;
      let foundValidData = false;
      
      while (retries < maxRetries && !foundValidData) {
        const result = await queryClient.refetchQueries({ 
          queryKey: ["subscription"],
          exact: false 
        });
        
        // Verificar se algum resultado retornou dados válidos
        for (const query of result) {
          const data = query.state?.data as SubscriptionData | null;
          if (data !== null && data !== undefined && data.id !== "temp-trial-id") {
            foundValidData = true;
            // Atualizar o store com os dados reais
            setSubscription(data);
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
    mutationFn: async (plan: "monthly" | "annual") => {
      const response = await apiClient.post<{
        billingUrl?: string;
        error?: string;
      }>("/api/subscriptions/create", {
        plan,
      });
      return response.data;
    },
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<{
        success?: boolean;
        error?: string;
      }>("/api/subscriptions/cancel");
      return response.data;
    },
    onMutate: async () => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: ["subscription"] });
      
      // Snapshot do valor anterior
      const previousSubscription = queryClient.getQueryData<SubscriptionData | null>(["subscription", options]);
      
      // Update otimista no Zustand - limpar subscription para permitir assinar novamente
      setSubscription(null);
      
      // Também atualizar o cache do React Query para atualização imediata da UI
      queryClient.setQueryData<SubscriptionData | null>(["subscription", options], null);
      
      return { previousSubscription };
    },
    onError: (err, variables, context) => {
      // Reverter para o valor anterior em caso de erro
      if (context?.previousSubscription) {
        setSubscription(context.previousSubscription);
      }
    },
    onSuccess: () => {
      // Invalidar e refetch para garantir sincronização com backend
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });

  return {
    subscription: data,
    isLoading,
    error,
    refetch,
    startTrial: startTrialMutation.mutateAsync,
    isStartingTrial: startTrialMutation.isPending,
    createSubscription: createSubscriptionMutation.mutateAsync,
    isCreatingSubscription: createSubscriptionMutation.isPending,
    cancelSubscription: cancelSubscriptionMutation.mutateAsync,
    isCancelingSubscription: cancelSubscriptionMutation.isPending,
  };
}

