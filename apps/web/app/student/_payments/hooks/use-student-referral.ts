"use client";

import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { apiClient } from "@/lib/api/client";
import { useToast } from "@/hooks/use-toast";
import { parseCurrencyBR } from "@/lib/utils/currency";

const withdrawAmountSchema = (balanceReais: number) =>
  z
    .string()
    .min(1, "Informe o valor")
    .transform(parseCurrencyBR)
    .refine((n) => !Number.isNaN(n), "Valor inválido")
    .refine((n) => n >= 3.5, "Valor mínimo: R$ 3,50")
    .refine((n) => n <= balanceReais, "Saldo insuficiente");

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

  // Refetch ao voltar para a página (ex.: após pagar PIX e retornar)
  useEffect(() => {
    const onFocus = () => loadData();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadData]);

  const referralCode = data?.referralCode ?? "";

  const copyCode = useCallback(() => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [referralCode]);

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
    const balanceReais = data?.balanceReais ?? 0;
    const parsed = withdrawAmountSchema(balanceReais).safeParse(withdrawAmount);
    if (!parsed.success) {
      toast({
        variant: "destructive",
        title: "Valor inválido",
        description: parsed.error.errors[0]?.message ?? "Verifique o valor.",
      });
      return;
    }
    const amount = parsed.data;

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
    referralCode,
    copyCode,
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
