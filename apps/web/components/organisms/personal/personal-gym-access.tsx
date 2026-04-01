"use client";

import { ArrowLeft, DoorClosed, DoorOpen, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DuoButton, DuoCard, DuoInput } from "@/components/duo";
import { ScreenShell } from "@/components/foundations";
import { useToast } from "@/hooks/use-toast";
import { usePersonalAccessStore } from "@/stores/personal-access-store";

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

export function PersonalGymAccessPage({ gymId }: { gymId: string }) {
  const { overview, feed, students, isLoading, isMutating, error, loadAll, createManualEvent } =
    usePersonalAccessStore();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    void loadAll(gymId);
  }, [gymId, loadAll]);

  const visibleStudents = students.filter((student) =>
    student.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

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
        title: direction === "entry" ? "Entrada registrada" : "Saida registrada",
      });
      setReason("");
    } catch (manualError) {
      toast({
        variant: "destructive",
        title: "Falha ao registrar presenca",
        description:
          manualError instanceof Error ? manualError.message : "Tente novamente",
      });
    }
  };

  return (
    <ScreenShell.Root screenId="personal-gym-access-page">
      <ScreenShell.Header>
        <ScreenShell.Heading>
          <ScreenShell.Title>Catracas</ScreenShell.Title>
          <ScreenShell.Description>
            Visao da academia para acompanhar presenca e operar alunos manualmente.
          </ScreenShell.Description>
        </ScreenShell.Heading>
        <ScreenShell.Actions className="flex items-center gap-2">
          <Link href={`/personal?tab=gyms&gymId=${gymId}`}>
            <DuoButton variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </DuoButton>
          </Link>
          <DuoButton
            variant="primary"
            className="gap-2"
            disabled={isLoading || isMutating}
            onClick={() => void loadAll(gymId)}
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </DuoButton>
        </ScreenShell.Actions>
      </ScreenShell.Header>

      <ScreenShell.Body>
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Ocupacao agora" value={overview?.occupancyNow ?? 0} />
          <StatCard label="Alunos dentro" value={overview?.activeStudents ?? 0} />
          <StatCard label="Entradas hoje" value={overview?.entriesToday ?? 0} />
          <StatCard label="Pendencias" value={overview?.unresolvedEvents ?? 0} />
        </div>

        {error && (
          <DuoCard.Root variant="default" padding="md">
            <p className="text-sm font-bold text-duo-red">{error}</p>
          </DuoCard.Root>
        )}

        <DuoCard.Root variant="default" padding="md">
          <h3 className="mb-3 font-bold text-duo-text">Operacao manual</h3>
          <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
            <DuoInput.Simple
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar aluno vinculado"
            />
            <DuoInput.Simple
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Motivo opcional"
            />
          </div>
          <div className="mt-4 space-y-2">
            {visibleStudents.map((student) => (
              <div
                key={student.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 border-duo-border px-3 py-2"
              >
                <p className="font-bold text-duo-text">{student.name}</p>
                <div className="flex gap-2">
                  <DuoButton
                    size="sm"
                    onClick={() => void handleManualEvent(student.id, "entry")}
                  >
                    <DoorOpen className="mr-1 h-3 w-3" />
                    Entrada
                  </DuoButton>
                  <DuoButton
                    size="sm"
                    variant="outline"
                    onClick={() => void handleManualEvent(student.id, "exit")}
                  >
                    <DoorClosed className="mr-1 h-3 w-3" />
                    Saida
                  </DuoButton>
                </div>
              </div>
            ))}
            {visibleStudents.length === 0 && (
              <p className="text-sm text-duo-gray-dark">
                Nenhum aluno encontrado para este contexto.
              </p>
            )}
          </div>
        </DuoCard.Root>

        <DuoCard.Root variant="default" padding="md">
          <h3 className="mb-3 font-bold text-duo-text">Eventos recentes</h3>
          <div className="space-y-2">
            {feed.map((event) => (
              <div
                key={event.id}
                className="rounded-lg border-2 border-duo-border px-3 py-2"
              >
                <p className="font-bold text-duo-text">
                  {event.subjectName || event.identifierValue || "Sem match"}
                </p>
                <p className="text-xs text-duo-gray-dark">
                  {event.directionResolved} - {event.status} -{" "}
                  {event.occurredAt.toLocaleString("pt-BR")}
                </p>
              </div>
            ))}
            {feed.length === 0 && (
              <p className="text-sm text-duo-gray-dark">
                Nenhum evento recente nesta academia.
              </p>
            )}
          </div>
        </DuoCard.Root>
      </ScreenShell.Body>
    </ScreenShell.Root>
  );
}
