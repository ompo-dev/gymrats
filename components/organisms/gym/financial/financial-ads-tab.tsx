"use client";

import {
  AlertCircle,
  Eye,
  MapPin,
  MousePointerClick,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createBoostCampaign,
  deleteBoostCampaign,
  getBoostCampaignPix,
} from "@/app/gym/actions";
import { PixQrModal } from "@/components/organisms/modals/pix-qr-modal";
import { apiClient } from "@/lib/api/client";
import { DuoButton, DuoCard, DuoInput, DuoSelect } from "@/components/duo";
import { useToast } from "@/hooks/use-toast";
import type { BoostCampaign, Coupon, MembershipPlan } from "@/lib/types";

interface FinancialAdsTabProps {
  campaigns?: BoostCampaign[];
  coupons?: Coupon[];
  plans?: MembershipPlan[];
}

interface PixModalState {
  brCode: string;
  brCodeBase64: string;
  amount: number; // centavos
  campaignId: string; // usado como paymentId no modal
  campaignTitle: string;
  expiresAt?: string;
}

const PRICE_PER_12H = 30; // R$ 30,00 por 12h

const MIN_HOURS = 12;
const STEP_HOURS = 12;
const PRICE_PER_STEP = 30; // R$30 por cada 12h

function formatDuration(hours: number): string {
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  const rem = hours % 24;
  return rem > 0 ? `${days}d ${rem}h` : `${days} dia${days > 1 ? "s" : ""}`;
}

function calcPrice(hours: number): number {
  return (hours / STEP_HOURS) * PRICE_PER_STEP;
}

const STATUS_FILTERS = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Ativos" },
  { value: "pending_payment", label: "Aguardando pagamento" },
  { value: "expired", label: "Expirados" },
  { value: "canceled", label: "Cancelados" },
];

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  active: {
    label: "Ativo",
    className: "bg-duo-secondary/20 text-duo-secondary",
  },
  pending_payment: {
    label: "Aguardando Pagamento",
    className: "bg-duo-yellow/20 text-duo-yellow",
  },
  expired: {
    label: "Expirado",
    className: "bg-duo-gray/20 text-duo-gray-dark",
  },
  canceled: {
    label: "Cancelado",
    className: "bg-red-500/20 text-red-400",
  },
};

