"use client";

import type { ScreenProps, ViewContract } from "@/components/foundations";

export interface SwaggerTag {
  name: string;
  description?: string;
}

export interface SwaggerMethodDetails {
  summary?: string;
  description?: string;
  tags?: string[];
}

export interface SwaggerSpec {
  info?: {
    title?: string;
    version?: string;
    description?: string;
  };
  servers?: Array<{ url?: string }>;
  tags?: SwaggerTag[];
  paths?: Record<string, Record<string, SwaggerMethodDetails>>;
}

export interface SwaggerDocsScreenProps
  extends ScreenProps<{
    spec: SwaggerSpec | null;
    error: string | null;
    swaggerJsonUrl: string;
  }> {}

export const swaggerDocsScreenContract: ViewContract = {
  componentId: "swagger-docs-screen",
  testId: "swagger-docs-screen",
};

function getMethodBadgeClass(method: string) {
  if (method === "get") return "bg-blue-100 text-blue-800";
  if (method === "post") return "bg-green-100 text-green-800";
  if (method === "put") return "bg-yellow-100 text-yellow-800";
  if (method === "delete") return "bg-red-100 text-red-800";

  return "bg-gray-100 text-gray-800";
}

export function SwaggerDocsScreen({
  spec,
  error,
  swaggerJsonUrl,
}: SwaggerDocsScreenProps) {
  if (error) {
    return (
      <div
        className="min-h-screen p-8"
        data-testid={swaggerDocsScreenContract.testId}
      >
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-4 text-2xl font-bold">Erro ao carregar Swagger</h1>
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!spec) {
    return (
      <div
        className="flex min-h-screen items-center justify-center p-8"
        data-testid={swaggerDocsScreenContract.testId}
      >
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900" />
          <p>Carregando Swagger...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-50 p-8"
      data-testid={swaggerDocsScreenContract.testId}
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-lg bg-white p-6 shadow-lg">
          <h1 className="mb-2 text-3xl font-bold">API Documentation</h1>
          <p className="mb-4 text-gray-600">
            Documentacao completa da API do GymRats
          </p>
          <div className="flex gap-4">
            <a
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              href="https://editor.swagger.io/"
              rel="noopener noreferrer"
              target="_blank"
            >
              Abrir no Swagger Editor
            </a>
            <a
              className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
              href={swaggerJsonUrl}
              rel="noopener"
              target="_blank"
            >
              Ver JSON
            </a>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-xl font-semibold">Informacoes da API</h2>
          <div className="space-y-2">
            <p>
              <strong>Titulo:</strong> {spec.info?.title}
            </p>
            <p>
              <strong>Versao:</strong> {spec.info?.version}
            </p>
            <p>
              <strong>Descricao:</strong> {spec.info?.description}
            </p>
            <p>
              <strong>Servidor:</strong> {spec.servers?.[0]?.url}
            </p>
          </div>

          <h3 className="mb-4 mt-6 text-lg font-semibold">Tags Disponiveis</h3>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {spec.tags?.map((tag) => (
              <div
                key={tag.name}
                className="rounded border bg-gray-50 p-3"
                data-testid={`${swaggerDocsScreenContract.testId}.tag`}
              >
                <p className="font-medium">{tag.name}</p>
                <p className="text-sm text-gray-600">{tag.description}</p>
              </div>
            ))}
          </div>

          <h3 className="mb-4 mt-6 text-lg font-semibold">Endpoints</h3>
          <div
            className="space-y-4"
            data-testid={`${swaggerDocsScreenContract.testId}.paths`}
          >
            {Object.entries(spec.paths || {}).map(([endpointPath, methods]) => (
              <div key={endpointPath} className="rounded border p-4">
                <p className="mb-2 font-mono text-sm font-semibold">
                  {endpointPath}
                </p>
                <div className="space-y-2">
                  {Object.entries(methods).map(([method, details]) => (
                    <div
                      key={method}
                      className="flex items-start gap-2"
                      data-testid={`${swaggerDocsScreenContract.testId}.operation`}
                    >
                      <span
                        className={`rounded px-2 py-1 text-xs font-semibold ${getMethodBadgeClass(
                          method,
                        )}`}
                      >
                        {method.toUpperCase()}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium">{details.summary}</p>
                        <p className="text-sm text-gray-600">
                          {details.description}
                        </p>
                        {details.tags ? (
                          <div className="mt-1 flex gap-1">
                            {details.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-800"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            <strong>Dica:</strong> Para uma visualizacao interativa completa,
            copie o JSON de{" "}
            <code className="rounded bg-blue-100 px-1">{swaggerJsonUrl}</code>{" "}
            e cole no{" "}
            <a
              className="font-semibold underline"
              href="https://editor.swagger.io/"
              rel="noopener noreferrer"
              target="_blank"
            >
              Swagger Editor
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
