"use client";

import {
  Copy,
  DollarSign,
  Wallet,
  RefreshCw,
  Send,
  CheckCircle,
} from "lucide-react";
import {
  DuoCard,
  DuoStatCard,
  DuoStatsGrid,
  DuoButton,
  DuoInput,
  DuoSelect,
} from "@/components/duo";
import type { ReferralData } from "../hooks/use-student-referral";
import { useStudentReferral } from "../hooks/use-student-referral";

interface ReferralLinkSectionProps {
  refSlug: string;
  getReferralLink: () => string;
  copyLink: () => void;
  copied: boolean;
}

function ReferralLinkSection({
  refSlug,
  getReferralLink,
  copyLink,
  copied,
}: ReferralLinkSectionProps) {
  return (
    <DuoCard.Root variant="default" padding="md">
      <h2 className="text-xl font-bold text-duo-fg mb-1">Seu código de indicação</h2>
      <p className="text-sm text-duo-gray-dark mb-4">
        Compartilhe seu código <strong>@</strong> com amigos ou academias.
        Quando alguém usar seu código no momento do pagamento da primeira
        assinatura (no modal PIX), você ganha{" "}
        <strong className="text-duo-accent">50% de comissão</strong> e quem
        pagou ganha <strong>5% de desconto</strong>.
      </p>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 rounded-xl border border-duo-border bg-duo-bg p-3">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-duo-fg">
            {refSlug ? `@${refSlug}` : "Carregando..."}
          </div>
          <div className="text-xs text-duo-gray-dark font-mono mt-0.5">
            {refSlug ? getReferralLink() : ""}
          </div>
        </div>
        <DuoButton
          onClick={copyLink}
          variant={copied ? "secondary" : "primary"}
          className="shrink-0 gap-1.5 transition-all"
          disabled={!refSlug}
        >
          {copied ? (
            <>
              <CheckCircle className="h-4 w-4" /> Copiado!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" /> Copiar Link
            </>
          )}
        </DuoButton>
      </div>
    </DuoCard.Root>
  );
}

interface ReferralStatsSectionProps {
  data: ReferralData | null;
}

function ReferralStatsSection({ data }: ReferralStatsSectionProps) {
  return (
    <DuoStatsGrid.Root columns={2}>
      <DuoStatCard.Simple
        icon={Wallet}
        value={`R$ ${(data?.balanceReais ?? 0).toFixed(2)}`}
        label="Saldo Disponível"
        iconColor="var(--duo-primary)"
      />
      <DuoStatCard.Simple
        icon={DollarSign}
        value={`R$ ${((data?.totalEarnedCents ?? 0) / 100).toFixed(2)}`}
        label="Total Ganho Histórico"
        iconColor="var(--duo-success)"
      />
    </DuoStatsGrid.Root>
  );
}

interface PixKeyConfigSectionProps {
  pixKey: string;
  setPixKey: (v: string) => void;
  pixKeyType: string;
  setPixKeyType: (v: string) => void;
  isUpdatingPix: boolean;
  onUpdatePix: () => void;
}

function PixKeyConfigSection({
  pixKey,
  setPixKey,
  pixKeyType,
  setPixKeyType,
  isUpdatingPix,
  onUpdatePix,
}: PixKeyConfigSectionProps) {
  return (
    <DuoCard.Root variant="default" padding="md">
      <h3 className="font-bold text-lg text-duo-fg border-b border-duo-border pb-2 mb-4">
        Configurar Recebimento (PIX)
      </h3>
      <div className="space-y-3">
        <DuoSelect.Simple
          label="Tipo de Chave PIX"
          options={[
            { value: "CPF", label: "CPF" },
            { value: "EMAIL", label: "E-mail" },
            { value: "PHONE", label: "Celular" },
            { value: "RANDOM", label: "Chave Aleatória" },
            { value: "CNPJ", label: "CNPJ" },
          ]}
          value={pixKeyType}
          onChange={(v) => setPixKeyType(v)}
          placeholder="Selecione..."
        />

        <DuoInput.Simple
          label="Sua Chave PIX"
          value={pixKey}
          onChange={(e) => setPixKey(e.target.value)}
          placeholder="Ex: 123.456.789-00"
        />

        <DuoButton
          onClick={onUpdatePix}
          disabled={isUpdatingPix || !pixKey}
          className="w-full mt-2"
          variant="primary"
        >
          Salvar PIX
        </DuoButton>
      </div>
    </DuoCard.Root>
  );
}

