"use client";

import {
  ArrowLeft,
  CircleOff,
  DoorClosed,
  DoorOpen,
  Plus,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DuoButton, DuoCard, DuoInput } from "@/components/duo";
import { ScreenShell } from "@/components/foundations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useGymAccessStore } from "@/stores/gym-access-store";
import { useGymDirectoryStore } from "@/stores/gym-directory-store";

type PendingDraft = {
  subjectType: "STUDENT" | "PERSONAL";
  subjectId: string;
};

const initialDeviceDraft = {
  name: "",
  vendorKey: "generic",
  adapterKey: "generic-webhook",
  hardwareType: "tripod",
  authModes: "rfid,facial",
  directionMode: "auto" as const,
  transport: "webhook" as const,
  status: "active" as const,
  dedupeWindowSeconds: "120",
  payloadTemplate: JSON.stringify(
    {
      eventIdPath: "event.id",
      occurredAtPath: "event.timestamp",
      identifierValuePath: "event.identifier",
      identifierTypePath: "event.identifierType",
      directionPath: "event.direction",
      deviceIdPath: "device.id",
    },
    null,
    2,
  ),
};

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <DuoCard.Root variant="default" size="sm">
      <p className="text-xs text-duo-gray-dark">{label}</p>
      <p className="text-2xl font-extrabold text-duo-text">{value}</p>
    </DuoCard.Root>
  );
}

