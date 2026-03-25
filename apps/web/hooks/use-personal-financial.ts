"use client";

import { useCallback, useMemo, useState } from "react";
import { usePersonal } from "@/hooks/use-personal";
import { useToast } from "@/hooks/use-toast";

export function usePersonalFinancial() {
  const subscription = usePersonal("subscription");
  const students = usePersonal("students");
  const affiliations = usePersonal("affiliations");
  const actions = usePersonal("actions");
  const loaders = usePersonal("loaders");
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [pixModal, setPixModal] = useState<{
    pixId: string;
    brCode: string;
    brCodeBase64: string;
    amount: number;
    expiresAt?: string;
  } | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const stats = useMemo(() => {
    const studentsViaGym = students.filter((item) => item.gym?.id).length;
    const independentStudents = students.length - studentsViaGym;
    return {
      gyms: affiliations.length,
      students: students.length,
      studentsViaGym,
      independentStudents,
    };
  }, [affiliations.length, students]);

  const handleSubscribe = useCallback(
    async (plan: "standard" | "pro_ai", billingPeriod: "monthly" | "annual") => {
      setIsSubmitting(true);
      try {
        const result = await actions.createPersonalSubscription({
          plan,
          billingPeriod,
        });
        if (result?.pix) {
          setPixModal({
            pixId: result.pix.pixId,
            brCode: result.pix.brCode,
            brCodeBase64: result.pix.brCodeBase64,
            amount: result.pix.amount,
            expiresAt: result.pix.expiresAt,
          });
        } else {
          toast({
            title: "Assinatura atualizada",
            description: "Seu plano foi registrado.",
          });
        }
      } catch (err) {
        const msg =
          err && typeof err === "object" && "response" in err
            ? (err as { response?: { data?: { error?: string } } }).response
                ?.data?.error
            : err instanceof Error
              ? err.message
              : "Erro ao contratar";
        toast({
          variant: "destructive",
          title: "Erro",
          description: String(msg),
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [actions, toast],
  );

  const handleCancelConfirm = useCallback(async () => {
    setIsCanceling(true);
    try {
      await actions.cancelPersonalSubscription();
      toast({
        title: "Assinatura cancelada",
        description: "Sua assinatura foi cancelada com sucesso.",
      });
      setCancelDialogOpen(false);
    } catch (err) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : err instanceof Error
            ? err.message
            : "Erro ao cancelar";
      toast({
        variant: "destructive",
        title: "Erro",
        description: String(msg),
      });
    } finally {
      setIsCanceling(false);
    }
  }, [actions, toast]);

  const handlePixConfirmed = useCallback(() => {
    setPixModal(null);
  }, []);

  return {
    subscription,
    stats,
    isSubmitting,
    isCanceling,
    pixModal,
    setPixModal,
    cancelDialogOpen,
    setCancelDialogOpen,
    handleSubscribe,
    handleCancelConfirm,
    handlePixConfirmed,
    loadSection: loaders.loadSection,
  };
}
