"use client";

import type { AccessEventFeedItem } from "@gymrats/types";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRightLeft,
  Cpu,
  DoorClosed,
  DoorOpen,
  Fingerprint,
  Plus,
  Radio,
  RefreshCw,
  ShieldCheck,
  Users,
  UserSquare2,
  WifiOff,
} from "lucide-react";
import Image from "next/image";
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
  DuoSelect,
  DuoStatCard,
  DuoStatsGrid,
  DuoTabs,
} from "@/components/duo";
import { ScreenShell } from "@/components/foundations";
import { DashboardSection } from "@/components/organisms/shared";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useGymAccessStore } from "@/stores/gym-access-store";
import { useGymDirectoryStore } from "@/stores/gym-directory-store";

type PendingDraft = { subjectType: "STUDENT" | "PERSONAL"; subjectId: string };
type AccessSectionId = "overview" | "devices" | "events" | "manual" | "pending";

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const sectionItems: Array<{
  id: AccessSectionId;
  label: string;
  description: string;
  icon: typeof Activity;
}> = [
  {
    id: "overview",
    label: "Visão Geral",
    description: "ocupação, saúde e sinais do dia",
    icon: Activity,
  },
  {
    id: "devices",
    label: "Dispositivos",
    description: "cadastro, template e status",
    icon: Cpu,
  },
  {
    id: "events",
    label: "Eventos",
    description: "feed ao vivo do processamento",
    icon: Radio,
  },
  {
    id: "manual",
    label: "Manual",
    description: "contingência da recepção",
    icon: ArrowRightLeft,
  },
  {
    id: "pending",
    label: "Pendências",
    description: "conciliação e vínculos",
    icon: AlertTriangle,
  },
];

const selectOptions = {
  direction: [
    { value: "auto", label: "Automático", description: "alterna por sessão" },
    { value: "provider", label: "Fornecedor", description: "usa o payload" },
    { value: "entry", label: "Só entrada", description: "força entrada" },
    { value: "exit", label: "Só saída", description: "força saída" },
  ],
  transport: [
    { value: "webhook", label: "Webhook" },
    { value: "bridge", label: "Bridge" },
    { value: "manual", label: "Manual" },
  ],
  status: [
    { value: "active", label: "Ativo" },
    { value: "paused", label: "Pausado" },
    { value: "offline", label: "Offline" },
    { value: "error", label: "Erro" },
  ],
  subjectType: [
    { value: "STUDENT", label: "Aluno" },
    { value: "PERSONAL", label: "Personal" },
  ],
} as const;

const initialDeviceDraft = {
  name: "",
  vendorKey: "generic",
  adapterKey: "generic-webhook",
  hardwareType: "tripod",
  authModes: "rfid, facial",
  directionMode: "auto" as const,
  transport: "webhook" as const,
  status: "active" as const,
  dedupeWindowSeconds: "120",
  payloadTemplate: JSON.stringify(
    {
      eventIdPath: "event.id",
      occurredAtPath: "event.timestamp",
      identifierTypePath: "event.credential.type",
      identifierValuePath: "event.credential.value",
      directionPath: "event.direction",
      deviceIdPath: "device.id",
    },
    null,
    2,
  ),
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDateTime(value: Date | null | undefined) {
  return value ? dateTimeFormatter.format(value) : "Sem registro";
}

function IdentityAvatar({
  name,
  avatar,
}: {
  name: string;
  avatar?: string | null;
}) {
  if (avatar) {
    return (
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[var(--duo-border)]">
        <Image src={avatar} alt={name} fill className="object-cover" />
      </div>
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--duo-bg-elevated)] text-sm font-bold text-[var(--duo-primary)]">
      {getInitials(name) || "?"}
    </div>
  );
}

function StatusPill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  const className =
    tone === "success"
      ? "border-duo-green bg-duo-green/10 text-duo-green"
      : tone === "warning"
        ? "border-duo-yellow bg-duo-yellow/10 text-duo-yellow"
        : tone === "danger"
          ? "border-duo-red bg-duo-red/10 text-duo-red"
          : tone === "info"
            ? "border-duo-blue bg-duo-blue/10 text-duo-blue"
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

function PresenceItem({
  name,
  entryAt,
}: {
  name: string;
  entryAt: Date | null | undefined;
}) {
  return (
    <div className="rounded-2xl border border-[var(--duo-border)] bg-[var(--duo-bg-card)] px-3 py-3">
      <div className="flex items-start gap-3">
        <IdentityAvatar name={name} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-duo-text">{name}</p>
          <p className="text-xs text-duo-gray-dark">
            Entrada às {formatDateTime(entryAt)}
          </p>
        </div>
      </div>
    </div>
  );
}

