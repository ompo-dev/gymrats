"use client";

import { useEffect, useState } from "react";

type LiveEvent = {
  streamId: string;
  kind: "telemetry" | "business" | "system";
  eventType: string;
  domain: string;
  status?: string | null;
  requestId?: string | null;
  occurredAt: string;
  payload?: Record<string, unknown> | null;
};

const MAX_EVENTS = 40;

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

export function RealtimeEventFeed() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [status, setStatus] = useState<"connecting" | "open" | "closed">(
    "connecting",
  );

  useEffect(() => {
    const source = new EventSource("/api/admin/observability/stream", {
      withCredentials: true,
    });

    source.onopen = () => {
      setStatus("open");
    };

    source.onerror = () => {
      setStatus("closed");
    };

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as LiveEvent;
        setEvents((current) => [payload, ...current].slice(0, MAX_EVENTS));
      } catch {
        // Ignore malformed events from the stream.
      }
    };

    return () => {
      source.close();
      setStatus("closed");
    };
  }, []);

  return (
    <section className="rounded-2xl border border-duo-border bg-duo-bg-card p-4 lg:col-span-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-duo-text">
            Realtime event feed
          </h2>
          <p className="text-xs text-duo-gray-dark">
            Stream SSE do backend com eventos de telemetria e domínio.
          </p>
        </div>
        <span className="rounded-full border border-duo-border px-3 py-1 text-xs text-duo-gray-dark">
          {status === "open"
            ? "Conectado"
            : status === "connecting"
              ? "Conectando"
              : "Reconectando"}
        </span>
      </div>

      <div className="max-h-[24rem] space-y-3 overflow-y-auto pr-1">
        {events.map((event) => (
          <div
            key={event.streamId}
            className="rounded-xl border border-duo-border/70 px-3 py-2"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium text-duo-text">
                {event.eventType} · {event.domain}
              </p>
              <p className="text-xs text-duo-gray-dark">
                {formatTimestamp(event.occurredAt)}
              </p>
            </div>
            <p className="mt-1 text-xs text-duo-gray-dark">
              {event.kind}
              {event.status ? ` · ${event.status}` : ""}
              {event.requestId ? ` · ${event.requestId}` : ""}
            </p>
          </div>
        ))}

        {events.length === 0 ? (
          <div className="rounded-xl border border-dashed border-duo-border/70 px-3 py-6 text-sm text-duo-gray-dark">
            Aguardando eventos em tempo real...
          </div>
        ) : null}
      </div>
    </section>
  );
}