export function FinancialAdsTab({
  campaigns = [],
  coupons = [],
  plans = [],
}: FinancialAdsTabProps) {
  const router = useRouter();
  const { toast } = useToast();

  // creation modal
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#E2FF38");
  const [linkedCouponId, setLinkedCouponId] = useState("");
  const [linkedPlanId, setLinkedPlanId] = useState("");
  const [durationHours, setDurationHours] = useState(MIN_HOURS);
  const [radiusKm, setRadiusKm] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalPrice = calcPrice(durationHours);

  const RADIUS_OPTIONS = [
    { value: 3, label: "3 km" },
    { value: 5, label: "5 km" },
    { value: 10, label: "10 km" },
    { value: 20, label: "20 km" },
    { value: 50, label: "50 km" },
  ];

  const incDuration = () => setDurationHours((h) => h + STEP_HOURS);
  const decDuration = () =>
    setDurationHours((h) => Math.max(MIN_HOURS, h - STEP_HOURS));

  // pix modal
  const [pixModal, setPixModal] = useState<PixModalState | null>(null);

  // actions
  const [payingId, setPayingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // filters
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredCampaigns =
    statusFilter === "all"
      ? campaigns
      : campaigns.filter((c) => c.status === statusFilter);

  const handleCreate = async () => {
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
        durationHours,
        amountCents: totalPrice * 100,
        radiusKm,
      });

      if (result.success && result.brCode) {
        setModalOpen(false);
        setPixModal({
          brCode: result.brCode,
          brCodeBase64: result.brCodeBase64 ?? "",
          amount: result.amount ?? totalPrice * 100,
          campaignId: result.campaignId ?? "",
          campaignTitle: title,
          expiresAt: result.expiresAt,
        });
        setTitle("");
        setDescription("");
        setPrimaryColor("#E2FF38");
        setDurationHours(12);
        setRadiusKm(5);
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "error" in result ? result.error : "Erro ao criar campanha",
        });
        setIsSubmitting(false);
      }
    } catch {
      toast({ variant: "destructive", title: "Erro ao criar campanha." });
      setIsSubmitting(false);
    }
  };

  const handlePayCampaign = async (campaign: BoostCampaign) => {
    setPayingId(campaign.id);
    try {
      const result = await getBoostCampaignPix(campaign.id);
      if (result.success) {
        setPixModal({
          brCode: result.brCode,
          brCodeBase64: result.brCodeBase64,
          amount: result.amount,
          campaignId: campaign.id,
          campaignTitle: campaign.title,
          expiresAt: result.expiresAt,
        });
      } else {
        toast({ variant: "destructive", title: result.error });
      }
    } catch {
      toast({ variant: "destructive", title: "Erro ao gerar PIX." });
    } finally {
      setPayingId(null);
    }
  };

  const handleDelete = async (campaignId: string) => {
    setDeletingId(campaignId);
    try {
      const result = await deleteBoostCampaign(campaignId);
      if (result.success) {
        toast({ title: "Campanha cancelada." });
        setConfirmDeleteId(null);
        router.refresh();
      } else {
        toast({ variant: "destructive", title: result.error });
      }
    } catch {
      toast({ variant: "destructive", title: "Erro ao cancelar campanha." });
    } finally {
      setDeletingId(null);
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
            <h2 className="font-bold text-duo-fg">Anúncios</h2>
          </div>
          <DuoButton size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Novo anúncio
          </DuoButton>
        </DuoCard.Header>

        <div className="space-y-4">
          {/* Info banner */}
          <DuoCard.Root className="border-duo-secondary/30 bg-duo-secondary/5">
            <div className="p-3 text-sm text-duo-text">
              <span className="font-bold flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-duo-secondary" />
                Destaque sua academia
              </span>
              Seu anúncio aparecerá com prioridade para todos os alunos da
              região. A partir de{" "}
              <strong className="text-duo-text">
                R$ {PRICE_PER_12H.toFixed(2)}
              </strong>{" "}
              por 12 horas.
            </div>
          </DuoCard.Root>

          {/* Filtros */}
          {campaigns.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all border-2 ${
                    statusFilter === f.value
                      ? "border-duo-primary bg-duo-primary/10 text-duo-primary"
                      : "border-duo-border text-duo-gray-dark hover:border-duo-primary/40"
                  }`}
                >
                  {f.label}
                  {f.value !== "all" && (
                    <span className="ml-1 opacity-60">
                      ({campaigns.filter((c) => c.status === f.value).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {filteredCampaigns.length === 0 && (
            <p className="py-8 text-center text-sm text-duo-gray-dark border-2 border-dashed border-duo-border rounded-xl">
              {statusFilter === "all"
                ? "Você ainda não tem campanhas. Crie um anúncio para impulsionar suas assinaturas."
                : `Nenhuma campanha com status "${STATUS_FILTERS.find((f) => f.value === statusFilter)?.label}".`}
            </p>
          )}

          {filteredCampaigns.map((campaign) => {
            const badge = STATUS_BADGE[campaign.status] ?? {
              label: campaign.status,
              className: "bg-duo-gray/20 text-duo-gray-dark",
            };

            return (
              <DuoCard.Root
                key={campaign.id}
                className="border-2 border-duo-border"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base text-duo-text flex items-center gap-2">
                      <div
                        className="w-3 h-3 shrink-0 rounded-full"
                        style={{ backgroundColor: campaign.primaryColor }}
                      />
                      <span className="truncate">{campaign.title}</span>
                    </h3>
                    <p className="text-xs text-duo-gray-dark mt-0.5 line-clamp-1">
                      {campaign.description}
                    </p>
                    <div className="text-sm text-duo-gray-dark mt-1.5 flex gap-3">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> {campaign.impressions}
                      </span>
                      <span className="flex items-center gap-1">
                        <MousePointerClick className="w-3.5 h-3.5" />{" "}
                        {campaign.clicks}
                      </span>
                      <span className="text-xs opacity-60">
                        {campaign.durationHours}h
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 ml-2 shrink-0">
                    <span
                      className={`px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                    {/* Botão de cancelar */}
                    {campaign.status !== "canceled" && (
                      <button
                        onClick={() => setConfirmDeleteId(campaign.id)}
                        className="p-1 rounded-lg text-duo-gray-dark hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        title="Cancelar campanha"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Confirm delete inline */}
                {confirmDeleteId === campaign.id && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl mb-2 space-y-3">
                    <p className="text-sm font-bold text-duo-text">
                      Excluir o anúncio &ldquo;{campaign.title}&rdquo;?
                    </p>
                    <p className="text-xs text-duo-gray-dark">
                      Esta ação é irreversível.
                    </p>
                    <div className="flex gap-2">
                      <DuoButton
                        size="sm"
                        variant="ghost"
                        className="flex-1"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        Manter
                      </DuoButton>
                      <DuoButton
                        size="sm"
                        variant="danger"
                        className="flex-1"
                        disabled={deletingId === campaign.id}
                        onClick={() => handleDelete(campaign.id)}
                      >
                        {deletingId === campaign.id
                          ? "Excluindo..."
                          : "Excluir"}
                      </DuoButton>
                    </div>
                  </div>
                )}

                {campaign.status === "pending_payment" && (
                  <DuoButton
                    size="sm"
                    className="w-full"
                    disabled={payingId === campaign.id}
                    onClick={() => handlePayCampaign(campaign)}
                  >
                    {payingId === campaign.id
                      ? "Gerando PIX..."
                      : "Pagar agora"}
                  </DuoButton>
                )}
              </DuoCard.Root>
            );
          })}
        </div>
      </DuoCard.Root>

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-60 flex items-end justify-center bg-black/50 sm:items-center"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-2xl rounded-t-3xl bg-duo-bg-card sm:rounded-3xl"
              onClick={(e) => e.stopPropagation()}
              style={{
                maxHeight: "90vh",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="border-b-2 border-duo-border p-6 shrink-0"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-duo-text">
                    Criar Anúncio
                  </h2>
                  <DuoButton
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setModalOpen(false)}
                    className="h-10 w-10 rounded-full"
                  >
                    ✕
                  </DuoButton>
                </div>
              </motion.div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Preview */}
                <div>
                  <p className="text-sm font-bold text-duo-fg-muted mb-2">
                    Preview do anúncio
                  </p>
                  <div
                    className="border-2 rounded-xl p-4 overflow-hidden relative"
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
                        "Mostre por que os alunos devem escolher a sua academia..."}
                    </p>
                    <div className="mt-4 pt-3 border-t border-duo-border flex justify-between items-center">
                      <div className="text-xs text-duo-gray-dark font-medium">
                        {linkedCouponId ? "Cupom vinculado" : "Sem cupom"} •{" "}
                        {linkedPlanId
                          ? "Plano vinculado"
                          : "Perfil da academia"}
                      </div>
                      <button
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-duo-bg"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Assinar Agora
                      </button>
                    </div>
                  </div>
                </div>

                {/* Campos */}
                <div className="space-y-4">
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
                      Cor Primária
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
                    <label className="text-sm font-bold text-duo-text mb-2 block">
                      Duração do Anúncio
                    </label>
                    <div className="flex items-center justify-between bg-duo-bg border-2 border-duo-border rounded-xl px-4 py-3">
                      <button
                        onClick={decDuration}
                        disabled={durationHours <= MIN_HOURS}
                        className="w-9 h-9 flex items-center justify-center rounded-full border-2 border-duo-border text-xl font-bold text-duo-text transition-all hover:border-duo-primary hover:text-duo-primary disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        −
                      </button>
                      <div className="text-center">
                        <p className="font-bold text-lg text-duo-text">
                          {formatDuration(durationHours)}
                        </p>
                        <p className="text-xs text-duo-gray-dark">
                          R$ {totalPrice.toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={incDuration}
                        className="w-9 h-9 flex items-center justify-center rounded-full border-2 border-duo-border text-xl font-bold text-duo-text transition-all hover:border-duo-primary hover:text-duo-primary"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-xs text-duo-gray-dark mt-1 text-center">
                      R$ {PRICE_PER_STEP.toFixed(2)} por cada 12h
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-duo-text mb-2 block flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Alcance (raio)
                    </label>
                    <DuoSelect.Simple
                      value={String(radiusKm)}
                      onChange={(val) => setRadiusKm(Number(val))}
                      options={RADIUS_OPTIONS.map((o) => ({
                        value: String(o.value),
                        label: o.label,
                      }))}
                      placeholder="Raio em km"
                    />
                    <p className="text-xs text-duo-gray-dark mt-1">
                      Alunos dentro deste raio da sua academia verão o anúncio na home.
                    </p>
                  </div>

                  <DuoSelect.Simple
                    label="Cupom Vinculado (Opcional)"
                    value={linkedCouponId}
                    onChange={(val) => setLinkedCouponId(val)}
                    options={[
                      { value: "", label: "Nenhum cupom" },
                      ...coupons.map((c) => ({
                        value: c.id,
                        label: `${c.code} (${c.type === "percentage" ? `${c.value}%` : `R$ ${c.value}`})`,
                      })),
                    ]}
                  />

                  <DuoSelect.Simple
                    label="Plano Vinculado (Opcional)"
                    value={linkedPlanId}
                    onChange={(val) => setLinkedPlanId(val)}
                    options={[
                      { value: "", label: "Levar para o perfil da academia" },
                      ...plans.map((p) => ({ value: p.id, label: p.name })),
                    ]}
                  />
                </div>
              </div>

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.3 }}
                className="shrink-0 border-t-2 border-duo-border p-6 space-y-4"
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm text-duo-gray-dark">
                    {formatDuration(durationHours)}
                  </span>
                  <span className="font-bold text-duo-text text-xl">
                    R$ {totalPrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex gap-3">
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
                    {isSubmitting ? "Processando..." : `Gerar PIX `}
                  </DuoButton>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal PIX */}
      {pixModal && (
        <PixQrModal
          isOpen={!!pixModal}
          onClose={() => {
            setPixModal(null);
            router.refresh();
          }}
          onCancelPayment={async () => {
            await deleteBoostCampaign(pixModal.campaignId);
          }}
          title="Pagar Anúncio"
          brCode={pixModal.brCode}
          brCodeBase64={pixModal.brCodeBase64}
          amount={pixModal.amount}
          expiresAt={pixModal.expiresAt}
          simulatePixUrl={`/api/gym/boost-campaigns/${pixModal.campaignId}/simulate-pix`}
          onSimulateSuccess={async () => {
            router.refresh();
          }}
          pollConfig={{
            type: "check",
            check: async () => {
              const res = await apiClient.get<{ status: string }>(
                `/api/gym/boost-campaigns/${pixModal.campaignId}`,
              );
              return res.data.status === "active";
            },
          }}
          onPaymentConfirmed={() => {
            setPixModal(null);
            router.refresh();
          }}
          paymentConfirmedToast={{
            title: "Campanha ativada!",
            description: "Pagamento confirmado.",
          }}
        />
      )}
    </>
  );
}
