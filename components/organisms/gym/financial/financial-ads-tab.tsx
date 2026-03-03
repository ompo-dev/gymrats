"use client";

import {
  AlertCircle,
  Eye,
  MousePointerClick,
  Plus,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DuoButton, DuoCard, DuoInput } from "@/components/duo";
import { useToast } from "@/hooks/use-toast";
import type { BoostCampaign, Coupon, MembershipPlan } from "@/lib/types";

// Actions
import { createBoostCampaign, getBoostCampaignPaymentUrl } from "@/app/gym/actions";

interface FinancialAdsTabProps {
  campaigns?: BoostCampaign[];
  coupons?: Coupon[];
  plans?: MembershipPlan[];
}

export function FinancialAdsTab({
  campaigns = [],
  coupons = [],
  plans = [],
}: FinancialAdsTabProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#E2FF38");
  const [linkedCouponId, setLinkedCouponId] = useState("");
  const [linkedPlanId, setLinkedPlanId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);

  const PRICE_PER_12H = 30; // R$ 30,00 por 12 horas

  const handleCreate = async () => {
    // Validação
    if (!title.trim() || !description.trim()) {
      toast({ variant: "destructive", title: "Preencha todos os campos." });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createBoostCampaign({
        title,
        description,
        primaryColor,
        linkedCouponId: linkedCouponId || null,
        linkedPlanId: linkedPlanId || null,
        durationHours: 12,
        amountCents: PRICE_PER_12H * 100,
      });

      if (result.success && result.abacatePayUrl) {
        toast({
          title: "Campanha criada!",
          description: "Redirecionando para pagamento...",
        });
        window.location.href = result.abacatePayUrl;
      } else {
        toast({ variant: "destructive", title: result.error });
        setIsSubmitting(false);
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao criar campanha." });
      setIsSubmitting(false);
    }
  };

  const handlePayCampaign = async (campaign: BoostCampaign) => {
    setPayingId(campaign.id);
    try {
      const result = await getBoostCampaignPaymentUrl(campaign.id);
      if (result.success) {
        window.location.href = result.url;
      } else {
        toast({ variant: "destructive", title: result.error });
        setPayingId(null);
      }
    } catch {
      toast({ variant: "destructive", title: "Erro ao buscar link de pagamento." });
      setPayingId(null);
    }
  };

  return (
    <>
      <DuoCard.Root variant="default" padding="md">
        <DuoCard.Header>
          <div className="flex items-center gap-2">
            <Sparkles
              className="h-5 w-5 shrink-0"
              style={{ color: "var(--duo-secondary)" }}
              aria-hidden
            />
            <h2 className="font-bold text-[var(--duo-fg)]">Anúncios</h2>
          </div>
          <DuoButton size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Novo anúncio
          </DuoButton>
        </DuoCard.Header>

        <div className="space-y-4">
          <DuoCard.Root className="border-duo-secondary/30 bg-duo-secondary/5">
            <div className="p-3 text-sm text-duo-text">
              <span className="font-bold flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-duo-secondary" />
                Destaque sua academia
              </span>
              Seu anúncio aparecerá com prioridade para todos os alunos da
              região. Custa apenas{" "}
              <strong className="text-duo-text">
                R$ {PRICE_PER_12H.toFixed(2)}
              </strong>{" "}
              por 12 horas.
            </div>
          </DuoCard.Root>

          {campaigns.length === 0 && (
            <p className="py-8 text-center text-sm text-duo-gray-dark border-2 border-dashed border-duo-border rounded-xl">
              Você ainda não tem campanhas ativas. Crie um anúncio para
              impulsionar suas assinaturas.
            </p>
          )}

          {campaigns.map((campaign) => (
            <DuoCard.Root
              key={campaign.id}
              className="border-2 border-duo-border"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg text-duo-text flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: campaign.primaryColor }}
                    />
                    {campaign.title}
                  </h3>
                  <div className="text-sm text-duo-gray-dark mt-1 flex gap-3">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" /> {campaign.impressions} Views
                    </span>
                    <span className="flex items-center gap-1">
                      <MousePointerClick className="w-4 h-4" />{" "}
                      {campaign.clicks} Clicks
                    </span>
                  </div>
                </div>
                {campaign.status === "active" && (
                  <span className="bg-duo-secondary/20 text-duo-secondary px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                    Ativo
                  </span>
                )}
                {campaign.status === "pending_payment" && (
                  <span className="bg-duo-yellow/20 text-duo-yellow px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                    Aguardando Pagamento
                  </span>
                )}
              </div>

              {campaign.status === "pending_payment" && (
                <DuoButton
                  size="sm"
                  className="w-full mt-1"
                  disabled={payingId === campaign.id}
                  onClick={() => handlePayCampaign(campaign)}
                >
                  {payingId === campaign.id ? "Buscando link..." : "Pagar agora"}
                </DuoButton>
              )}
            </DuoCard.Root>
          ))}
        </div>
      </DuoCard.Root>

      {/* Modal de Criação */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
        >
          <DuoCard.Root className="w-full max-w-md max-h-[90vh] flex flex-col">
            <DuoCard.Header className="shrink-0 pb-0">
              <h3 className="font-bold text-xl text-duo-text">Criar Anúncio</h3>
            </DuoCard.Header>
            <div className="p-4 overflow-y-auto space-y-4">
              <div>
                <h4 className="text-sm font-bold text-duo-text mb-2 border-b border-duo-border pb-1">
                  Preview
                </h4>
                {/* Card Preview */}
                <div
                  className="border-2 rounded-xl p-4 overflow-hidden relative group"
                  style={{ borderColor: primaryColor }}
                >
                  <div
                    className="absolute top-0 left-0 w-full h-1"
                    style={{ backgroundColor: primaryColor }}
                  />

                  <div className="flex justify-between mt-1 mb-2">
                    <span className="text-[10px] uppercase font-bold text-duo-gray-dark bg-duo-bg px-2 py-0.5 rounded-md border border-duo-border">
                      Patrocinado
                    </span>
                  </div>

                  <h5
                    className="font-bold text-lg"
                    style={{ color: primaryColor }}
                  >
                    {title || "Título Chamativo da Promoção"}
                  </h5>
                  <p className="text-sm text-duo-text mt-1">
                    {description ||
                      "Mostre por que os alunos devem escolher a sua academia. Descreva os benefícios, planos e diferenciais..."}
                  </p>

                  <div className="mt-4 pt-3 border-t border-duo-border flex justify-between items-center">
                    <div className="text-xs text-duo-gray-dark font-medium">
                      {linkedCouponId ? "Cupom vinculado" : "Sem cupom"} •{" "}
                      {linkedPlanId ? "Plano vinculado" : "Perfil da academia"}
                    </div>
                    <button
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-duo-bg transition-transform group-hover:scale-105"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Assinar Agora
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <DuoInput.Simple
                  label="Título do Anúncio"
                  placeholder="Ex: Promoção de Verão"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <div>
                  <label className="text-sm font-bold text-duo-text mb-1 block">
                    Descrição
                  </label>
                  <textarea
                    className="w-full h-24 rounded-xl border-2 border-duo-border bg-duo-bg p-3 text-duo-text focus:border-duo-primary focus:outline-none transition-colors"
                    placeholder="Descreva a oferta..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-duo-text mb-1 block">
                    Cor Primária (Hex)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-12 h-12 p-1 rounded-xl cursor-pointer border-2 border-duo-border bg-duo-bg"
                    />
                    <DuoInput.Simple
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-duo-text mb-1 block">
                    Cupom Vinculado (Opcional)
                  </label>
                  <select
                    className="w-full rounded-xl border-2 border-duo-border bg-duo-bg p-3 font-medium text-duo-text outline-none focus:border-duo-primary focus:ring-4 focus:ring-duo-primary/20"
                    value={linkedCouponId}
                    onChange={(e) => setLinkedCouponId(e.target.value)}
                  >
                    <option value="">Nenhum cupom</option>
                    {coupons.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} (
                        {c.type === "percentage"
                          ? `${c.value}%`
                          : `R$ ${c.value}`}
                        )
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-duo-gray-dark mt-1">
                    Se selecionado, o desconto será aplicado automaticamente no
                    checkout.
                  </p>
                </div>

                <div>
                  <label className="text-sm font-bold text-duo-text mb-1 block">
                    Plano Vinculado (Opcional)
                  </label>
                  <select
                    className="w-full rounded-xl border-2 border-duo-border bg-duo-bg p-3 font-medium text-duo-text outline-none focus:border-duo-primary focus:ring-4 focus:ring-duo-primary/20"
                    value={linkedPlanId}
                    onChange={(e) => setLinkedPlanId(e.target.value)}
                  >
                    <option value="">Levar para o perfil da academia</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-duo-gray-dark mt-1">
                    Se selecionado, o usuário será direcionado diretamente para
                    o modal de pagamento deste plano.
                  </p>
                </div>
              </div>
            </div>

            <div className="shrink-0 p-4 pt-1 border-t border-duo-border flex gap-2">
              <DuoButton
                variant="secondary"
                className="flex-1"
                onClick={() => setModalOpen(false)}
              >
                Cancelar
              </DuoButton>
              <DuoButton
                className="flex-1"
                onClick={handleCreate}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Processando..."
                  : `Pagar R$ ${PRICE_PER_12H.toFixed(2)}`}
              </DuoButton>
            </div>
          </DuoCard.Root>
        </div>
      )}
    </>
  );
}
