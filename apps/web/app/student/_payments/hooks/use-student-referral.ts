"use client";

import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { useStudent } from "@/hooks/use-student";
import { useToast } from "@/hooks/use-toast";
import type { StudentReferralData } from "@/lib/types/student-unified";
import { parseCurrencyBR } from "@/lib/utils/currency";

const withdrawAmountSchema = (balanceReais: number) =>
  z
    .string()
    .min(1, "Informe o valor")
    .transform(parseCurrencyBR)
    .refine((n) => !Number.isNaN(n), "Valor invalido")
    .refine((n) => n >= 3.5, "Valor minimo: R$ 3,50")
    .refine((n) => n <= balanceReais, "Saldo insuficiente");

export type ReferralData = StudentReferralData;

export function useStudentReferral() {
  const { toast } = useToast();
  const referralData = useStudent("referral") as unknown as
    | StudentReferralData
    | null;
  const { loadReferral } = useStudent("loaders");
  const { updateReferralPixKey, requestReferralWithdraw } =
    useStudent("actions");

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
      await loadReferral();
    } catch {
      toast({
        variant: "destructive",
        title: "Erro ao carregar indicacoes",
        description: "Nao foi possivel carregar o historico de indicacoes.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [loadReferral, toast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (referralData?.pixKey) {
      setPixKey(referralData.pixKey);
    }
    if (referralData?.pixKeyType) {
      setPixKeyType(referralData.pixKeyType);
    }
    if (referralData) {
      setIsLoading(false);
    }
  }, [referralData]);

  useEffect(() => {
    const onFocus = () => {
      void loadData();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadData]);

  const referralCode = referralData?.referralCode ?? "";

  const copyCode = useCallback(() => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [referralCode]);

  const handleUpdatePix = useCallback(async () => {
    try {
      setIsUpdatingPix(true);
      await updateReferralPixKey({
        pixKey,
        pixKeyType,
      });
      toast({
        title: "Chave PIX atualizada!",
        description: "Agora voce pode realizar saques de suas comissoes.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Nao foi possivel atualizar a chave PIX.",
      });
    } finally {
      setIsUpdatingPix(false);
    }
  }, [pixKey, pixKeyType, toast, updateReferralPixKey]);

  const handleWithdraw = useCallback(async () => {
    const balanceReais = referralData?.balanceReais ?? 0;
    const parsed = withdrawAmountSchema(balanceReais).safeParse(withdrawAmount);
    if (!parsed.success) {
      toast({
        variant: "destructive",
        title: "Valor invalido",
        description: parsed.error.errors[0]?.message ?? "Verifique o valor.",
      });
      return;
    }

    try {
      setIsWithdrawing(true);
      await requestReferralWithdraw(Math.floor(parsed.data * 100));
      toast({
        title: "Saque solicitado!",
        description: "O valor sera transferido para sua chave PIX.",
      });
      setWithdrawAmount("");
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
        description:
          (typeof errorMsg === "string" ? errorMsg : undefined) ??
          "Verifique sua chave PIX ou saldo.",
      });
    } finally {
      setIsWithdrawing(false);
    }
  }, [referralData?.balanceReais, requestReferralWithdraw, toast, withdrawAmount]);

  return {
    data: referralData,
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
