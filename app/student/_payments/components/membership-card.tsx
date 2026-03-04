"use client";

import { CreditCard, RefreshCw, Trash2 } from "lucide-react";
import { DuoButton, DuoCard } from "@/components/duo";
import type { StudentGymMembership } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface MembershipCardProps {
  membership: StudentGymMembership;
  isExpanded: boolean;
  readOnly?: boolean;
  isChangePlanSelecting: boolean;
  changePlanPlans: Array<{
    id: string;
    name: string;
    type: string;
    price: number;
    duration: number;
  }>;
  onToggleExpand: () => void;
  onTrocarPlano: () => void;
  onSelectChangePlan: (planId: string) => void;
  onCancelChangePlan: () => void;
  onCancelMembership: () => void;
}

export function MembershipCard({
  membership,
  isExpanded,
  readOnly = false,
  isChangePlanSelecting,
  changePlanPlans,
  onToggleExpand,
  onTrocarPlano,
  onSelectChangePlan,
  onCancelChangePlan,
  onCancelMembership,
}: MembershipCardProps) {
  const isActive = membership.status === "active";

  return (
    <DuoCard.Root
      variant="default"
      size="default"
      className={cn(
        "transition-all",
        !readOnly && "cursor-pointer",
        isExpanded && "border-duo-blue ring-2 ring-duo-blue/20",
      )}
      onClick={onToggleExpand}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-duo-gray-dark mt-0.5 line-clamp-2 wrap-break-word">
              {membership.gymAddress}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "px-2 py-1 rounded-lg text-xs font-bold shrink-0",
                  membership.status === "active" &&
                    "bg-duo-green/20 text-duo-green",
                  membership.status === "suspended" &&
                    "bg-duo-orange/20 text-duo-orange",
                  membership.status === "canceled" &&
                    "bg-duo-red/20 text-duo-red",
                  membership.status === "pending" &&
                    "bg-duo-yellow/20 text-duo-yellow",
                )}
              >
                {membership.status === "active" && "Ativo"}
                {membership.status === "suspended" && "Suspenso"}
                {membership.status === "canceled" && "Cancelado"}
                {membership.status === "pending" && "Pendente"}
              </span>
              {membership.autoRenew && (
                <span className="px-2 py-1 bg-duo-blue/20 text-duo-blue rounded-lg text-xs font-bold shrink-0">
                  Renovação automática
                </span>
              )}
            </div>

            <div className="mt-3 pt-3 border-t-2 border-duo-border flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs text-duo-gray-dark">
                  {membership.planName}
                </p>
                <p className="text-lg font-bold text-duo-green mt-0.5">
                  R$ {membership.amount.toFixed(2)}/mês
                </p>
              </div>
              <div className="min-w-0 text-right">
                <p className="text-xs text-duo-gray-dark">Próxima cobrança</p>
                <p className="text-sm font-bold text-duo-text mt-0.5">
                  {membership.nextBillingDate
                    ? new Date(membership.nextBillingDate).toLocaleDateString(
                        "pt-BR",
                      )
                    : "N/A"}
                </p>
              </div>
            </div>

            {isExpanded && isActive && !readOnly && (
              <div
                className="mt-4 pt-4 border-t-2 border-duo-border space-y-3"
                onClick={(e) => e.stopPropagation()}
              >
                {isChangePlanSelecting ? (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-duo-gray-dark">
                      Selecione o novo plano:
                    </p>
                    {changePlanPlans.map((plan) => (
                      <DuoCard.Root
                        key={plan.id}
                        variant="default"
                        size="sm"
                        className="cursor-pointer hover:border-duo-blue"
                        onClick={() => onSelectChangePlan(plan.id)}
                      >
                        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-center min-w-0">
                          <span className="font-bold text-sm truncate">
                            {plan.name}
                          </span>
                          <span className="text-duo-green font-bold shrink-0">
                            R$ {plan.price.toFixed(2)}
                          </span>
                        </div>
                      </DuoCard.Root>
                    ))}
                    <DuoButton
                      variant="ghost"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={onCancelChangePlan}
                    >
                      Cancelar
                    </DuoButton>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
                    <DuoButton
                      variant="outline"
                      size="sm"
                      className="w-full sm:flex-1 justify-center"
                      onClick={onTrocarPlano}
                    >
                      <RefreshCw className="h-4 w-4 mr-1 shrink-0" />
                      Trocar plano
                    </DuoButton>
                    <DuoButton
                      variant="outline"
                      size="sm"
                      className="w-full sm:flex-1 justify-center border-duo-red text-duo-red hover:bg-duo-red/10"
                      onClick={onCancelMembership}
                    >
                      <Trash2 className="h-4 w-4 mr-1 shrink-0" />
                      Cancelar plano
                    </DuoButton>
                  </div>
                )}
              </div>
            )}

            {membership.paymentMethod && (
              <div className="mt-2 flex items-center gap-2 text-xs text-duo-gray-dark">
                <CreditCard className="h-4 w-4" />
                <span>
                  {membership.paymentMethod.brand} ••••{" "}
                  {membership.paymentMethod.last4}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </DuoCard.Root>
  );
}
