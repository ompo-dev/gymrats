"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import { useToast } from "@/hooks/use-toast";

export interface ReferralData {
  referralCode: string;
  pixKey: string | null;
  pixKeyType: string | null;
  balanceReais: number;
  balanceCents: number;
  totalEarnedCents: number;
  withdraws: {
    id: string;
    amount: number;
    status: string;
    createdAt: Date;
    completedAt: Date | null;
  }[];
}

export function useStudentReferral() {
  const { toast } = useToast();
  const [data, setData] = useState<ReferralData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pixKey, setPixKey] = useState("");
  const [pixKeyType, setPixKeyType] = useState("CPF");
  const [isUpdatingPix, setIsUpdatingPix] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [copied, setCopied] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get<ReferralData>("/api/students/referrals");
      setData(res.data);
      if (res.data.pixKey) setPixKey(res.data.pixKey);
      if (res.data.pixKeyType) setPixKeyType(res.data.pixKeyType);
    } catch {
      toast({
        variant: "destructive",
        title: "Erro ao carregar indicações",
        description: "Não foi possível carregar o histórico de indicações.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refSlug = data?.referralCode?.replace("@", "") ?? "";
  const getReferralLink = useCallback(
    () =>
      typeof window !== "undefined"
        ? `${window.location.origin}/r/${refSlug}`
        : "",
    [refSlug],
  );

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(getReferralLink());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [getReferralLink]);

  const handleUpdatePix = useCallback(async () => {
    try {
      setIsUpdatingPix(true);
      await apiClient.post("/api/students/referrals/pix-key", {
        pixKey,
        pixKeyType,
      });
      toast({
        title: "Chave PIX atualizada!",
        description: "Agora você pode realizar saques de suas comissões.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar a chave PIX.",
      });
    } finally {
      setIsUpdatingPix(false);
    }
  }, [pixKey, pixKeyType, toast]);

  const handleWithdraw = useCallback(async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 3.5) {
      toast({
        variant: "destructive",
        title: "Valor inválido",
        description: "O valor mínimo para saque é de R$ 3,50.",
      });
      return;
    }

    try {
      setIsWithdrawing(true);
      await apiClient.post("/api/students/referrals/withdraw", {
        amountCents: Math.floor(amount * 100),
      });
      toast({
        title: "Saque solicitado!",
        description: "O valor será transferido para sua chave PIX.",
      });
      setWithdrawAmount("");
      await loadData();
    } catch (err: unknown) {
      const errorMsg =
        err &&
        typeof err === "object" &&
        "response" in err &&
        (err as { response?: { data?: { error?: string } } }).response?.data
          ?.error;
      toast({
        variant: "destructive",
        title: "Erro ao sacar",
        description: (typeof errorMsg === "string" ? errorMsg : undefined) ?? "Verifique sua chave PIX ou saldo.",
      });
    } finally {
      setIsWithdrawing(false);
    }
  }, [withdrawAmount, loadData, toast]);

  return {
    data,
    isLoading,
    refSlug,
    getReferralLink,
    copyLink,
    copied,
    pixKey,
    setPixKey,
    pixKeyType,
    setPixKeyType,
    isUpdatingPix,
    handleUpdatePix,
    withdrawAmount,
    setWithdrawAmount,
    isWithdrawing,
    handleWithdraw,
    loadData,
  };
}
