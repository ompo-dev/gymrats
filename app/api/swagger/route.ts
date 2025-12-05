import { NextResponse } from "next/server"

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export async function GET() {
  const swaggerSpec = {
    openapi: "3.0.0",
    info: {
      title: "Fitness App API",
      version: "1.0.0",
      description: "API completa para o sistema de fitness com autenticação, gerenciamento de usuários e muito mais",
      contact: {
        name: "Suporte API",
        email: "suporte@fitnessapp.com",
      },
    },
    servers: [
      {
        url: baseUrl,
        description: "Servidor de Desenvolvimento",
      },
    ],
    tags: [
      { name: "Autenticação", description: "Endpoints de autenticação e sessão" },
      { name: "Usuários", description: "Gerenciamento de usuários" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "auth_token",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Mensagem de erro",
            },
            details: {
              type: "string",
              description: "Detalhes do erro (apenas em desenvolvimento)",
            },
          },
        },
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "ID único do usuário",
            },
            email: {
              type: "string",
              format: "email",
              description: "Email do usuário",
            },
            name: {
              type: "string",
              description: "Nome completo do usuário",
            },
            userType: {
              type: "string",
              enum: ["student", "gym", null],
              description: "Tipo de usuário",
            },
            role: {
              type: "string",
              enum: ["STUDENT", "GYM", "ADMIN"],
              description: "Role do usuário",
            },
          },
        },
        Session: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "ID da sessão",
            },
            token: {
              type: "string",
              description: "Token de sessão",
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "usuario@email.com",
            },
            password: {
              type: "string",
              format: "password",
              minLength: 8,
              example: "senhaSegura123",
            },
          },
        },
        RegisterRequest: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: {
              type: "string",
              example: "João Silva",
            },
            email: {
              type: "string",
              format: "email",
              example: "joao@email.com",
            },
            password: {
              type: "string",
              format: "password",
              minLength: 8,
              example: "senhaSegura123",
            },
          },
        },
        UpdateRoleRequest: {
          type: "object",
          required: ["userId", "role", "userType"],
          properties: {
            userId: {
              type: "string",
              description: "ID do usuário",
            },
            role: {
              type: "string",
              enum: ["STUDENT", "GYM"],
              description: "Nova role do usuário",
            },
            userType: {
              type: "string",
              enum: ["student", "gym"],
              description: "Tipo de usuário",
            },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            user: {
              $ref: "#/components/schemas/User",
            },
            session: {
              $ref: "#/components/schemas/Session",
            },
          },
        },
        SuccessResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
          },
        },
      },
    },
    paths: {
      "/api/auth/sign-up": {
        post: {
          tags: ["Autenticação"],
          summary: "Criar nova conta",
          description: "Registra um novo usuário no sistema. A senha é automaticamente hasheada com bcrypt.",
          operationId: "signUp",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/RegisterRequest",
                },
                examples: {
                  student: {
                    value: {
                      name: "João Silva",
                      email: "joao@email.com",
                      password: "senhaSegura123",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Conta criada com sucesso",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/AuthResponse",
                  },
                  example: {
                    user: {
                      id: "clx1234567890",
                      email: "joao@email.com",
                      name: "João Silva",
                      role: "STUDENT",
                    },
                    session: {
                      token: "session-1234567890-abc123",
                    },
                  },
                },
              },
            },
            "400": {
              description: "Dados inválidos ou email já cadastrado",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                  examples: {
                    missingFields: {
                      value: {
                        error: "Nome, email e senha são obrigatórios",
                      },
                    },
                    shortPassword: {
                      value: {
                        error: "A senha deve ter no mínimo 8 caracteres",
                      },
                    },
                    duplicateEmail: {
                      value: {
                        error: "Este email já está cadastrado",
                      },
                    },
                  },
                },
              },
            },
            "500": {
              description: "Erro interno do servidor",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                },
              },
            },
          },
        },
      },
      "/api/auth/sign-in": {
        post: {
          tags: ["Autenticação"],
          summary: "Fazer login",
          description: "Autentica um usuário e retorna uma sessão. A senha é verificada usando bcrypt.",
          operationId: "signIn",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/LoginRequest",
                },
                examples: {
                  login: {
                    value: {
                      email: "joao@email.com",
                      password: "senhaSegura123",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Login realizado com sucesso",
              headers: {
                "Set-Cookie": {
                  schema: {
                    type: "string",
                  },
                  description: "Cookie de autenticação (auth_token)",
                },
              },
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/AuthResponse",
                  },
                  example: {
                    user: {
                      id: "clx1234567890",
                      email: "joao@email.com",
                      name: "João Silva",
                      userType: "student",
                      role: "STUDENT",
                    },
                    session: {
                      token: "session-1234567890-abc123",
                    },
                  },
                },
              },
            },
            "400": {
              description: "Dados inválidos",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                  example: {
                    error: "Email e senha são obrigatórios",
                  },
                },
              },
            },
            "401": {
              description: "Credenciais inválidas",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                  example: {
                    error: "Email ou senha incorretos",
                  },
                },
              },
            },
            "500": {
              description: "Erro interno do servidor",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                },
              },
            },
          },
        },
      },
      "/api/auth/session": {
        get: {
          tags: ["Autenticação"],
          summary: "Verificar sessão",
          description: "Retorna informações sobre a sessão atual do usuário autenticado.",
          operationId: "getSession",
          security: [
            { bearerAuth: [] },
            { cookieAuth: [] },
          ],
          responses: {
            "200": {
              description: "Sessão válida",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/AuthResponse",
                  },
                  example: {
                    user: {
                      id: "clx1234567890",
                      email: "joao@email.com",
                      name: "João Silva",
                      userType: "student",
                      role: "STUDENT",
                    },
                    session: {
                      id: "sess_123",
                      token: "session-1234567890-abc123",
                    },
                  },
                },
              },
            },
            "401": {
              description: "Não autenticado ou sessão inválida",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                  examples: {
                    noToken: {
                      value: {
                        error: "Token não fornecido",
                      },
                    },
                    invalidSession: {
                      value: {
                        error: "Sessão inválida ou expirada",
                      },
                    },
                  },
                },
              },
            },
            "500": {
              description: "Erro interno do servidor",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                },
              },
            },
          },
        },
      },
      "/api/auth/sign-out": {
        post: {
          tags: ["Autenticação"],
          summary: "Fazer logout",
          description: "Encerra a sessão atual do usuário, removendo o token do banco de dados e o cookie.",
          operationId: "signOut",
          security: [
            { bearerAuth: [] },
            { cookieAuth: [] },
          ],
          responses: {
            "200": {
              description: "Logout realizado com sucesso",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/SuccessResponse",
                  },
                  example: {
                    success: true,
                  },
                },
              },
            },
            "401": {
              description: "Token não fornecido",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                  example: {
                    error: "Token não fornecido",
                  },
                },
              },
            },
            "500": {
              description: "Erro interno do servidor",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                },
              },
            },
          },
        },
      },
      "/api/auth/update-role": {
        post: {
          tags: ["Usuários"],
          summary: "Atualizar tipo de usuário",
          description: "Atualiza o role e tipo de um usuário (STUDENT ou GYM). Cria os registros necessários (Student ou Gym) se não existirem.",
          operationId: "updateRole",
          security: [
            { bearerAuth: [] },
            { cookieAuth: [] },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/UpdateRoleRequest",
                },
                examples: {
                  student: {
                    value: {
                      userId: "clx1234567890",
                      role: "STUDENT",
                      userType: "student",
                    },
                  },
                  gym: {
                    value: {
                      userId: "clx1234567890",
                      role: "GYM",
                      userType: "gym",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Role atualizado com sucesso",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: {
                        type: "boolean",
                        example: true,
                      },
                      user: {
                        type: "object",
                        properties: {
                          id: {
                            type: "string",
                          },
                          role: {
                            type: "string",
                            enum: ["STUDENT", "GYM"],
                          },
                          userType: {
                            type: "string",
                            enum: ["student", "gym"],
                          },
                        },
                      },
                    },
                  },
                  example: {
                    success: true,
                    user: {
                      id: "clx1234567890",
                      role: "GYM",
                      userType: "gym",
                    },
                  },
                },
              },
            },
            "404": {
              description: "Usuário não encontrado",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                  example: {
                    error: "Usuário não encontrado",
                  },
                },
              },
            },
            "500": {
              description: "Erro interno do servidor",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                },
              },
            },
          },
        },
      },
    },
  }

  return NextResponse.json(swaggerSpec)
}