export function GymAccessPage() {
  const {
    overview,
    feed,
    presence,
    devices,
    pending,
    bindings,
    isLoading,
    isMutating,
    loadAll,
    createDevice,
    updateDevice,
    createManualEvent,
    reconcileEvent,
  } = useGymAccessStore();
  const {
    activeMembers,
    linkedPersonalSearchResults,
    searchActiveMembers,
    clearActiveMembers,
    searchLinkedTeamPersonals,
  } = useGymDirectoryStore();
  const { toast } = useToast();
  const [tab, setTab] = useState("overview");
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

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (studentQuery.trim().length < 2) {
      clearActiveMembers();
      return;
    }

    void searchActiveMembers(studentQuery);
  }, [studentQuery, searchActiveMembers, clearActiveMembers]);

  useEffect(() => {
    void searchLinkedTeamPersonals(personalQuery);
  }, [personalQuery, searchLinkedTeamPersonals]);

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
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Falha ao criar dispositivo",
        description: error instanceof Error ? error.message : "Verifique os campos",
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
      });
      setReason("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Falha ao registrar presença",
        description: error instanceof Error ? error.message : "Tente novamente",
      });
    }
  };

  return (
    <ScreenShell.Root screenId="gym-access-page">
      <ScreenShell.Header>
        <ScreenShell.Heading>
          <ScreenShell.Title>Catracas</ScreenShell.Title>
          <ScreenShell.Description>
            Presença unificada, eventos ao vivo e operação manual da academia.
          </ScreenShell.Description>
        </ScreenShell.Heading>
        <ScreenShell.Actions className="flex items-center gap-2">
          <Link href="/gym?tab=more">
            <DuoButton variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </DuoButton>
          </Link>
          <DuoButton
            variant="primary"
            className="gap-2"
            disabled={isLoading || isMutating}
            onClick={() => void loadAll()}
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </DuoButton>
        </ScreenShell.Actions>
      </ScreenShell.Header>

      <ScreenShell.Body>
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Ocupação agora" value={overview?.occupancyNow ?? 0} />
          <StatCard label="Alunos dentro" value={overview?.activeStudents ?? 0} />
          <StatCard label="Personais dentro" value={overview?.activePersonals ?? 0} />
          <StatCard label="Entradas hoje" value={overview?.entriesToday ?? 0} />
          <StatCard label="Pendências" value={overview?.unresolvedEvents ?? 0} />
          <StatCard label="Offline" value={overview?.offlineDevices ?? 0} />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="devices">Dispositivos</TabsTrigger>
            <TabsTrigger value="events">Eventos</TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
            <TabsTrigger value="pending">Pendências</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <DuoCard.Root variant="default" padding="md">
              <h3 className="mb-3 font-bold text-duo-text">Quem está dentro</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs text-duo-gray-dark">Alunos</p>
                  <div className="space-y-2">
                    {presence.students.map((student) => (
                      <div
                        key={student.id}
                        className="rounded-lg border-2 border-duo-border px-3 py-2 text-sm font-bold text-duo-text"
                      >
                        {student.subjectName}
                      </div>
                    ))}
                    {presence.students.length === 0 && (
                      <p className="text-sm text-duo-gray-dark">
                        Nenhum aluno presente agora.
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs text-duo-gray-dark">Personais</p>
                  <div className="space-y-2">
                    {presence.personals.map((personal) => (
                      <div
                        key={personal.id}
                        className="rounded-lg border-2 border-duo-border px-3 py-2 text-sm font-bold text-duo-text"
                      >
                        {personal.subjectName}
                      </div>
                    ))}
                    {presence.personals.length === 0 && (
                      <p className="text-sm text-duo-gray-dark">
                        Nenhum personal presente agora.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </DuoCard.Root>

            <DuoCard.Root variant="default" padding="md">
              <h3 className="mb-3 font-bold text-duo-text">Feed recente</h3>
              <div className="space-y-2">
                {(overview?.recentFeed ?? []).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between rounded-lg border-2 border-duo-border px-3 py-2"
                  >
                    <div>
                      <p className="font-bold text-duo-text">
                        {event.subjectName || event.identifierValue || "Sem match"}
                      </p>
                      <p className="text-xs text-duo-gray-dark">
                        {event.source} • {event.directionResolved} •{" "}
                        {event.occurredAt.toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-duo-blue">
                      {event.status}
                    </span>
                  </div>
                ))}
                {(overview?.recentFeed ?? []).length === 0 && (
                  <p className="text-sm text-duo-gray-dark">
                    Nenhum evento recente.
                  </p>
                )}
              </div>
            </DuoCard.Root>
          </TabsContent>

          <TabsContent value="devices" className="space-y-4">
            <DuoCard.Root variant="default" padding="md">
              <h3 className="mb-4 font-bold text-duo-text">Novo dispositivo</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <DuoInput.Simple
                  value={deviceDraft.name}
                  onChange={(e) =>
                    setDeviceDraft((current) => ({ ...current, name: e.target.value }))
                  }
                  placeholder="Nome do dispositivo"
                />
                <DuoInput.Simple
                  value={deviceDraft.vendorKey}
                  onChange={(e) =>
                    setDeviceDraft((current) => ({
                      ...current,
                      vendorKey: e.target.value,
                    }))
                  }
                  placeholder="Fornecedor"
                />
                <DuoInput.Simple
                  value={deviceDraft.hardwareType}
                  onChange={(e) =>
                    setDeviceDraft((current) => ({
                      ...current,
                      hardwareType: e.target.value,
                    }))
                  }
                  placeholder="Tipo físico"
                />
                <DuoInput.Simple
                  value={deviceDraft.authModes}
                  onChange={(e) =>
                    setDeviceDraft((current) => ({
                      ...current,
                      authModes: e.target.value,
                    }))
                  }
                  placeholder="rfid,facial,qr"
                />
              </div>
              <textarea
                className="mt-3 min-h-40 w-full rounded-xl border-2 border-duo-border bg-white p-3 text-sm text-duo-text"
                value={deviceDraft.payloadTemplate}
                onChange={(e) =>
                  setDeviceDraft((current) => ({
                    ...current,
                    payloadTemplate: e.target.value,
                  }))
                }
              />
              <DuoButton
                className="mt-4 gap-2"
                onClick={() => void handleCreateDevice()}
                disabled={isMutating}
              >
                <Plus className="h-4 w-4" />
                Criar dispositivo
              </DuoButton>
            </DuoCard.Root>

            {lastSetup && (
              <DuoCard.Root variant="highlighted" padding="md">
                <p className="font-bold text-duo-green">Credenciais de ingestão</p>
                <p className="text-sm text-duo-text">
                  Ingestion key: <span className="font-mono">{lastSetup.ingestionKey}</span>
                </p>
                <p className="text-sm text-duo-text">
                  Secret: <span className="font-mono">{lastSetup.secret}</span>
                </p>
              </DuoCard.Root>
            )}

            <div className="space-y-3">
              {devices.map((device) => (
                <DuoCard.Root key={device.id} variant="default" padding="md">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-duo-text">{device.name}</p>
                      <p className="text-xs text-duo-gray-dark">
                        {device.vendorKey} • {device.hardwareType} • {device.status}
                      </p>
                    </div>
                    <DuoButton
                      variant={device.status === "active" ? "outline" : "primary"}
                      size="sm"
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
              ))}
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-3">
            {feed.map((event) => (
              <DuoCard.Root key={event.id} variant="default" padding="md">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-duo-text">
                      {event.subjectName || event.identifierValue || "Sem match"}
                    </p>
                    <p className="text-xs text-duo-gray-dark">
                      {event.deviceName || "Sem dispositivo"} • {event.source} •{" "}
                      {event.occurredAt.toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-duo-blue">
                    {event.directionResolved}
                  </span>
                </div>
              </DuoCard.Root>
            ))}
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <DuoCard.Root variant="default" padding="md">
              <h3 className="mb-3 font-bold text-duo-text">Motivo opcional</h3>
              <DuoInput.Simple
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Recepção, falha da catraca, contingência..."
              />
            </DuoCard.Root>

            <DuoCard.Root variant="default" padding="md">
              <h3 className="mb-3 font-bold text-duo-text">Alunos</h3>
              <DuoInput.Simple
                value={studentQuery}
                onChange={(e) => setStudentQuery(e.target.value)}
                placeholder="Buscar aluno ativo"
              />
              <div className="mt-3 space-y-2">
                {activeMembers.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between rounded-lg border-2 border-duo-border px-3 py-2"
                  >
                    <p className="font-bold text-duo-text">{student.name}</p>
                    <div className="flex gap-2">
                      <DuoButton
                        size="sm"
                        onClick={() =>
                          void handleManualAction("STUDENT", student.id, "entry")
                        }
                      >
                        <DoorOpen className="mr-1 h-3 w-3" />
                        Entrada
                      </DuoButton>
                      <DuoButton
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          void handleManualAction("STUDENT", student.id, "exit")
                        }
                      >
                        <DoorClosed className="mr-1 h-3 w-3" />
                        Saída
                      </DuoButton>
                    </div>
                  </div>
                ))}
              </div>
            </DuoCard.Root>

            <DuoCard.Root variant="default" padding="md">
              <h3 className="mb-3 font-bold text-duo-text">Personais</h3>
              <DuoInput.Simple
                value={personalQuery}
                onChange={(e) => setPersonalQuery(e.target.value)}
                placeholder="Buscar personal afiliado"
              />
              <div className="mt-3 space-y-2">
                {linkedPersonalSearchResults.map((personal) => (
                  <div
                    key={personal.id}
                    className="flex items-center justify-between rounded-lg border-2 border-duo-border px-3 py-2"
                  >
                    <p className="font-bold text-duo-text">{personal.name}</p>
                    <div className="flex gap-2">
                      <DuoButton
                        size="sm"
                        onClick={() =>
                          void handleManualAction("PERSONAL", personal.id, "entry")
                        }
                      >
                        <DoorOpen className="mr-1 h-3 w-3" />
                        Entrada
                      </DuoButton>
                      <DuoButton
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          void handleManualAction("PERSONAL", personal.id, "exit")
                        }
                      >
                        <DoorClosed className="mr-1 h-3 w-3" />
                        Saída
                      </DuoButton>
                    </div>
                  </div>
                ))}
              </div>
            </DuoCard.Root>
          </TabsContent>

          <TabsContent value="pending" className="space-y-3">
            {pending.map((event) => {
              const draft = pendingDrafts[event.id] ?? {
                subjectType: "STUDENT" as const,
                subjectId: "",
              };

              return (
                <DuoCard.Root key={event.id} variant="default" padding="md">
                  <p className="font-bold text-duo-text">
                    {event.identifierValue || "Evento sem identificador"}
                  </p>
                  <p className="mb-3 text-xs text-duo-gray-dark">
                    {event.occurredAt.toLocaleString("pt-BR")} • {event.status}
                  </p>
                  <div className="grid gap-3 md:grid-cols-[140px_1fr_auto_auto]">
                    <select
                      className="rounded-xl border-2 border-duo-border px-3 py-2 text-sm"
                      value={draft.subjectType}
                      onChange={(e) =>
                        setPendingDrafts((current) => ({
                          ...current,
                          [event.id]: {
                            ...draft,
                            subjectType: e.target.value as "STUDENT" | "PERSONAL",
                          },
                        }))
                      }
                    >
                      <option value="STUDENT">Aluno</option>
                      <option value="PERSONAL">Personal</option>
                    </select>
                    <DuoInput.Simple
                      value={draft.subjectId}
                      onChange={(e) =>
                        setPendingDrafts((current) => ({
                          ...current,
                          [event.id]: { ...draft, subjectId: e.target.value },
                        }))
                      }
                      placeholder="ID interno do aluno/personal"
                    />
                    <DuoButton
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
                      <ShieldCheck className="mr-1 h-3 w-3" />
                      Aplicar
                    </DuoButton>
                    <DuoButton
                      variant="outline"
                      onClick={() =>
                        void reconcileEvent({
                          eventId: event.id,
                          action: "ignore",
                          createBinding: false,
                        })
                      }
                    >
                      <CircleOff className="mr-1 h-3 w-3" />
                      Ignorar
                    </DuoButton>
                  </div>
                </DuoCard.Root>
              );
            })}

            {pending.length === 0 && (
              <DuoCard.Root variant="default" padding="md">
                <p className="text-sm text-duo-gray-dark">
                  Nenhuma pendência de conciliação no momento.
                </p>
              </DuoCard.Root>
            )}

            <DuoCard.Root variant="default" padding="md">
              <p className="mb-2 font-bold text-duo-text">Bindings ativos</p>
              <div className="space-y-2">
                {bindings.map((binding) => (
                  <div
                    key={binding.id}
                    className="rounded-lg border-2 border-duo-border px-3 py-2 text-sm"
                  >
                    <span className="font-bold text-duo-text">
                      {binding.identifierType}
                    </span>{" "}
                    <span className="text-duo-gray-dark">
                      {binding.identifierValue} → {binding.subjectName}
                    </span>
                  </div>
                ))}
              </div>
            </DuoCard.Root>
          </TabsContent>
        </Tabs>
      </ScreenShell.Body>
    </ScreenShell.Root>
  );
}
