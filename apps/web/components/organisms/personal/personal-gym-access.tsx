"use client";

import type { AccessEventFeedItem } from "@gymrats/types";
import { DoorClosed, DoorOpen, Radio, RefreshCw, Users } from "lucide-react";
import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import {
  DuoAlert,
  DuoButton,
  DuoCard,
  DuoInput,
  DuoStatCard,
  DuoStatsGrid,
  DuoTabs,
} from "@/components/duo";
import { ScreenShell } from "@/components/foundations";
import { DashboardSection } from "@/components/organisms/shared";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { usePersonalAccessStore } from "@/stores/personal-access-store";

type PersonalAccessSection = "overview" | "manual" | "events";

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function StatusPill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning";
}) {
  const className =
    tone === "success"
      ? "border-duo-green bg-duo-green/10 text-duo-green"
      : tone === "warning"
        ? "border-duo-yellow bg-duo-yellow/10 text-duo-yellow"
        : "border-duo-border bg-duo-bg-elevated text-duo-gray-dark";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider",
        className,
      )}
    >
      {children}
    </span>
  );
}

function formatDateTime(value: Date | null | undefined) {
  return value ? dateTimeFormatter.format(value) : "Sem registro";
}

function StudentActionCard({
  name,
  onEntry,
  onExit,
}: {
  name: string;
  onEntry: () => void;
  onExit: () => void;
}) {
  return (
    <DuoCard.Root variant="default" padding="sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--duo-bg-elevated)] text-sm font-bold text-[var(--duo-primary)]">
            {getInitials(name) || "?"}
          </div>
          <p className="truncate font-bold text-duo-text">{name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <DuoButton size="sm" onClick={onEntry}>
            <DoorOpen className="h-3.5 w-3.5" aria-hidden="true" />
            Registrar Entrada
          </DuoButton>
          <DuoButton size="sm" variant="outline" onClick={onExit}>
            <DoorClosed className="h-3.5 w-3.5" aria-hidden="true" />
            Registrar Saída
          </DuoButton>
        </div>
      </div>
    </DuoCard.Root>
  );
}

function getEventTone(event: AccessEventFeedItem) {
  if (event.recordType === "authorization") {
    return event.authorizationOutcome === "allowed"
      ? "success"
      : event.authorizationOutcome === "denied"
        ? "warning"
        : "neutral";
  }

  return event.directionResolved === "entry"
    ? "success"
    : event.directionResolved === "exit"
      ? "warning"
      : "neutral";
}

export function PersonalGymAccessPage({
  gymId,
  onBack,
  returnHref = `/personal?tab=gyms&gymId=${gymId}&gymView=profile`,
}: {
  gymId: string;
  onBack?: () => void;
  returnHref?: string;
}) {
  const [accessTab, setAccessTab] = useQueryState(
    "accessTab",
    parseAsString.withDefault("overview"),
  );
  const { overview, feed, students, isLoading, isMutating, error, loadAll, createManualEvent } =
    usePersonalAccessStore();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [reason, setReason] = useState("");
  const deferredQuery = useDeferredValue(query);

  const activeSection = useMemo<PersonalAccessSection>(() => {
    return accessTab === "manual" || accessTab === "events" ? accessTab : "overview";
  }, [accessTab]);

  const visibleStudents = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return students;
    }
    return students.filter((student) =>
      student.name.toLowerCase().includes(normalizedQuery),
    );
  }, [deferredQuery, students]);

  useEffect(() => {
    void loadAll(gymId);
  }, [gymId, loadAll]);

  const handleManualEvent = async (
    studentId: string,
    direction: "entry" | "exit",
  ) => {
    try {
      await createManualEvent({
        subjectType: "STUDENT",
        subjectId: studentId,
        direction,
        reason: reason || undefined,
      });
      toast({
        title: direction === "entry" ? "Entrada registrada" : "Saída registrada",
        description: "A presença do aluno foi atualizada nesta academia.",
      });
      setReason("");
    } catch (manualError) {
      toast({
        variant: "destructive",
        title: "Falha ao registrar presença",
        description:
          manualError instanceof Error ? manualError.message : "Tente novamente",
      });
    }
  };

  return (
    <ScreenShell.Root screenId="personal-gym-access-page">
      <FadeIn>
        <ScreenShell.Notice>
          {error ? (
            <DuoAlert variant="danger" title="Falha ao carregar catracas">
              {error}
            </DuoAlert>
          ) : null}

          <ScreenShell.Header>
            <ScreenShell.Heading>
              <ScreenShell.Title>Catracas</ScreenShell.Title>
              <ScreenShell.Description>
                Contexto operacional da academia para acompanhar presença e agir
                manualmente sobre alunos vinculados.
              </ScreenShell.Description>
            </ScreenShell.Heading>
            <ScreenShell.Actions className="flex items-center gap-2">
              {onBack ? (
                <DuoButton variant="outline" onClick={onBack}>
                  Voltar ao Perfil
                </DuoButton>
              ) : (
                <DuoButton asChild variant="outline">
                  <Link href={returnHref}>Voltar ao Perfil</Link>
                </DuoButton>
              )}
              <DuoButton
                variant="primary"
                className="gap-2"
                loading={isLoading || isMutating}
                onClick={() => void loadAll(gymId)}
              >
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </DuoButton>
            </ScreenShell.Actions>
          </ScreenShell.Header>
        </ScreenShell.Notice>
      </FadeIn>

      <ScreenShell.Body>
        <SlideIn delay={0.1}>
          <DuoStatsGrid.Root columns={4}>
            <DuoStatCard.Simple
              icon={Users}
              value={String(overview?.occupancyNow ?? 0)}
              label="Ocupação Agora"
              badge={`${overview?.activeStudents ?? 0} alunos`}
              iconColor="var(--duo-primary)"
            />
            <DuoStatCard.Simple
              icon={Users}
              value={String(overview?.entriesToday ?? 0)}
              label="Entradas Hoje"
              badge={`${overview?.unresolvedEvents ?? 0} pendências`}
              iconColor="var(--duo-secondary)"
            />
            <DuoStatCard.Simple
              icon={Radio}
              value={String(overview?.allowedToday ?? 0)}
              label="Liberados Hoje"
              badge={`${overview?.deniedToday ?? 0} negados`}
              iconColor="var(--duo-primary)"
            />
            <DuoStatCard.Simple
              icon={Users}
              value={String(overview?.graceStudents ?? 0)}
              label="Na Graça"
              badge={`${overview?.blockedStudents ?? 0} bloqueados`}
              iconColor="var(--duo-secondary)"
            />
          </DuoStatsGrid.Root>
        </SlideIn>

        <SlideIn delay={0.15}>
          <DuoCard.Root variant="default" padding="md">
            <DuoTabs.Root
              value={activeSection}
              onValueChange={(value) => void setAccessTab(value)}
              variant="button"
            >
              <DuoTabs.List className="grid gap-3 md:grid-cols-3">
                {[
                  {
                    id: "overview",
                    label: "Visão Geral",
                    description: "ocupação e saúde do contexto",
                  },
                  {
                    id: "manual",
                    label: "Manual",
                    description: "entrada e saída de alunos",
                  },
                  {
                    id: "events",
                    label: "Eventos",
                    description: "feed recente da academia",
                  },
                ].map((item) => (
                  <DuoTabs.Trigger
                    key={item.id}
                    value={item.id}
                    className="justify-start rounded-2xl px-4 py-3 text-left normal-case tracking-normal"
                  >
                    <span className="min-w-0">
                      <span className="block font-bold text-duo-text">{item.label}</span>
                      <span className="block text-xs text-duo-gray-dark">
                        {item.description}
                      </span>
                    </span>
                  </DuoTabs.Trigger>
                ))}
              </DuoTabs.List>
            </DuoTabs.Root>
          </DuoCard.Root>
        </SlideIn>

        {activeSection === "overview" && (
          <SlideIn delay={0.2}>
            <DashboardSection.Root
              title="Leitura Operacional"
              description="Resumo do contexto atual da academia."
              icon={<Users className="h-5 w-5 text-[var(--duo-primary)]" aria-hidden="true" />}
            >
              <div className="grid gap-3 md:grid-cols-3">
                <DuoCard.Root variant="default" padding="sm">
                  <p className="font-bold text-duo-text">Alunos Dentro</p>
                  <p className="text-2xl font-extrabold text-duo-text">
                    {overview?.activeStudents ?? 0}
                  </p>
                </DuoCard.Root>
                <DuoCard.Root variant="default" padding="sm">
                  <p className="font-bold text-duo-text">Entradas Hoje</p>
                  <p className="text-2xl font-extrabold text-duo-text">
                    {overview?.entriesToday ?? 0}
                  </p>
                </DuoCard.Root>
                <DuoCard.Root variant="default" padding="sm">
                  <p className="font-bold text-duo-text">Pendências</p>
                  <p className="text-2xl font-extrabold text-duo-text">
                    {overview?.unresolvedEvents ?? 0}
                  </p>
                </DuoCard.Root>
              </div>
            </DashboardSection.Root>
          </SlideIn>
        )}

        {activeSection === "manual" && (
          <SlideIn delay={0.2}>
            <div className="space-y-6">
              <DuoAlert variant="info" title="Operação manual autorizada">
                O personal pode registrar entrada e saída apenas dos alunos
                vinculados a ele dentro desta academia.
              </DuoAlert>

              <DashboardSection.Root
                title="Registrar Passagem"
                description="Busque um aluno vinculado e aplique a ação manual."
                icon={<Users className="h-5 w-5 text-[var(--duo-primary)]" aria-hidden="true" />}
              >
                <DashboardSection.List>
                  <div className="grid gap-3 md:grid-cols-2">
                    <DuoInput.Simple
                      label="Buscar aluno"
                      name="personal-access-student-query"
                      placeholder="Buscar por nome…"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      autoComplete="off"
                    />
                    <DuoInput.Simple
                      label="Motivo operacional"
                      name="personal-access-reason"
                      placeholder="Ex.: conferência manual…"
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      autoComplete="off"
                    />
                  </div>

                  {visibleStudents.length === 0 ? (
                    <DashboardSection.Empty>
                      {query.trim()
                        ? "Nenhum aluno vinculado encontrado para este filtro."
                        : "Nenhum aluno vinculado disponível neste contexto."}
                    </DashboardSection.Empty>
                  ) : (
                    visibleStudents.map((student) => (
                      <StudentActionCard
                        key={student.id}
                        name={student.name}
                        onEntry={() => void handleManualEvent(student.id, "entry")}
                        onExit={() => void handleManualEvent(student.id, "exit")}
                      />
                    ))
                  )}
                </DashboardSection.List>
              </DashboardSection.Root>
            </div>
          </SlideIn>
        )}

        {activeSection === "events" && (
          <SlideIn delay={0.2}>
            <DashboardSection.Root
              title="Eventos Recentes"
              description="Feed recente da academia neste contexto."
              icon={<Radio className="h-5 w-5 text-[var(--duo-primary)]" aria-hidden="true" />}
            >
              <DashboardSection.List className="max-h-[36rem] overflow-y-auto pr-1">
                {feed.length === 0 ? (
                  <DashboardSection.Empty>
                    Nenhum evento recente nesta academia.
                  </DashboardSection.Empty>
                ) : (
                  feed.map((event) => (
                    <DuoCard.Root key={event.id} variant="default" padding="sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-bold text-duo-text">
                              {event.subjectName || event.identifierValue || "Evento sem match"}
                            </p>
                            <StatusPill tone={getEventTone(event)}>
                              {event.directionResolved === "entry"
                                ? "entrada"
                                : event.directionResolved === "exit"
                                  ? "saída"
                                  : "sem direção"}
                            </StatusPill>
                          </div>
                          <p className="mt-1 text-xs text-duo-gray-dark">
                            {event.status} • {formatDateTime(event.occurredAt)}
                          </p>
                        </div>
                      </div>
                    </DuoCard.Root>
                  ))
                )}
              </DashboardSection.List>
            </DashboardSection.Root>
          </SlideIn>
        )}
      </ScreenShell.Body>
    </ScreenShell.Root>
  );
}
