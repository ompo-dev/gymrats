"use client";

import { useEffect, useState } from "react";

export default function SwaggerPage() {
  const [spec, setSpec] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/swagger")
      .then((res) => res.json())
      .then((data) => {
        setSpec(data);
      })
      .catch((err) => {
        setError(err.message);
      });
  }, []);

  if (error) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Erro ao carregar Swagger</h1>
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!spec) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Carregando Swagger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">API Documentation</h1>
          <p className="text-gray-600 mb-4">
            Documentação completa da API do GymRats
          </p>
          <div className="flex gap-4">
            <a
              href="https://editor.swagger.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Abrir no Swagger Editor
            </a>
            <a
              href="/api/swagger"
              target="_blank"
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Ver JSON
            </a>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Informações da API</h2>
          <div className="space-y-2">
            <p>
              <strong>Título:</strong> {spec.info?.title}
            </p>
            <p>
              <strong>Versão:</strong> {spec.info?.version}
            </p>
            <p>
              <strong>Descrição:</strong> {spec.info?.description}
            </p>
            <p>
              <strong>Servidor:</strong> {spec.servers?.[0]?.url}
            </p>
          </div>

          <h3 className="text-lg font-semibold mt-6 mb-4">Tags Disponíveis</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {spec.tags?.map((tag: any) => (
              <div key={tag.name} className="p-3 bg-gray-50 rounded border">
                <p className="font-medium">{tag.name}</p>
                <p className="text-sm text-gray-600">{tag.description}</p>
              </div>
            ))}
          </div>

          <h3 className="text-lg font-semibold mt-6 mb-4">Endpoints</h3>
          <div className="space-y-4">
            {Object.entries(spec.paths || {}).map(
              ([path, methods]: [string, any]) => (
                <div key={path} className="border rounded p-4">
                  <p className="font-mono text-sm font-semibold mb-2">{path}</p>
                  <div className="space-y-2">
                    {Object.entries(methods).map(
                      ([method, details]: [string, any]) => (
                        <div key={method} className="flex items-start gap-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              method === "get"
                                ? "bg-blue-100 text-blue-800"
                                : method === "post"
                                ? "bg-green-100 text-green-800"
                                : method === "put"
                                ? "bg-yellow-100 text-yellow-800"
                                : method === "delete"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {method.toUpperCase()}
                          </span>
                          <div className="flex-1">
                            <p className="font-medium">{details.summary}</p>
                            <p className="text-sm text-gray-600">
                              {details.description}
                            </p>
                            {details.tags && (
                              <div className="flex gap-1 mt-1">
                                {details.tags.map((tag: string) => (
                                  <span
                                    key={tag}
                                    className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>💡 Dica:</strong> Para uma visualização interativa completa,
            copie o JSON de{" "}
            <code className="bg-blue-100 px-1 rounded">/api/swagger</code> e
            cole no{" "}
            <a
              href="https://editor.swagger.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold"
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