function ManualSubjectCard({
  name,
  subtitle,
  avatar,
  onEntry,
  onExit,
}: {
  name: string;
  subtitle?: string;
  avatar?: string | null;
  onEntry: () => void;
  onExit: () => void;
}) {
  return (
    <DuoCard.Root variant="default" padding="sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <IdentityAvatar name={name} avatar={avatar} />
          <div className="min-w-0">
            <p className="truncate font-bold text-duo-text">{name}</p>
            {subtitle ? (
              <p className="truncate text-xs text-duo-gray-dark">{subtitle}</p>
            ) : null}
          </div>
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

function EventCard({ event }: { event: AccessEventFeedItem }) {
  const isAuthorization = event.recordType === "authorization";
  const directionTone =
    event.directionResolved === "entry"
      ? "success"
      : event.directionResolved === "exit"
        ? "warning"
        : "neutral";
  const statusTone =
    isAuthorization
      ? event.authorizationOutcome === "allowed"
        ? "success"
        : event.authorizationOutcome === "denied"
          ? "danger"
          : "warning"
      : event.status === "applied"
      ? "success"
      : event.status === "pending_match"
        ? "warning"
        : event.status === "anomalous"
          ? "danger"
          : "info";
  const directionLabel =
    event.directionResolved === "entry"
      ? "Entrada"
      : event.directionResolved === "exit"
        ? "Saída"
        : "Sem direção";
  const authorizationLabel =
    event.authorizationOutcome === "allowed"
      ? "Liberado"
      : event.authorizationOutcome === "denied"
        ? "Negado"
        : "Erro";
  const authorizationStatusLabel =
    event.authorizationStatus === "eligible"
      ? "Em dia"
      : event.authorizationStatus === "grace"
        ? "Na graça"
        : event.authorizationStatus === "blocked"
          ? "Bloqueado"
          : event.authorizationStatus === "inactive"
            ? "Inativo"
            : "Não avaliado";

  return (
    <DuoCard.Root variant="default" padding="sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-bold text-duo-text">
              {event.subjectName || event.identifierValue || "Evento sem match"}
            </p>
            <StatusPill tone={statusTone}>
              {isAuthorization ? authorizationLabel : event.status}
            </StatusPill>
            {isAuthorization ? (
              <StatusPill
                tone={
                  event.authorizationStatus === "blocked"
                    ? "danger"
                    : event.authorizationStatus === "grace"
                      ? "warning"
                      : "info"
                }
              >
                {authorizationStatusLabel}
              </StatusPill>
            ) : (
              <StatusPill tone={directionTone}>{directionLabel}</StatusPill>
            )}
          </div>
          <p className="mt-1 text-xs text-duo-gray-dark">
            {event.deviceName || event.vendorKey || "origem manual"} •{" "}
            {isAuthorization ? "autorização" : event.source} •{" "}
            {formatDateTime(event.occurredAt)}
          </p>
          {(event.reasonCode || event.financialStatus) && (
            <p className="mt-2 text-xs text-duo-gray-dark">
              {event.financialStatus
                ? `Financeiro: ${event.financialStatus}`
                : "Financeiro: não aplicável"}
              {event.reasonCode ? ` • Motivo: ${event.reasonCode}` : ""}
            </p>
          )}
        </div>
      </div>
    </DuoCard.Root>
  );
}

export function GymAccessPage() {
  const [accessTab, setAccessTab] = useQueryState(
    "accessTab",
    parseAsString.withDefault("overview"),
  );
  const {
    overview,
    feed,
    presence,
    devices,
    pending,
    bindings,
    isLoading,
    isMutating,
    error,
    loadAll,
    createDevice,
    updateDevice,
    createManualEvent,
    reconcileEvent,
  } = useGymAccessStore();
  const {
    activeMembers,
    linkedPersonalSearchResults,
    isSearchingActiveMembers,
    isSearchingLinkedPersonals,
    searchActiveMembers,
    clearActiveMembers,
    searchLinkedTeamPersonals,
  } = useGymDirectoryStore();
  const { toast } = useToast();
  const [studentQuery, setStudentQuery] = useState("");
  const [personalQuery, setPersonalQuery] = useState("");
  const [reason, setReason] = useState("");
  const [deviceDraft, setDeviceDraft] = useState(initialDeviceDraft);
  const [lastSetup, setLastSetup] = useState<{
    ingestionKey: string;
    secret: string;
  } | null>(null);
  const [pendingDrafts, setPendingDrafts] = useState<Record<string, PendingDraft>>(
    {},
  );
  const deferredStudentQuery = useDeferredValue(studentQuery);
  const deferredPersonalQuery = useDeferredValue(personalQuery);

  const activeSection = useMemo<AccessSectionId>(() => {
    if (sectionItems.some((item) => item.id === accessTab)) {
      return accessTab as AccessSectionId;
    }
    return "overview";
  }, [accessTab]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (deferredStudentQuery.trim().length < 2) {
      clearActiveMembers();
      return;
    }
    void searchActiveMembers(deferredStudentQuery);
  }, [clearActiveMembers, deferredStudentQuery, searchActiveMembers]);

  useEffect(() => {
    void searchLinkedTeamPersonals(deferredPersonalQuery);
  }, [deferredPersonalQuery, searchLinkedTeamPersonals]);

  const handleCreateDevice = async () => {
    try {
      const setup = await createDevice({
        name: deviceDraft.name,
        vendorKey: deviceDraft.vendorKey,
        adapterKey: deviceDraft.adapterKey,
        hardwareType: deviceDraft.hardwareType,
        authModes: deviceDraft.authModes
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        transport: deviceDraft.transport,
        status: deviceDraft.status,
        directionMode: deviceDraft.directionMode,
        dedupeWindowSeconds: Number(deviceDraft.dedupeWindowSeconds || 120),
        payloadTemplate: JSON.parse(deviceDraft.payloadTemplate),
      });
      setLastSetup(setup);
      setDeviceDraft(initialDeviceDraft);
      toast({
        title: "Dispositivo criado",
        description: "A integração já pode receber eventos.",
      });
    } catch (createError) {
      toast({
        variant: "destructive",
        title: "Falha ao criar dispositivo",
        description:
          createError instanceof Error
            ? createError.message
            : "Revise o template declarativo e os campos obrigatórios.",
      });
    }
  };

  const handleManualAction = async (
    subjectType: "STUDENT" | "PERSONAL",
    subjectId: string,
    direction: "entry" | "exit",
  ) => {
    try {
      await createManualEvent({
        subjectType,
        subjectId,
        direction,
        reason: reason || undefined,
      });
      toast({
        title: direction === "entry" ? "Entrada registrada" : "Saída registrada",
        description: "O feed e a ocupação já foram atualizados.",
      });
      setReason("");
    } catch (manualError) {
      toast({
        variant: "destructive",
        title: "Falha ao registrar presença",
        description:
          manualError instanceof Error
            ? manualError.message
            : "Tente novamente em alguns instantes.",
      });
    }
  };

  return (
    <ScreenShell.Root screenId="gym-access-page">
      <FadeIn>
        <ScreenShell.Notice>
          {error ? (
            <DuoAlert variant="danger" title="Falha ao carregar catracas">
              {error}
            </DuoAlert>
          ) : null}
          {lastSetup ? (
            <DuoAlert variant="success" title="Credenciais de ingestão prontas">
              <div className="space-y-1 font-mono text-xs">
                <p>Ingestion key: {lastSetup.ingestionKey}</p>
                <p>Secret: {lastSetup.secret}</p>
              </div>
            </DuoAlert>
          ) : null}

          <ScreenShell.Header>
            <ScreenShell.Heading>
              <ScreenShell.Title>Catracas</ScreenShell.Title>
              <ScreenShell.Description>
                Presença unificada dentro do painel da academia, com operação
                manual, monitoramento e conciliação no mesmo fluxo.
              </ScreenShell.Description>
            </ScreenShell.Heading>
            <ScreenShell.Actions className="flex items-center gap-2">
              <DuoButton asChild variant="outline" className="gap-2">
                <Link href="/gym?tab=more">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para Mais
                </Link>
              </DuoButton>
              <DuoButton
                variant="primary"
                className="gap-2"
                loading={isLoading || isMutating}
                onClick={() => void loadAll()}
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
          <DuoStatsGrid.Root columns={3}>
            <DuoStatCard.Simple
              icon={Activity}
              value={String(overview?.occupancyNow ?? 0)}
              label="Ocupação Agora"
              badge={`${overview?.entriesToday ?? 0} entradas`}
              iconColor="var(--duo-primary)"
            />
            <DuoStatCard.Simple
              icon={Users}
              value={String(overview?.activeStudents ?? 0)}
              label="Alunos Dentro"
              badge={`${overview?.activePersonals ?? 0} personais`}
              iconColor="var(--duo-secondary)"
            />
            <DuoStatCard.Simple
              icon={AlertTriangle}
              value={String(overview?.unresolvedEvents ?? 0)}
              label="Pendências"
              badge={`${bindings.length} vínculos`}
              iconColor="var(--duo-accent)"
            />
            <DuoStatCard.Simple
              icon={WifiOff}
              value={String(overview?.offlineDevices ?? 0)}
              label="Offline"
              badge={`${overview?.anomalousEvents ?? 0} anomalias`}
              iconColor="#A560E8"
            />
            <DuoStatCard.Simple
              icon={ShieldCheck}
              value={String(overview?.allowedToday ?? 0)}
              label="Liberados Hoje"
              badge={`${overview?.deniedToday ?? 0} negados`}
              iconColor="var(--duo-secondary)"
            />
            <DuoStatCard.Simple
              icon={AlertTriangle}
              value={String(overview?.graceStudents ?? 0)}
              label="Na Graça"
              badge={`${overview?.blockedStudents ?? 0} bloqueados`}
              iconColor="var(--duo-accent)"
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
              <DuoTabs.List className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                {sectionItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DuoTabs.Trigger
                      key={item.id}
                      value={item.id}
                      className="justify-start rounded-2xl px-4 py-3 text-left normal-case tracking-normal"
                      icon={
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--duo-bg-elevated)] text-[var(--duo-primary)]">
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                      }
                    >
                      <span className="min-w-0">
                        <span className="block font-bold text-duo-text">{item.label}</span>
                        <span className="block text-xs text-duo-gray-dark">
                          {item.description}
                        </span>
                      </span>
                    </DuoTabs.Trigger>
                  );
                })}
              </DuoTabs.List>
            </DuoTabs.Root>
          </DuoCard.Root>
        </SlideIn>

        {activeSection === "overview" && (
          <SlideIn delay={0.2}>
            <ScreenShell.SectionGrid>
              <DashboardSection.Root
                title="Quem Está Dentro"
                description="Ocupação atual separada por perfil."
                icon={<Users className="h-5 w-5 text-[var(--duo-primary)]" aria-hidden="true" />}
              >
                <div className="grid gap-3 md:grid-cols-2">
                  <DuoCard.Root variant="default" padding="md">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="font-bold text-duo-text">Alunos</p>
                      <StatusPill tone="info">
                        {presence.students.length} Presentes
                      </StatusPill>
                    </div>
                    <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                      {presence.students.length === 0 ? (
                        <p className="text-sm text-duo-gray-dark">
                          Nenhum aluno presente agora.
                        </p>
                      ) : (
                        presence.students.map((student) => (
                          <PresenceItem
                            key={student.id}
                            name={student.subjectName || "Aluno"}
                            entryAt={student.entryAt}
                          />
                        ))
                      )}
                    </div>
                  </DuoCard.Root>
                  <DuoCard.Root variant="default" padding="md">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="font-bold text-duo-text">Personais</p>
                      <StatusPill tone="info">
                        {presence.personals.length} Presentes
                      </StatusPill>
                    </div>
                    <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                      {presence.personals.length === 0 ? (
                        <p className="text-sm text-duo-gray-dark">
                          Nenhum personal presente agora.
                        </p>
                      ) : (
                        presence.personals.map((personal) => (
                          <PresenceItem
                            key={personal.id}
                            name={personal.subjectName || "Personal"}
                            entryAt={personal.entryAt}
                          />
                        ))
                      )}
                    </div>
                  </DuoCard.Root>
                </div>
              </DashboardSection.Root>

              <DashboardSection.Root
                title="Movimento do Dia"
                description="Entradas, saídas e últimas passagens processadas."
                icon={<Activity className="h-5 w-5 text-[var(--duo-primary)]" aria-hidden="true" />}
              >
                <div className="grid gap-3">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <DuoCard.Root variant="default" padding="sm">
                      <p className="text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
                        Entradas
                      </p>
                      <p className="mt-1 text-2xl font-extrabold text-duo-text">
                        {overview?.entriesToday ?? 0}
                      </p>
                    </DuoCard.Root>
                    <DuoCard.Root variant="default" padding="sm">
                      <p className="text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
                        Saídas
                      </p>
                      <p className="mt-1 text-2xl font-extrabold text-duo-text">
                        {overview?.exitsToday ?? 0}
                      </p>
                    </DuoCard.Root>
                    <DuoCard.Root variant="default" padding="sm">
                      <p className="text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
                        Dispositivos
                      </p>
                      <p className="mt-1 text-2xl font-extrabold text-duo-text">
                        {overview?.totalDevices ?? 0}
                      </p>
                    </DuoCard.Root>
                  </div>
                  <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                    {(overview?.recentFeed ?? []).length === 0 ? (
                      <DashboardSection.Empty>
                        Nenhum evento recente processado hoje.
                      </DashboardSection.Empty>
                    ) : (
                      overview?.recentFeed.map((event) => (
                        <EventCard key={event.id} event={event} />
                      ))
                    )}
                  </div>
                </div>
              </DashboardSection.Root>

              <DashboardSection.Root
                title="Saúde Operacional"
                description="Sinais que pedem intervenção da recepção."
                icon={<ShieldCheck className="h-5 w-5 text-[var(--duo-primary)]" aria-hidden="true" />}
              >
                <div className="grid gap-3">
                  <DuoCard.Root variant="default" padding="sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-duo-text">Pendências</p>
                        <p className="text-xs text-duo-gray-dark">eventos sem vínculo</p>
                      </div>
                      <StatusPill tone={pending.length > 0 ? "warning" : "success"}>
                        {pending.length}
                      </StatusPill>
                    </div>
                  </DuoCard.Root>
                  <DuoCard.Root variant="default" padding="sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-duo-text">Dispositivos Offline</p>
                        <p className="text-xs text-duo-gray-dark">sem heartbeat recente</p>
                      </div>
                      <StatusPill
                        tone={(overview?.offlineDevices ?? 0) > 0 ? "danger" : "success"}
                      >
                        {overview?.offlineDevices ?? 0}
                      </StatusPill>
                    </div>
                  </DuoCard.Root>
                  <DuoCard.Root variant="default" padding="sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-duo-text">Anomalias</p>
                        <p className="text-xs text-duo-gray-dark">conflitos de direção</p>
                      </div>
                      <StatusPill
                        tone={(overview?.anomalousEvents ?? 0) > 0 ? "warning" : "success"}
                      >
                        {overview?.anomalousEvents ?? 0}
                      </StatusPill>
                    </div>
                  </DuoCard.Root>
                </div>
              </DashboardSection.Root>
            </ScreenShell.SectionGrid>
          </SlideIn>
        )}

        {activeSection === "devices" && (
          <SlideIn delay={0.2}>
            <div className="space-y-6">
              <ScreenShell.SectionGrid>
                <DashboardSection.Root
                  title="Cadastrar Dispositivo"
                  description="Configure fornecedor, política de direção e template declarativo."
                  icon={<Cpu className="h-5 w-5 text-[var(--duo-primary)]" aria-hidden="true" />}
                  action={
                    <DuoButton
                      size="sm"
                      onClick={() => void handleCreateDevice()}
                      loading={isMutating}
                    >
                      <Plus className="h-4 w-4" />
                      Criar
                    </DuoButton>
                  }
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <DuoInput.Simple
                      label="Nome do dispositivo"
                      name="device-name"
                      placeholder="Ex.: catraca recepção"
                      value={deviceDraft.name}
                      onChange={(event) =>
                        setDeviceDraft((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      autoComplete="off"
                    />
                    <DuoInput.Simple
                      label="Fornecedor"
                      name="device-vendor"
                      placeholder="Ex.: controlid"
                      value={deviceDraft.vendorKey}
                      onChange={(event) =>
                        setDeviceDraft((current) => ({
                          ...current,
                          vendorKey: event.target.value,
                        }))
                      }
                      autoComplete="off"
                    />
                    <DuoInput.Simple
                      label="Tipo físico"
                      name="device-hardware-type"
                      placeholder="tripod, flap, swing…"
                      value={deviceDraft.hardwareType}
                      onChange={(event) =>
                        setDeviceDraft((current) => ({
                          ...current,
                          hardwareType: event.target.value,
                        }))
                      }
                      autoComplete="off"
                    />
                    <DuoInput.Simple
                      label="Modos de autenticação"
                      name="device-auth-modes"
                      placeholder="rfid, facial, digital…"
                      value={deviceDraft.authModes}
                      onChange={(event) =>
                        setDeviceDraft((current) => ({
                          ...current,
                          authModes: event.target.value,
                        }))
                      }
                      autoComplete="off"
                    />
                    <DuoSelect.Simple
                      label="Política de direção"
                      options={[...selectOptions.direction]}
                      value={deviceDraft.directionMode}
                      onChange={(value) =>
                        setDeviceDraft((current) => ({
                          ...current,
                          directionMode: value as typeof current.directionMode,
                        }))
                      }
                    />
                    <DuoSelect.Simple
                      label="Transporte"
                      options={[...selectOptions.transport]}
                      value={deviceDraft.transport}
                      onChange={(value) =>
                        setDeviceDraft((current) => ({
                          ...current,
                          transport: value as typeof current.transport,
                        }))
                      }
                    />
                    <DuoSelect.Simple
                      label="Status inicial"
                      options={[...selectOptions.status]}
                      value={deviceDraft.status}
                      onChange={(value) =>
                        setDeviceDraft((current) => ({
                          ...current,
                          status: value as typeof current.status,
                        }))
                      }
                    />
                    <DuoInput.Simple
                      label="Janela de deduplicação (s)"
                      name="device-dedupe-window"
                      placeholder="120"
                      value={deviceDraft.dedupeWindowSeconds}
                      onChange={(event) =>
                        setDeviceDraft((current) => ({
                          ...current,
                          dedupeWindowSeconds: event.target.value,
                        }))
                      }
                      inputMode="numeric"
                    />
                  </div>
                  <div className="mt-4 space-y-2">
                    <label
                      htmlFor="device-template"
                      className="text-sm font-bold uppercase tracking-wider text-[var(--duo-fg-muted)]"
                    >
                      Template declarativo
                    </label>
                    <textarea
                      id="device-template"
                      name="device-template"
                      className="min-h-52 w-full rounded-xl border-2 border-[var(--duo-border)] bg-[var(--duo-bg-card)] px-4 py-3 text-sm text-[var(--duo-fg)] focus:border-[var(--duo-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--duo-primary)]/20"
                      value={deviceDraft.payloadTemplate}
                      onChange={(event) =>
                        setDeviceDraft((current) => ({
                          ...current,
                          payloadTemplate: event.target.value,
                        }))
                      }
                      spellCheck={false}
                    />
                    <p className="text-xs text-duo-gray-dark">
                      Use os paths do payload do fornecedor. O worker normaliza esse
                      JSON antes de abrir ou fechar a sessão.
                    </p>
                  </div>
                </DashboardSection.Root>

                <DashboardSection.Root
                  title="Fluxo da Integração"
                  description="A borda HTTP recebe, a fila processa e a sessão de presença é atualizada."
                  icon={<Fingerprint className="h-5 w-5 text-[var(--duo-primary)]" aria-hidden="true" />}
                >
                  <div className="grid gap-3">
                    <DuoCard.Root variant="default" padding="sm">
                      <p className="font-bold text-duo-text">1. Recepção</p>
                      <p className="text-sm text-duo-gray-dark">
                        O webhook persiste o evento bruto e o publica na fila.
                      </p>
                    </DuoCard.Root>
                    <DuoCard.Root variant="default" padding="sm">
                      <p className="font-bold text-duo-text">2. Normalização</p>
                      <p className="text-sm text-duo-gray-dark">
                        O template resolve data, identificador e direção.
                      </p>
                    </DuoCard.Root>
                    <DuoCard.Root variant="default" padding="sm">
                      <p className="font-bold text-duo-text">3. Presença</p>
                      <p className="text-sm text-duo-gray-dark">
                        A sessão abre, fecha ou segue para conciliação.
                      </p>
                    </DuoCard.Root>
                  </div>
                </DashboardSection.Root>
              </ScreenShell.SectionGrid>

              <DashboardSection.Root
                title="Dispositivos Ativos"
                description="Status, heartbeat e último evento de cada integração."
                icon={<Radio className="h-5 w-5 text-[var(--duo-primary)]" aria-hidden="true" />}
              >
                <DashboardSection.List className="max-h-[32rem] overflow-y-auto pr-1">
                  {devices.length === 0 ? (
                    <DashboardSection.Empty>
                      Nenhum dispositivo cadastrado ainda.
                    </DashboardSection.Empty>
                  ) : (
                    devices.map((device) => (
                      <DuoCard.Root key={device.id} variant="default" padding="md">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate font-bold text-duo-text">
                                {device.name}
                              </p>
                              <StatusPill
                                tone={
                                  device.status === "active"
                                    ? "success"
                                    : device.status === "paused"
                                      ? "warning"
                                      : device.status === "offline"
                                        ? "danger"
                                        : "info"
                                }
                              >
                                {device.status}
                              </StatusPill>
                            </div>
                            <p className="mt-1 text-xs text-duo-gray-dark">
                              {device.vendorKey} • {device.hardwareType} • {device.transport}
                            </p>
                            <div className="mt-3 grid gap-2 text-sm text-duo-text md:grid-cols-2">
                              <p>
                                <span className="font-bold">Autenticação:</span>{" "}
                                {device.authModes.join(", ") || "Sem modo definido"}
                              </p>
                              <p>
                                <span className="font-bold">Direção:</span>{" "}
                                {device.directionMode}
                              </p>
                              <p>
                                <span className="font-bold">Heartbeat:</span>{" "}
                                {formatDateTime(device.lastHeartbeatAt)}
                              </p>
                              <p>
                                <span className="font-bold">Último evento:</span>{" "}
                                {formatDateTime(device.lastEventAt)}
                              </p>
                            </div>
                          </div>
                          <DuoButton
                            size="sm"
                            variant={device.status === "active" ? "outline" : "primary"}
                            disabled={isMutating}
                            onClick={() =>
                              void updateDevice(device.id, {
                                status: device.status === "active" ? "paused" : "active",
                              })
                            }
                          >
                            {device.status === "active" ? "Pausar" : "Ativar"}
                          </DuoButton>
                        </div>
                      </DuoCard.Root>
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
              title="Eventos ao Vivo"
              description="Origem, direção resolvida e status do processamento."
              icon={<Radio className="h-5 w-5 text-[var(--duo-primary)]" aria-hidden="true" />}
            >
              <DashboardSection.List>
                {feed.length === 0 ? (
                  <DashboardSection.Empty>
                    Ainda não há eventos processados para esta academia.
                  </DashboardSection.Empty>
                ) : (
                  feed.map((event) => <EventCard key={event.id} event={event} />)
                )}
              </DashboardSection.List>
            </DashboardSection.Root>
          </SlideIn>
        )}

        {activeSection === "manual" && (
          <SlideIn delay={0.2}>
            <div className="space-y-6">
              <DuoAlert variant="info" title="Operação de contingência">
                Use esta área quando a recepção precisar registrar passagem manual
                por falha do leitor, contingência ou conferência visual.
              </DuoAlert>

              <DuoCard.Root variant="default" padding="md">
                <DuoInput.Simple
                  label="Motivo operacional"
                  name="manual-reason"
                  placeholder="Ex.: falha de leitura facial…"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  helperText="Esse texto entra na auditoria do evento manual."
                  autoComplete="off"
                />
              </DuoCard.Root>

              <ScreenShell.SectionGrid>
                <DashboardSection.Root
                  title="Operação com Alunos"
                  description="Busque o aluno ativo e registre a passagem."
                  icon={<Users className="h-5 w-5 text-[var(--duo-primary)]" aria-hidden="true" />}
                >
                  <DashboardSection.List>
                    <DuoInput.Simple
                      label="Buscar aluno ativo"
                      name="student-query"
                      placeholder="Digite pelo menos 2 caracteres…"
                      value={studentQuery}
                      onChange={(event) => setStudentQuery(event.target.value)}
                      autoComplete="off"
                    />
                    {isSearchingActiveMembers ? (
                      <DashboardSection.Empty>Buscando alunos ativos…</DashboardSection.Empty>
                    ) : activeMembers.length === 0 ? (
                      <DashboardSection.Empty>
                        {studentQuery.trim().length < 2
                          ? "Digite ao menos 2 caracteres para localizar alunos ativos."
                          : "Nenhum aluno ativo encontrado para este filtro."}
                      </DashboardSection.Empty>
                    ) : (
                      activeMembers.map((student) => (
                        <ManualSubjectCard
                          key={student.id}
                          name={student.name}
                          avatar={student.avatar}
                          onEntry={() =>
                            void handleManualAction("STUDENT", student.id, "entry")
                          }
                          onExit={() =>
                            void handleManualAction("STUDENT", student.id, "exit")
                          }
                        />
                      ))
                    )}
                  </DashboardSection.List>
                </DashboardSection.Root>

                <DashboardSection.Root
                  title="Operação com Personais"
                  description="Use esta área para registrar afiliados manualmente."
                  icon={<UserSquare2 className="h-5 w-5 text-[var(--duo-primary)]" aria-hidden="true" />}
                >
                  <DashboardSection.List>
                    <DuoInput.Simple
                      label="Buscar personal afiliado"
                      name="personal-query"
                      placeholder="Buscar por nome…"
                      value={personalQuery}
                      onChange={(event) => setPersonalQuery(event.target.value)}
                      autoComplete="off"
                    />
                    {isSearchingLinkedPersonals ? (
                      <DashboardSection.Empty>
                        Buscando personais afiliados…
                      </DashboardSection.Empty>
                    ) : linkedPersonalSearchResults.length === 0 ? (
                      <DashboardSection.Empty>
                        {personalQuery.trim()
                          ? "Nenhum personal afiliado localizado para este filtro."
                          : "Nenhum personal afiliado disponível para operação manual."}
                      </DashboardSection.Empty>
                    ) : (
                      linkedPersonalSearchResults.map((personal) => (
                        <ManualSubjectCard
                          key={personal.id}
                          name={personal.name}
                          subtitle={personal.email}
                          avatar={personal.avatar}
                          onEntry={() =>
                            void handleManualAction("PERSONAL", personal.id, "entry")
                          }
                          onExit={() =>
                            void handleManualAction("PERSONAL", personal.id, "exit")
                          }
                        />
                      ))
                    )}
                  </DashboardSection.List>
                </DashboardSection.Root>
              </ScreenShell.SectionGrid>
            </div>
          </SlideIn>
        )}

        {activeSection === "pending" && (
          <SlideIn delay={0.2}>
            <ScreenShell.SectionGrid>
              <DashboardSection.Root
                title="Fila de Conciliação"
                description="Associe o evento ao sujeito interno ou descarte ruído."
                icon={<Fingerprint className="h-5 w-5 text-[var(--duo-primary)]" aria-hidden="true" />}
              >
                <DashboardSection.List className="max-h-[40rem] overflow-y-auto pr-1">
                  {pending.length === 0 ? (
                    <DashboardSection.Empty>
                      Nenhuma pendência de conciliação no momento.
                    </DashboardSection.Empty>
                  ) : (
                    pending.map((event) => {
                      const draft = pendingDrafts[event.id] ?? {
                        subjectType: "STUDENT" as const,
                        subjectId: "",
                      };

                      return (
                        <DuoCard.Root key={event.id} variant="default" padding="md">
                          <div className="space-y-3">
                            <div>
                              <p className="font-bold text-duo-text">
                                {event.identifierValue || "Evento sem identificador"}
                              </p>
                              <p className="text-xs text-duo-gray-dark">
                                {event.identifierType || "sem tipo"} • {formatDateTime(event.occurredAt)}
                              </p>
                            </div>
                            <div className="grid gap-3 md:grid-cols-[180px_1fr]">
                              <DuoSelect.Simple
                                label="Tipo de sujeito"
                                options={[...selectOptions.subjectType]}
                                value={draft.subjectType}
                                onChange={(value) =>
                                  setPendingDrafts((current) => ({
                                    ...current,
                                    [event.id]: {
                                      ...draft,
                                      subjectType: value as PendingDraft["subjectType"],
                                    },
                                  }))
                                }
                              />
                              <DuoInput.Simple
                                label="ID interno"
                                name={`pending-${event.id}`}
                                placeholder="Cole o ID do aluno ou personal…"
                                value={draft.subjectId}
                                onChange={(entryEvent) =>
                                  setPendingDrafts((current) => ({
                                    ...current,
                                    [event.id]: {
                                      ...draft,
                                      subjectId: entryEvent.target.value,
                                    },
                                  }))
                                }
                                autoComplete="off"
                              />
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <DuoButton
                                size="sm"
                                onClick={() =>
                                  void reconcileEvent({
                                    eventId: event.id,
                                    action: "apply",
                                    subjectType: draft.subjectType,
                                    subjectId: draft.subjectId,
                                    createBinding: true,
                                  })
                                }
                              >
                                <ShieldCheck className="h-4 w-4" />
                                Aplicar & Vincular
                              </DuoButton>
                              <DuoButton
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  void reconcileEvent({
                                    eventId: event.id,
                                    action: "ignore",
                                    createBinding: false,
                                  })
                                }
                              >
                                Ignorar Evento
                              </DuoButton>
                            </div>
                          </div>
                        </DuoCard.Root>
                      );
                    })
                  )}
                </DashboardSection.List>
              </DashboardSection.Root>

              <DashboardSection.Root
                title="Credenciais Vinculadas"
                description="Mapa atual entre identificadores externos e sujeitos."
                icon={<Fingerprint className="h-5 w-5 text-[var(--duo-primary)]" aria-hidden="true" />}
              >
                <DashboardSection.List className="max-h-[40rem] overflow-y-auto pr-1">
                  {bindings.length === 0 ? (
                    <DashboardSection.Empty>
                      Nenhuma credencial vinculada ainda.
                    </DashboardSection.Empty>
                  ) : (
                    bindings.map((binding) => (
                      <DuoCard.Root key={binding.id} variant="default" padding="sm">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-bold text-duo-text">
                              {binding.subjectName || "Sujeito sem nome"}
                            </p>
                            <p className="text-xs text-duo-gray-dark">
                              {binding.identifierType} • {binding.identifierValue}
                            </p>
                          </div>
                          <StatusPill tone="info">{binding.subjectType}</StatusPill>
                        </div>
                      </DuoCard.Root>
                    ))
                  )}
                </DashboardSection.List>
              </DashboardSection.Root>
            </ScreenShell.SectionGrid>
          </SlideIn>
        )}
      </ScreenShell.Body>
    </ScreenShell.Root>
  );
}
