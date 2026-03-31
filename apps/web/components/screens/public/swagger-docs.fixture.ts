import type { SwaggerDocsScreenProps } from "./swagger-docs.screen";

export function createSwaggerDocsFixture(
  overrides: Partial<SwaggerDocsScreenProps> = {},
): SwaggerDocsScreenProps {
  return {
    error: null,
    swaggerJsonUrl: "https://api.gymrats.local/api/swagger",
    spec: {
      info: {
        title: "GymRats API",
        version: "1.0.0",
        description: "Contrato principal da plataforma",
      },
      servers: [{ url: "https://api.gymrats.local" }],
      tags: [
        {
          name: "auth",
          description: "Autenticacao e sessao",
        },
        {
          name: "students",
          description: "Fluxos do aluno",
        },
      ],
      paths: {
        "/api/auth/session": {
          get: {
            summary: "Current session",
            description: "Retorna os dados da sessao autenticada.",
            tags: ["auth"],
          },
        },
        "/api/students/bootstrap": {
          get: {
            summary: "Student bootstrap",
            description: "Entrega o bootstrap unificado do aluno.",
            tags: ["students"],
          },
        },
      },
    },
    ...overrides,
  };
}
