"use client";

import { useEffect, useRef, useState } from "react";
import { resolveApiBaseUrl } from "@/lib/api/resolve-api-base-url";

interface SwaggerUIConfig {
  url: string;
  dom_id: string;
  presets: Array<Record<string, string | number | boolean | object | null>>;
  layout: string;
  deepLinking?: boolean;
  displayRequestDuration?: boolean;
  filter?: boolean;
  tryItOutEnabled?: boolean;
  persistAuthorization?: boolean;
  supportedSubmitMethods?: string[];
  requestInterceptor?: (req: {
    headers?: Record<string, string>;
    credentials?: string;
  }) => Promise<{ headers?: Record<string, string>; credentials?: string }>;
  responseInterceptor?: (
    res: Record<string, string | number | boolean | object | null>,
  ) => Record<string, string | number | boolean | object | null>;
}

declare global {
  interface Window {
    SwaggerUIBundle?: ((config: SwaggerUIConfig) => void) & {
      presets?: {
        apis: Record<string, string | number | boolean | object | null>;
      };
    };
    SwaggerUIStandalonePreset?: Record<
      string,
      string | number | boolean | object | null
    >;
  }
}

export default function ApiDocsPage() {
  const swaggerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const swaggerJsonUrl = `${resolveApiBaseUrl()}/api/swagger`;

  useEffect(() => {
    if (typeof window === "undefined" || !swaggerRef.current) return;

    const initSwagger = () => {
      const SwaggerUIBundle = window.SwaggerUIBundle;
      const SwaggerUIStandalonePreset = window.SwaggerUIStandalonePreset;

      if (SwaggerUIBundle && SwaggerUIStandalonePreset && swaggerRef.current) {
        swaggerRef.current.innerHTML = "";

        SwaggerUIBundle({
          url: swaggerJsonUrl,
          dom_id: "#swagger-ui",
          presets: [
            SwaggerUIBundle.presets?.apis ?? {},
            SwaggerUIStandalonePreset,
          ],
          layout: "StandaloneLayout",
          deepLinking: true,
          displayRequestDuration: true,
          filter: true,
          tryItOutEnabled: true,
          persistAuthorization: true,
          supportedSubmitMethods: ["get", "post", "put", "delete", "patch"],
          requestInterceptor: async (req) => {
            req.credentials = "include";
            return req;
          },
          responseInterceptor: (
            res: Record<string, string | number | boolean | object | null>,
          ) => {
            console.log("[Swagger] Response:", res);
            return res;
          },
        });

        setLoading(false);
      }
    };

    const cssLink = document.createElement("link");
    cssLink.rel = "stylesheet";
    cssLink.href = "https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css";
    document.head.appendChild(cssLink);

    const bundleScript = document.createElement("script");
    bundleScript.src =
      "https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js";
    bundleScript.async = true;

    const presetScript = document.createElement("script");
    presetScript.src =
      "https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-standalone-preset.js";
    presetScript.async = true;

    bundleScript.onload = () => {
      document.body.appendChild(presetScript);

      presetScript.onload = () => {
        setTimeout(initSwagger, 100);
      };
    };

    document.body.appendChild(bundleScript);
  }, [swaggerJsonUrl]);

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto p-4 md:p-8">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            API Documentation
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Documentacao completa da API do GymRats. Teste rotas autenticadas
            usando a sessao ativa do navegador.
          </p>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Dica:</strong> No navegador, os requests usam a sessao
              autenticada via cookie. O botao &quot;Authorize&quot; so e
              necessario para tokens fornecidos manualmente em ferramentas
              externas.
            </p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#58CC02] mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando documentacao...</p>
            </div>
          </div>
        )}

        <div
          id="swagger-ui"
          ref={swaggerRef}
          style={{ minHeight: "800px" }}
        ></div>
      </div>
    </div>
  );
}