interface WithdrawSectionProps {
  data: ReferralData | null;
  withdrawAmount: string;
  setWithdrawAmount: (v: string) => void;
  isWithdrawing: boolean;
  onWithdraw: () => void;
}

function WithdrawSection({
  data,
  withdrawAmount,
  setWithdrawAmount,
  isWithdrawing,
  onWithdraw,
}: WithdrawSectionProps) {
  const balance = data?.balanceReais ?? 0;
  const amountNum = parseFloat(withdrawAmount);
  const isValid =
    !isNaN(amountNum) &&
    amountNum >= 3.5 &&
    amountNum <= balance;

  return (
    <DuoCard.Root variant="default" padding="md">
      <h3 className="font-bold text-lg text-duo-fg border-b border-duo-border pb-2 mb-4">
        Solicitar Saque
      </h3>
      <div className="space-y-4">
        <p className="text-sm text-duo-gray-dark">
          As transferências PIX são processadas imediatamente via AbacatePay
          (Taxa fixa de R$ 0,80 descontada).
        </p>

        <DuoInput.Simple
          label="Valor do Saque (R$)"
          type="number"
          step={0.01}
          min={3.5}
          value={withdrawAmount}
          placeholder="Mín. 3.50"
          onChange={(e) => setWithdrawAmount(e.target.value)}
        />

        <DuoButton
          onClick={onWithdraw}
          disabled={isWithdrawing || !withdrawAmount || !isValid}
          className="w-full gap-2"
          variant="secondary"
        >
          <Send className="w-4 h-4" />
          {isWithdrawing ? "Processando..." : "Sacar agora"}
        </DuoButton>
      </div>
    </DuoCard.Root>
  );
}

interface WithdrawHistorySectionProps {
  withdraws: ReferralData["withdraws"];
}

function WithdrawHistorySection({ withdraws }: WithdrawHistorySectionProps) {
  return (
    <DuoCard.Root variant="default" padding="md">
      <h3 className="font-bold text-lg text-duo-fg border-b border-duo-border pb-2 mb-4">
        Histórico de Saques
      </h3>
      {withdraws.length === 0 ? (
        <div className="text-center py-6 text-duo-gray-dark text-sm">
          Você ainda não realizou nenhum saque.
        </div>
      ) : (
        <div className="space-y-3">
          {withdraws.map((w) => (
            <div
              key={w.id}
              className="flex justify-between items-center bg-duo-bg-dark rounded-xl p-3 border border-duo-border"
            >
              <div>
                <div className="font-bold text-sm text-duo-fg">
                  Saque R$ {w.amount.toFixed(2)}
                </div>
                <div className="text-xs text-duo-gray-dark mt-0.5">
                  {new Date(w.createdAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {w.status === "complete" ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-duo-success">
                    <CheckCircle className="w-3 h-3" /> Pago
                  </span>
                ) : w.status === "failed" ? (
                  <span className="text-xs font-medium text-duo-destructive">
                    Falhou
                  </span>
                ) : (
                  <span className="text-xs font-medium text-duo-accent">
                    Processando
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DuoCard.Root>
  );
}

/** Tab de indicações do aluno: link, saldo, PIX e saques. */
export function StudentReferralTab() {
  const {
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
  } = useStudentReferral();

  if (isLoading && !data) {
    return (
      <div className="flex justify-center p-8 text-duo-gray-dark">
        <RefreshCw className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ReferralLinkSection
        refSlug={refSlug}
        getReferralLink={getReferralLink}
        copyLink={copyLink}
        copied={copied}
      />
      <ReferralStatsSection data={data} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PixKeyConfigSection
          pixKey={pixKey}
          setPixKey={setPixKey}
          pixKeyType={pixKeyType}
          setPixKeyType={setPixKeyType}
          isUpdatingPix={isUpdatingPix}
          onUpdatePix={handleUpdatePix}
        />
        <WithdrawSection
          data={data}
          withdrawAmount={withdrawAmount}
          setWithdrawAmount={setWithdrawAmount}
          isWithdrawing={isWithdrawing}
          onWithdraw={handleWithdraw}
        />
      </div>
      <WithdrawHistorySection withdraws={data?.withdraws ?? []} />
    </div>
  );
}
