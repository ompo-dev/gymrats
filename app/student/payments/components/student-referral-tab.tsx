"use client";

import { Copy, DollarSign, Wallet, RefreshCw, Send, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { DuoCard, DuoStatCard, DuoStatsGrid, DuoButton } from "@/components/duo";
import { apiClient } from "@/lib/api/client";
import { useToast } from "@/hooks/use-toast";

interface ReferralData {
  referralCode: string;
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

export function StudentReferralTab() {
  const { toast } = useToast();
  const [data, setData] = useState<ReferralData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [pixKey, setPixKey] = useState("");
  const [pixKeyType, setPixKeyType] = useState("CPF");
  const [isUpdatingPix, setIsUpdatingPix] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get<ReferralData>("/api/students/referrals");
      setData(res.data);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar indicações",
        description: "Não foi possível carregar o histórico de indicações.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopyLink = () => {
    if (!data?.referralCode) return;
    const url = new URL(window.location.origin);
    url.searchParams.set("ref", data.referralCode.replace("@", ""));
    navigator.clipboard.writeText(url.toString());
    toast({
      title: "Link copiado!",
      description: "Compartilhe com seus amigos para ganhar comissões.",
    });
  };

  const handleUpdatePix = async () => {
    try {
      setIsUpdatingPix(true);
      await apiClient.post("/api/students/referrals/pix-key", { pixKey, pixKeyType });
      toast({
        title: "Chave PIX atualizada!",
        description: "Agora você pode realizar saques de suas comissões.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar a chave PIX.",
      });
    } finally {
      setIsUpdatingPix(false);
    }
  };

  const handleWithdraw = async () => {
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
        amountCents: Math.floor(amount * 100) 
      });
      toast({
        title: "Saque solicitado!",
        description: "O valor será transferido para sua chave PIX.",
      });
      setWithdrawAmount("");
      await loadData();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro ao sacar",
        description: err.response?.data?.error || "Verifique sua chave PIX ou saldo.",
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="flex justify-center p-8 text-duo-gray-dark">
        <RefreshCw className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DuoCard.Root variant="default" padding="md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--duo-fg)]">Seu Link de Indicação</h2>
            <p className="text-sm text-duo-gray-dark mt-1">
              Compartilhe este link. Você ganha <strong className="text-duo-accent">50% de comissão</strong> na primeira mensalidade do indicado!
            </p>
          </div>
          
          <DuoButton onClick={handleCopyLink} variant="outline" className="shrink-0 gap-2">
            <Copy className="h-4 w-4" />
            Copiar Link
          </DuoButton>
        </div>
      </DuoCard.Root>

      <DuoStatsGrid.Root columns={2}>
        <DuoStatCard.Simple
          icon={Wallet}
          value={`R$ ${(data?.balanceReais || 0).toFixed(2)}`}
          label="Saldo Disponível"
          iconColor="var(--duo-primary)"
        />
        <DuoStatCard.Simple
          icon={DollarSign}
          value={`R$ ${((data?.totalEarnedCents || 0) / 100).toFixed(2)}`}
          label="Total Ganho Histórico"
          iconColor="var(--duo-success)"
        />
      </DuoStatsGrid.Root>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DuoCard.Root variant="default" padding="md">
            <h3 className="font-bold text-lg text-[var(--duo-fg)] border-b border-duo-border pb-2 mb-4">
              Configurar Recebimento (PIX)
            </h3>
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-duo-gray-dark">Tipo de Chave PIX</span>
                <select 
                  className="mt-1 block w-full rounded-xl border border-duo-border bg-duo-bg p-2 focus:border-duo-blue focus:outline-none focus:ring-1 focus:ring-duo-blue transition-all"
                  value={pixKeyType}
                  onChange={(e) => setPixKeyType(e.target.value)}
                >
                  <option value="CPF">CPF</option>
                  <option value="EMAIL">E-mail</option>
                  <option value="PHONE">Celular</option>
                  <option value="RANDOM">Chave Aleatória</option>
                  <option value="CNPJ">CNPJ</option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-duo-gray-dark">Sua Chave PIX</span>
                <input 
                  type="text"
                  className="mt-1 block w-full rounded-xl border border-duo-border bg-duo-bg p-2 focus:border-duo-blue focus:outline-none focus:ring-1 focus:ring-duo-blue transition-all"
                  value={pixKey}
                  placeholder="Ex: 123.456.789-00"
                  onChange={(e) => setPixKey(e.target.value)}
                />
              </label>

              <DuoButton 
                onClick={handleUpdatePix} 
                disabled={isUpdatingPix || !pixKey} 
                className="w-full mt-2"
                variant="primary"
              >
                Salvar PIX
              </DuoButton>
            </div>
        </DuoCard.Root>

        <DuoCard.Root variant="default" padding="md">
            <h3 className="font-bold text-lg text-[var(--duo-fg)] border-b border-duo-border pb-2 mb-4">
              Solicitar Saque
            </h3>
            <div className="space-y-4">
              <p className="text-sm text-duo-gray-dark">
               As transferências PIX são processadas imediatamente via AbacatePay (Taxa fixa de R$ 0,80 descontada).
              </p>

              <label className="block">
                <span className="text-sm font-medium text-duo-gray-dark">Valor do Saque (R$)</span>
                <input 
                  type="number"
                  step="0.01"
                  min="3.50"
                  className="mt-1 block w-full rounded-xl border border-duo-border bg-duo-bg p-2 focus:border-duo-blue focus:outline-none focus:ring-1 focus:ring-duo-blue transition-all"
                  value={withdrawAmount}
                  placeholder="Mín. 3.50"
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                />
              </label>

              <DuoButton 
                onClick={handleWithdraw} 
                disabled={isWithdrawing || !withdrawAmount || parseFloat(withdrawAmount) < 3.5 || parseFloat(withdrawAmount) > (data?.balanceReais || 0)} 
                className="w-full gap-2"
                variant="secondary"
              >
                <Send className="w-4 h-4" />
                {isWithdrawing ? "Processando..." : "Sacar agora"}
              </DuoButton>
            </div>
        </DuoCard.Root>
      </div>

      <DuoCard.Root variant="default" padding="md">
          <h3 className="font-bold text-lg text-[var(--duo-fg)] border-b border-duo-border pb-2 mb-4">
            Histórico de Saques
          </h3>
          {(data?.withdraws?.length || 0) === 0 ? (
            <div className="text-center py-6 text-duo-gray-dark text-sm">
              Você ainda não realizou nenhum saque.
            </div>
          ) : (
            <div className="space-y-3">
              {data!.withdraws.map(w => (
                <div key={w.id} className="flex justify-between items-center bg-duo-bg-dark rounded-xl p-3 border border-duo-border">
                  <div>
                    <div className="font-bold text-sm text-[var(--duo-fg)]">Saque R$ {w.amount.toFixed(2)}</div>
                    <div className="text-xs text-duo-gray-dark mt-0.5">
                      {new Date(w.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {w.status === "complete" ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-duo-success">
                        <CheckCircle className="w-3 h-3" /> Pago
                      </span>
                    ) : w.status === "failed" ? (
                      <span className="text-xs font-medium text-duo-destructive">Falhou</span>
                    ) : (
                      <span className="text-xs font-medium text-duo-accent">Processando</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
      </DuoCard.Root>

    </div>
  );
}
