import { NextResponse } from "next/server";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function GET() {
  const swaggerSpec = {
    openapi: "3.0.0",
    info: {
      title: "Fitness App API",
      version: "1.0.0",
      description:
        "API completa para o sistema de fitness com autenticação, gerenciamento de usuários e muito mais",
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
      {
        name: "Autenticação",
        description: "Endpoints de autenticação e sessão",
      },
      { name: "Usuários", description: "Gerenciamento de usuários" },
      { name: "Students", description: "Endpoints relacionados a alunos" },
      { name: "Gyms", description: "Endpoints relacionados a academias" },
      { name: "Workouts", description: "Endpoints de treinos e exercícios" },
      { name: "Nutrition", description: "Endpoints de nutrição" },
      { name: "Foods", description: "Endpoints de alimentos" },
      { name: "Subscriptions", description: "Assinaturas de alunos" },
      { name: "Gym Subscriptions", description: "Assinaturas de academias" },
      { name: "Payments", description: "Endpoints de pagamentos" },
      { name: "Memberships", description: "Endpoints de membros de academias" },
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
            role: {
              type: "string",
              enum: ["STUDENT", "GYM", "ADMIN"],
              description: "Role do usuário (fonte da verdade)",
            },
            hasGym: {
              type: "boolean",
              description: "Se o usuário tem perfil de academia",
            },
            hasStudent: {
              type: "boolean",
              description: "Se o usuário tem perfil de aluno",
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
          required: ["userId", "role"],
          properties: {
            userId: {
              type: "string",
              description: "ID do usuário",
            },
            role: {
              type: "string",
              enum: ["STUDENT", "GYM", "ADMIN"],
              description: "Nova role do usuário",
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
        StudentProfile: {
          type: "object",
          properties: {
            height: { type: "number", description: "Altura em cm" },
            weight: { type: "number", description: "Peso em kg" },
            fitnessLevel: {
              type: "string",
              enum: ["iniciante", "intermediario", "avancado"],
            },
            weeklyWorkoutFrequency: {
              type: "number",
              description: "Frequência semanal de treinos",
            },
            goals: { type: "array", items: { type: "string" } },
          },
        },
        WeightHistory: {
          type: "object",
          properties: {
            date: { type: "string", format: "date-time" },
            weight: { type: "number" },
            notes: { type: "string", nullable: true },
          },
        },
        Gym: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            address: { type: "string" },
            email: { type: "string", format: "email" },
            plan: { type: "string", enum: ["basic", "premium", "enterprise"] },
            isActive: { type: "boolean" },
          },
        },
        Workout: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            type: {
              type: "string",
              enum: ["strength", "cardio", "flexibility", "rest"],
            },
            difficulty: {
              type: "string",
              enum: ["iniciante", "intermediario", "avancado"],
            },
            xpReward: { type: "number" },
            estimatedTime: {
              type: "number",
              description: "Tempo estimado em minutos",
            },
          },
        },
        Subscription: {
          type: "object",
          properties: {
            id: { type: "string" },
            plan: { type: "string", enum: ["premium", "monthly", "annual"] },
            status: {
              type: "string",
              enum: ["active", "trialing", "canceled", "past_due"],
            },
            currentPeriodStart: { type: "string", format: "date-time" },
            currentPeriodEnd: { type: "string", format: "date-time" },
          },
        },
        Payment: {
          type: "object",
          properties: {
            id: { type: "string" },
            amount: { type: "number" },
            date: { type: "string", format: "date-time" },
            status: {
              type: "string",
              enum: ["paid", "pending", "overdue", "canceled"],
            },
            paymentMethod: {
              type: "string",
              enum: ["credit-card", "debit-card", "pix", "cash"],
            },
          },
        },
        NutritionMeal: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            type: {
              type: "string",
              enum: ["breakfast", "lunch", "dinner", "snack"],
            },
            calories: { type: "number" },
            protein: { type: "number" },
            carbs: { type: "number" },
            fats: { type: "number" },
            time: { type: "string", format: "date-time", nullable: true },
            completed: { type: "boolean" },
            foods: {
              type: "array",
              items: { $ref: "#/components/schemas/NutritionFoodItem" },
            },
          },
        },
        NutritionFoodItem: {
          type: "object",
          properties: {
            id: { type: "string" },
            foodId: { type: "string", nullable: true },
            foodName: { type: "string" },
            servings: { type: "number" },
            calories: { type: "number" },
            protein: { type: "number" },
            carbs: { type: "number" },
            fats: { type: "number" },
            servingSize: { type: "string" },
          },
        },
        DailyNutrition: {
          type: "object",
          properties: {
            date: { type: "string", format: "date-time" },
            meals: {
              type: "array",
              items: { $ref: "#/components/schemas/NutritionMeal" },
            },
            totalCalories: { type: "number" },
            totalProtein: { type: "number" },
            totalCarbs: { type: "number" },
            totalFats: { type: "number" },
            waterIntake: { type: "number" },
            targetCalories: { type: "number" },
            targetProtein: { type: "number" },
            targetCarbs: { type: "number" },
            targetFats: { type: "number" },
            targetWater: { type: "number" },
          },
        },
        FoodItem: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            calories: { type: "number" },
            protein: { type: "number" },
            carbs: { type: "number" },
            fats: { type: "number" },
            servingSize: { type: "string" },
            category: {
              type: "string",
              enum: [
                "protein",
                "carbs",
                "vegetables",
                "fruits",
                "fats",
                "dairy",
                "snacks",
              ],
            },
            image: { type: "string", nullable: true },
          },
        },
        Membership: {
          type: "object",
          properties: {
            id: { type: "string" },
            gymId: { type: "string" },
            gymName: { type: "string" },
            planName: { type: "string", nullable: true },
            startDate: { type: "string", format: "date-time" },
            endDate: { type: "string", format: "date-time", nullable: true },
            status: { type: "string", enum: ["active", "expired", "canceled"] },
            autoRenew: { type: "boolean" },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: "Não autenticado ou sessão inválida",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              example: { error: "Não autenticado" },
            },
          },
        },
        BadRequestError: {
          description: "Dados inválidos",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              example: { error: "Dados inválidos" },
            },
          },
        },
        NotFoundError: {
          description: "Recurso não encontrado",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              example: { error: "Recurso não encontrado" },
            },
          },
        },
        InternalError: {
          description: "Erro interno do servidor",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        SuccessResponse: {
          description: "Operação realizada com sucesso",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SuccessResponse" },
            },
          },
        },
      },
    },
    paths: {
      // ============================================
      // STUDENTS ENDPOINTS
      // ============================================
      "/api/students/all": {
        get: {
          tags: ["Students"],
          summary: "Buscar todos os dados do student",
          description:
            "Retorna todos os dados do student ou seções específicas via query params",
          operationId: "getAllStudentData",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          parameters: [
            {
              name: "sections",
              in: "query",
              description:
                "Seções específicas para buscar (ex: progress,profile,workouts)",
              required: false,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Dados do student",
              content: {
                "application/json": {
                  schema: { type: "object" },
                },
              },
            },
            "401": { $ref: "#/components/responses/UnauthorizedError" },
            "500": { $ref: "#/components/responses/InternalError" },
          },
        },
      },
      "/api/students/profile": {
        get: {
          tags: ["Students"],
          summary: "Buscar perfil do student",
          description: "Verifica se o student tem perfil completo",
          operationId: "getStudentProfile",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          responses: {
            "200": {
              description: "Perfil do student",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      hasProfile: { type: "boolean" },
                      profile: { $ref: "#/components/schemas/StudentProfile" },
                    },
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/UnauthorizedError" },
          },
        },
        post: {
          tags: ["Students"],
          summary: "Criar/atualizar perfil do student",
          description: "Cria ou atualiza o perfil completo do student",
          operationId: "updateStudentProfile",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StudentProfile" },
              },
            },
          },
          responses: {
            "200": { $ref: "#/components/responses/SuccessResponse" },
            "400": { $ref: "#/components/responses/BadRequestError" },
            "401": { $ref: "#/components/responses/UnauthorizedError" },
          },
        },
      },
      "/api/students/weight": {
        get: {
          tags: ["Students"],
          summary: "Buscar histórico de peso",
          description: "Retorna histórico de peso com paginação",
          operationId: "getWeightHistory",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          parameters: [
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 30 },
            },
            {
              name: "offset",
              in: "query",
              schema: { type: "integer", default: 0 },
            },
          ],
          responses: {
            "200": {
              description: "Histórico de peso",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      history: {
                        type: "array",
                        items: { $ref: "#/components/schemas/WeightHistory" },
                      },
                      total: { type: "integer" },
                    },
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/UnauthorizedError" },
          },
        },
        post: {
          tags: ["Students"],
          summary: "Adicionar peso",
          description: "Adiciona uma nova entrada de peso",
          operationId: "addWeight",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["weight"],
                  properties: {
                    weight: { type: "number", minimum: 0 },
                    date: { type: "string", format: "date-time" },
                    notes: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { $ref: "#/components/responses/SuccessResponse" },
            "400": { $ref: "#/components/responses/BadRequestError" },
            "401": { $ref: "#/components/responses/UnauthorizedError" },
          },
        },
      },
      "/api/students/progress": {
        get: {
          tags: ["Students"],
          summary: "Buscar progresso do student",
          description: "Retorna progresso completo (XP, streaks, achievements, weeklyXP)",
          operationId: "getStudentProgress",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          responses: {
            "200": {
              description: "Progresso do student",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      currentStreak: { type: "integer" },
                      longestStreak: { type: "integer" },
                      totalXP: { type: "integer" },
                      currentLevel: { type: "integer" },
                      xpToNextLevel: { type: "integer" },
                      workoutsCompleted: { type: "integer" },
                      todayXP: { type: "integer" },
                      achievements: {
                        type: "array",
                        items: { type: "object" },
                      },
                      lastActivityDate: { type: "string", format: "date-time" },
                      dailyGoalXP: { type: "integer" },
                      weeklyXP: {
                        type: "array",
                        items: { type: "integer" },
                        maxItems: 7,
                      },
                    },
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/UnauthorizedError" },
            "500": { $ref: "#/components/responses/InternalError" },
          },
        },
      },
      "/api/students/student": {
        get: {
          tags: ["Students"],
          summary: "Buscar informações básicas do student",
          description: "Retorna informações básicas (id, age, gender, phone, avatar)",
          operationId: "getStudentInfo",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          responses: {
            "200": {
              description: "Informações do student",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      age: { type: "integer", nullable: true },
                      gender: { type: "string", nullable: true },
                      phone: { type: "string", nullable: true },
                      avatar: { type: "string", nullable: true },
                    },
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/UnauthorizedError" },
            "500": { $ref: "#/components/responses/InternalError" },
          },
        },
      },
      "/api/students/personal-records": {
        get: {
          tags: ["Students"],
          summary: "Buscar personal records",
          description: "Retorna os personal records do student",
          operationId: "getPersonalRecords",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          responses: {
            "200": {
              description: "Personal records",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      records: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            exerciseId: { type: "string" },
                            exerciseName: { type: "string" },
                            type: {
                              type: "string",
                              enum: ["max-weight", "max-reps", "max-volume"],
                            },
                            value: { type: "number" },
                            date: { type: "string", format: "date-time" },
                            previousBest: { type: "number", nullable: true },
                          },
                        },
                      },
                      total: { type: "integer" },
                    },
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/UnauthorizedError" },
            "500": { $ref: "#/components/responses/InternalError" },
          },
        },
      },
      "/api/students/day-passes": {
        get: {
          tags: ["Students"],
          summary: "Buscar day passes",
          description: "Retorna os day passes do student",
          operationId: "getDayPasses",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          responses: {
            "200": {
              description: "Day passes",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      dayPasses: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            gymId: { type: "string" },
                            gymName: { type: "string" },
                            purchaseDate: { type: "string", format: "date-time" },
                            validDate: { type: "string", format: "date-time" },
                            price: { type: "number" },
                            status: { type: "string" },
                            qrCode: { type: "string", nullable: true },
                          },
                        },
                      },
                      total: { type: "integer" },
                    },
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/UnauthorizedError" },
            "500": { $ref: "#/components/responses/InternalError" },
          },
        },
      },
      "/api/students/friends": {
        get: {
          tags: ["Students"],
          summary: "Buscar amigos",
          description: "Retorna a lista de amigos do student",
          operationId: "getFriends",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          responses: {
            "200": {
              description: "Lista de amigos",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      count: { type: "integer" },
                      list: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            name: { type: "string" },
                            avatar: { type: "string", nullable: true },
                            username: { type: "string", nullable: true },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/UnauthorizedError" },
            "500": { $ref: "#/components/responses/InternalError" },
          },
        },
      },
      // ============================================
      // GYMS ENDPOINTS
      // ============================================
      "/api/gyms/list": {
        get: {
          tags: ["Gyms"],
          summary: "Listar academias do usuário",
          description: "Retorna todas as academias do usuário autenticado",
          operationId: "listGyms",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          responses: {
            "200": {
              description: "Lista de academias",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      gyms: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Gym" },
                      },
                      totalGyms: { type: "integer" },
                      canCreateMultipleGyms: { type: "boolean" },
                    },
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/UnauthorizedError" },
          },
        },
      },
      "/api/gyms/create": {
        post: {
          tags: ["Gyms"],
          summary: "Criar nova academia",
          description: "Cria uma nova academia para o usuário",
          operationId: "createGym",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "address", "phone", "email"],
                  properties: {
                    name: { type: "string" },
                    address: { type: "string" },
                    phone: { type: "string" },
                    email: { type: "string", format: "email" },
                    cnpj: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Academia criada com sucesso",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      gym: { $ref: "#/components/schemas/Gym" },
                    },
                  },
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequestError" },
            "401": { $ref: "#/components/responses/UnauthorizedError" },
          },
        },
      },
      "/api/gyms/profile": {
        get: {
          tags: ["Gyms"],
          summary: "Buscar perfil da academia",
          description:
            "Retorna o perfil completo da academia do usuário autenticado",
          operationId: "getGymProfile",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          responses: {
            "200": {
              description: "Perfil da academia",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      hasProfile: { type: "boolean" },
                      profile: {
                        type: "object",
                        nullable: true,
                        properties: {
                          name: { type: "string" },
                          address: { type: "string" },
                          phone: { type: "string" },
                          email: { type: "string", format: "email" },
                          cnpj: { type: "string", nullable: true },
                          equipmentCount: { type: "number" },
                        },
                      },
                    },
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/UnauthorizedError" },
            "500": { $ref: "#/components/responses/InternalError" },
          },
        },
      },
      "/api/gyms/set-active": {
        post: {
          tags: ["Gyms"],
          summary: "Definir academia ativa",
          description:
            "Define qual academia será usada como ativa para o usuário",
          operationId: "setActiveGym",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["gymId"],
                  properties: {
                    gymId: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { $ref: "#/components/responses/SuccessResponse" },
            "400": { $ref: "#/components/responses/BadRequestError" },
            "401": { $ref: "#/components/responses/UnauthorizedError" },
            "404": { $ref: "#/components/responses/NotFoundError" },
          },
        },
      },
      "/api/gyms/locations": {
        get: {
          tags: ["Gyms"],
          summary: "Buscar localizações das academias",
          description:
            "Retorna as localizações (endereços) de todas as academias do usuário",
          operationId: "getGymLocations",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          responses: {
            "200": {
              description: "Lista de localizações",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      locations: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            name: { type: "string" },
                            address: { type: "string" },
                            isActive: { type: "boolean" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/UnauthorizedError" },
            "500": { $ref: "#/components/responses/InternalError" },
          },
        },
      },
      // ============================================
      // WORKOUTS ENDPOINTS
      // ============================================
      "/api/workouts/units": {
        get: {
          tags: ["Workouts"],
          summary: "Buscar units e workouts",
          description:
            "Retorna todas as units com workouts, exercícios e status de conclusão",
          operationId: "getUnits",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          responses: {
            "200": {
              description: "Units e workouts",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      units: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            title: { type: "string" },
                            workouts: {
                              type: "array",
                              items: { $ref: "#/components/schemas/Workout" },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/UnauthorizedError" },
          },
        },
      },
      "/api/workouts/{id}/complete": {
        post: {
          tags: ["Workouts"],
          summary: "Completar workout",
          description: "Marca um workout como completado e atualiza progresso",
          operationId: "completeWorkout",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    exerciseLogs: { type: "array" },
                    duration: { type: "number" },
                    totalVolume: { type: "number" },
                    overallFeedback: {
                      type: "string",
                      enum: ["excelente", "bom", "regular", "ruim"],
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": { $ref: "#/components/responses/SuccessResponse" },
            "400": { $ref: "#/components/responses/BadRequestError" },
            "401": { $ref: "#/components/responses/UnauthorizedError" },
            "404": { $ref: "#/components/responses/NotFoundError" },
          },
        },
      },
      "/api/workouts/{id}/progress": {
        get: {
          tags: ["Workouts"],
          summary: "Buscar progresso do workout",
          description: "Retorna o progresso salvo de um workout específico",
          operationId: "getWorkoutProgress",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Progresso do workout",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      progress: {
                        type: "object",
                        nullable: true,
                        properties: {
                          currentExerciseIndex: { type: "number" },
                          exerciseLogs: { type: "array" },
                          skippedExercises: { type: "array" },
                          selectedAlternatives: { type: "object" },
                          xpEarned: { type: "number" },
                          totalVolume: { type: "number" },
                          completionPercentage: { type: "number" },
                          startTime: { type: "string", format: "date-time" },
                          cardioPreference: { type: "string" },
                          cardioDuration: { type: "number" },
                          selectedCardioType: { type: "string" },
                        },
                      },
                      message: { type: "string", nullable: true },
                    },
                  },
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequestError" },
            "401": { $ref: "#/components/responses/UnauthorizedError" },
          },
        },
        post: {
          tags: ["Workouts"],
          summary: "Salvar progresso do workout",
          description: "Salva o progresso atual de um workout em andamento",
          operationId: "saveWorkoutProgress",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    currentExerciseIndex: { type: "number" },
                    exerciseLogs: { type: "array" },
                    skippedExercises: { type: "array" },
                    selectedAlternatives: { type: "object" },
                    xpEarned: { type: "number" },
                    totalVolume: { type: "number" },
                    completionPercentage: { type: "number" },
                    startTime: { type: "string", format: "date-time" },
                    cardioPreference: { type: "string" },
                    cardioDuration: { type: "number" },
                    selectedCardioType: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { $ref: "#/components/responses/SuccessResponse" },
            "400": { $ref: "#/components/responses/BadRequestError" },
            "401": { $ref: "#/components/responses/UnauthorizedError" },
          },
        },
        delete: {
          tags: ["Workouts"],
          summary: "Deletar progresso do workout",
          description: "Remove o progresso salvo de um workout",
          operationId: "deleteWorkoutProgress",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": { $ref: "#/components/responses/SuccessResponse" },
            "400": { $ref: "#/components/responses/BadRequestError" },
            "401": { $ref: "#/components/responses/UnauthorizedError" },
            "404": { $ref: "#/components/responses/NotFoundError" },
          },
        },
      },
      "/api/workouts/history": {
        get: {
          tags: ["Workouts"],
          summary: "Buscar histórico de workouts",
          description:
            "Retorna o histórico de workouts completados pelo student",
          operationId: "getWorkoutHistory",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          parameters: [
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 10 },
            },
            {
              name: "offset",
              in: "query",
              schema: { type: "integer", default: 0 },
            },
          ],
          responses: {
            "200": {
              description: "Histórico de workouts",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      history: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            workoutId: { type: "string" },
                            workoutTitle: { type: "string" },
                            workoutType: { type: "string" },
                            date: { type: "string", format: "date-time" },
                            duration: { type: "number" },
                            totalVolume: { type: "number" },
                            xpEarned: { type: "number" },
                            overallFeedback: { type: "string" },
                            exercises: { type: "array" },
                          },
                        },
                      },
                      total: { type: "integer" },
                    },
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/UnauthorizedError" },
          },
        },
      },
      // ============================================
      // SUBSCRIPTIONS ENDPOINTS
      // ============================================
      "/api/subscriptions/current": {
        get: {
          tags: ["Subscriptions"],
          summary: "Buscar assinatura atual",
          description: "Retorna a assinatura atual do student",
          operationId: "getCurrentSubscription",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          responses: {
            "200": {
              description: "Assinatura atual",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      subscription: {
                        $ref: "#/components/schemas/Subscription",
                      },
                    },
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/UnauthorizedError" },
          },
        },
      },
      "/api/subscriptions/create": {
        post: {
          tags: ["Subscriptions"],
          summary: "Criar assinatura",
          description: "Cria uma nova assinatura para o student",
          operationId: "createSubscription",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["plan"],
                  properties: {
                    plan: { type: "string", enum: ["monthly", "annual"] },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Assinatura criada",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      billingUrl: { type: "string" },
                      billingId: { type: "string" },
                    },
                  },
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequestError" },
            "401": { $ref: "#/components/responses/UnauthorizedError" },
          },
        },
      },
      "/api/subscriptions/start-trial": {
        post: {
          tags: ["Subscriptions"],
          summary: "Iniciar trial",
          description: "Inicia um período de trial gratuito para o student",
          operationId: "startTrial",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          responses: {
            "200": {
              description: "Trial iniciado",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      subscription: {
                        $ref: "#/components/schemas/Subscription",
                      },
                    },
                  },
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequestError" },
            "401": { $ref: "#/components/responses/UnauthorizedError" },
          },
        },
      },
      "/api/subscriptions/cancel": {
        post: {
          tags: ["Subscriptions"],
          summary: "Cancelar assinatura",
          description: "Cancela a assinatura atual do student",
          operationId: "cancelSubscription",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          responses: {
            "200": { $ref: "#/components/responses/SuccessResponse" },
            "400": { $ref: "#/components/responses/BadRequestError" },
            "401": { $ref: "#/components/responses/UnauthorizedError" },
          },
        },
      },
      // ============================================
      // GYM SUBSCRIPTIONS ENDPOINTS
      // ============================================
      "/api/gym-subscriptions/current": {
        get: {
          tags: ["Gym Subscriptions"],
          summary: "Buscar assinatura atual da gym",
          description: "Retorna a assinatura atual da gym autenticada",
          operationId: "getCurrentGymSubscription",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          responses: {
            "200": {
              description: "Assinatura atual da gym",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      subscription: {
                        $ref: "#/components/schemas/Subscription",
                      },
                    },
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/UnauthorizedError" },
            "500": { $ref: "#/components/responses/InternalError" },
          },
        },
      },
      "/api/gym-subscriptions/create": {
        post: {
          tags: ["Gym Subscriptions"],
          summary: "Criar assinatura para gym",
          description: "Cria uma nova assinatura para a gym autenticada",
          operationId: "createGymSubscription",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["plan"],
                  properties: {
                    plan: {
                      type: "string",
                      enum: ["basic", "premium", "enterprise"],
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Assinatura criada",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      billingUrl: { type: "string" },
                      billingId: { type: "string" },
                    },
                  },
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequestError" },
            "401": { $ref: "#/components/responses/UnauthorizedError" },
            "500": { $ref: "#/components/responses/InternalError" },
          },
        },
      },
      "/api/gym-subscriptions/start-trial": {
        post: {
          tags: ["Gym Subscriptions"],
          summary: "Iniciar trial para gym",
          description: "Inicia um período de trial gratuito para a gym",
          operationId: "startGymTrial",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          responses: {
            "200": {
              description: "Trial iniciado",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      subscription: {
                        $ref: "#/components/schemas/Subscription",
                      },
                    },
                  },
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequestError" },
            "401": { $ref: "#/components/responses/UnauthorizedError" },
            "500": { $ref: "#/components/responses/InternalError" },
          },
        },
      },
      "/api/gym-subscriptions/cancel": {
        post: {
          tags: ["Gym Subscriptions"],
          summary: "Cancelar assinatura da gym",
          description: "Cancela a assinatura atual da gym",
          operationId: "cancelGymSubscription",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          responses: {
            "200": { $ref: "#/components/responses/SuccessResponse" },
            "400": { $ref: "#/components/responses/BadRequestError" },
            "401": { $ref: "#/components/responses/UnauthorizedError" },
            "500": { $ref: "#/components/responses/InternalError" },
          },
        },
      },
      // ============================================
      // PAYMENTS ENDPOINTS
      // ============================================
      "/api/payments": {
        get: {
          tags: ["Payments"],
          summary: "Buscar histórico de pagamentos",
          description: "Retorna histórico de pagamentos do student",
          operationId: "getPayments",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          parameters: [
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 20 },
            },
            {
              name: "offset",
              in: "query",
              schema: { type: "integer", default: 0 },
            },
          ],
          responses: {
            "200": {
              description: "Histórico de pagamentos",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      payments: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Payment" },
                      },
                      total: { type: "integer" },
                    },
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/UnauthorizedError" },
          },
        },
      },
      "/api/payment-methods": {
        get: {
          tags: ["Payments"],
          summary: "Buscar métodos de pagamento",
          description: "Retorna métodos de pagamento do usuário",
          operationId: "getPaymentMethods",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          responses: {
            "200": {
              description: "Métodos de pagamento",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      paymentMethods: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            type: {
                              type: "string",
                              enum: ["credit-card", "debit-card", "pix"],
                            },
                            isDefault: { type: "boolean" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/UnauthorizedError" },
          },
        },
        post: {
          tags: ["Payments"],
          summary: "Adicionar método de pagamento",
          description: "Adiciona um novo método de pagamento",
          operationId: "addPaymentMethod",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["type"],
                  properties: {
                    type: {
                      type: "string",
                      enum: ["credit-card", "debit-card", "pix"],
                    },
                    isDefault: { type: "boolean" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { $ref: "#/components/responses/SuccessResponse" },
            "400": { $ref: "#/components/responses/BadRequestError" },
            "401": { $ref: "#/components/responses/UnauthorizedError" },
          },
        },
      },
      "/api/workouts/history/{historyId}/exercises/{exerciseId}": {
        put: {
          tags: ["Workouts"],
          summary: "Atualizar exercício em workout completado",
          description:
            "Atualiza um exercício específico em um workout já completado. Útil para corrigir carga, séries ou outros dados que foram registrados incorretamente.",
          operationId: "updateExerciseLog",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          parameters: [
            {
              name: "historyId",
              in: "path",
              required: true,
              description: "ID do histórico do workout",
              schema: { type: "string" },
            },
            {
              name: "exerciseId",
              in: "path",
              required: true,
              description: "ID do exercício (ExerciseLog)",
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    sets: {
                      type: "array",
                      description: "Array de séries do exercício",
                      items: {
                        type: "object",
                        properties: {
                          weight: { type: "number", description: "Peso em kg" },
                          reps: {
                            type: "number",
                            description: "Número de repetições",
                          },
                          completed: {
                            type: "boolean",
                            description: "Se a série foi completada",
                          },
                          rest: {
                            type: "number",
                            description: "Tempo de descanso em segundos",
                          },
                        },
                      },
                    },
                    notes: {
                      type: "string",
                      nullable: true,
                      description: "Notas sobre o exercício",
                    },
                    formCheckScore: {
                      type: "number",
                      nullable: true,
                      description: "Pontuação da forma (0-100)",
                      minimum: 0,
                      maximum: 100,
                    },
                    difficulty: {
                      type: "string",
                      nullable: true,
                      description: "Dificuldade percebida",
                      enum: ["fácil", "médio", "difícil"],
                    },
                  },
                },
                example: {
                  sets: [
                    { weight: 50, reps: 12, completed: true, rest: 60 },
                    { weight: 50, reps: 10, completed: true, rest: 60 },
                    { weight: 45, reps: 8, completed: true, rest: 60 },
                  ],
                  notes: "Corrigido: carga estava errada",
                  formCheckScore: 85,
                  difficulty: "médio",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Exercício atualizado com sucesso",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      exerciseLog: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          exerciseId: { type: "string" },
                          exerciseName: { type: "string" },
                          sets: { type: "array" },
                          notes: { type: "string", nullable: true },
                          formCheckScore: { type: "number", nullable: true },
                          difficulty: { type: "string", nullable: true },
                        },
                      },
                      totalVolume: {
                        type: "number",
                        description: "Volume total recalculado do workout",
                      },
                    },
                  },
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequestError" },
            "401": { $ref: "#/components/responses/UnauthorizedError" },
            "404": { $ref: "#/components/responses/NotFoundError" },
            "500": { $ref: "#/components/responses/InternalError" },
          },
        },
        patch: {
          tags: ["Workouts"],
          summary: "Atualizar exercício em workout completado (parcial)",
          description:
            "Atualiza parcialmente um exercício específico em um workout já completado. Permite atualizar apenas os campos fornecidos.",
          operationId: "updateExerciseLogPartial",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          parameters: [
            {
              name: "historyId",
              in: "path",
              required: true,
              description: "ID do histórico do workout",
              schema: { type: "string" },
            },
            {
              name: "exerciseId",
              in: "path",
              required: true,
              description: "ID do exercício (ExerciseLog)",
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  description: "Apenas os campos que deseja atualizar",
                  properties: {
                    sets: { type: "array", items: { type: "object" } },
                    notes: { type: "string", nullable: true },
                    formCheckScore: { type: "number", nullable: true },
                    difficulty: { type: "string", nullable: true },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Exercício atualizado com sucesso",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      exerciseLog: { type: "object" },
                      totalVolume: { type: "number" },
                    },
                  },
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequestError" },
            "401": { $ref: "#/components/responses/UnauthorizedError" },
            "404": { $ref: "#/components/responses/NotFoundError" },
            "500": { $ref: "#/components/responses/InternalError" },
          },
        },
      },
      "/api/workouts/{id}/progress/exercises/{exerciseId}": {
        put: {
          tags: ["Workouts"],
          summary: "Atualizar exercício no progresso atual",
          description:
            "Atualiza um exercício específico no progresso atual de um workout em andamento. Útil para corrigir carga, séries ou outros dados antes de completar o workout.",
          operationId: "updateWorkoutProgressExercise",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "ID do workout",
              schema: { type: "string" },
            },
            {
              name: "exerciseId",
              in: "path",
              required: true,
              description: "ID do exercício (exerciseId ou id do log)",
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    sets: {
                      type: "array",
                      description: "Array de séries do exercício",
                      items: {
                        type: "object",
                        properties: {
                          weight: { type: "number", description: "Peso em kg" },
                          reps: {
                            type: "number",
                            description: "Número de repetições",
                          },
                          completed: {
                            type: "boolean",
                            description: "Se a série foi completada",
                          },
                          rest: {
                            type: "number",
                            description: "Tempo de descanso em segundos",
                          },
                        },
                      },
                    },
                    notes: {
                      type: "string",
                      nullable: true,
                      description: "Notas sobre o exercício",
                    },
                    formCheckScore: {
                      type: "number",
                      nullable: true,
                      description: "Pontuação da forma (0-100)",
                      minimum: 0,
                      maximum: 100,
                    },
                    difficulty: {
                      type: "string",
                      nullable: true,
                      description: "Dificuldade percebida",
                      enum: ["fácil", "médio", "difícil"],
                    },
                  },
                },
                example: {
                  sets: [
                    { weight: 50, reps: 12, completed: true, rest: 60 },
                    { weight: 50, reps: 10, completed: true, rest: 60 },
                  ],
                  notes: "Corrigido: esqueci de adicionar a carga",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Exercício atualizado com sucesso",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      exerciseLog: {
                        type: "object",
                        description: "Exercício atualizado",
                      },
                      totalVolume: {
                        type: "number",
                        description: "Volume total recalculado do workout",
                      },
                    },
                  },
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequestError" },
            "401": { $ref: "#/components/responses/UnauthorizedError" },
            "404": { $ref: "#/components/responses/NotFoundError" },
            "500": { $ref: "#/components/responses/InternalError" },
          },
        },
        patch: {
          tags: ["Workouts"],
          summary: "Atualizar exercício no progresso atual (parcial)",
          description:
            "Atualiza parcialmente um exercício específico no progresso atual de um workout em andamento. Permite atualizar apenas os campos fornecidos.",
          operationId: "updateWorkoutProgressExercisePartial",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "ID do workout",
              schema: { type: "string" },
            },
            {
              name: "exerciseId",
              in: "path",
              required: true,
              description: "ID do exercício (exerciseId ou id do log)",
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  description: "Apenas os campos que deseja atualizar",
                  properties: {
                    sets: { type: "array", items: { type: "object" } },
                    notes: { type: "string", nullable: true },
                    formCheckScore: { type: "number", nullable: true },
                    difficulty: { type: "string", nullable: true },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Exercício atualizado com sucesso",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      exerciseLog: { type: "object" },
                      totalVolume: { type: "number" },
                    },
                  },
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequestError" },
            "401": { $ref: "#/components/responses/UnauthorizedError" },
            "404": { $ref: "#/components/responses/NotFoundError" },
            "500": { $ref: "#/components/responses/InternalError" },
          },
        },
      },
      // ============================================
      // NUTRITION ENDPOINTS
      // ============================================
      "/api/nutrition/daily": {
        get: {
          tags: ["Nutrition"],
          summary: "Buscar nutrição do dia",
          description:
            "Retorna a nutrição diária do student, incluindo refeições, totais e metas",
          operationId: "getDailyNutrition",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          parameters: [
            {
              name: "date",
              in: "query",
              description:
                "Data no formato ISO (ex: 2024-01-15). Se não fornecido, usa a data atual",
              required: false,
              schema: { type: "string", format: "date-time" },
            },
          ],
          responses: {
            "200": {
              description: "Nutrição do dia",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/DailyNutrition" },
                  example: {
                    date: "2024-01-15T00:00:00.000Z",
                    meals: [
                      {
                        id: "meal_123",
                        name: "Café da Manhã",
                        type: "breakfast",
                        calories: 450,
                        protein: 25,
                        carbs: 50,
                        fats: 15,
                        time: "2024-01-15T08:00:00.000Z",
                        completed: true,
                        foods: [
                          {
                            id: "food_123",
                            foodId: "food_item_123",
                            foodName: "Ovos",
                            servings: 2,
                            calories: 150,
                            protein: 12,
                            carbs: 1,
                            fats: 10,
                            servingSize: "1 unidade",
                          },
                        ],
                      },
                    ],
                    totalCalories: 450,
                    totalProtein: 25,
                    totalCarbs: 50,
                    totalFats: 15,
                    waterIntake: 500,
                    targetCalories: 2000,
                    targetProtein: 150,
                    targetCarbs: 250,
                    targetFats: 65,
                    targetWater: 3000,
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/UnauthorizedError" },
            "500": { $ref: "#/components/responses/InternalError" },
          },
        },
        post: {
          tags: ["Nutrition"],
          summary: "Atualizar nutrição do dia",
          description:
            "Cria ou atualiza a nutrição diária do student, incluindo refeições e alimentos",
          operationId: "updateDailyNutrition",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    date: { type: "string", format: "date-time" },
                    meals: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          type: {
                            type: "string",
                            enum: ["breakfast", "lunch", "dinner", "snack"],
                          },
                          calories: { type: "number" },
                          protein: { type: "number" },
                          carbs: { type: "number" },
                          fats: { type: "number" },
                          time: { type: "string", format: "date-time" },
                          completed: { type: "boolean" },
                          order: { type: "number" },
                          foods: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                foodId: { type: "string", nullable: true },
                                foodName: { type: "string" },
                                servings: { type: "number" },
                                calories: { type: "number" },
                                protein: { type: "number" },
                                carbs: { type: "number" },
                                fats: { type: "number" },
                                servingSize: { type: "string" },
                              },
                            },
                          },
                        },
                      },
                    },
                    waterIntake: { type: "number" },
                  },
                },
                example: {
                  date: "2024-01-15T00:00:00.000Z",
                  meals: [
                    {
                      name: "Café da Manhã",
                      type: "breakfast",
                      calories: 450,
                      protein: 25,
                      carbs: 50,
                      fats: 15,
                      time: "2024-01-15T08:00:00.000Z",
                      completed: true,
                      order: 0,
                      foods: [
                        {
                          foodId: "food_item_123",
                          foodName: "Ovos",
                          servings: 2,
                          calories: 150,
                          protein: 12,
                          carbs: 1,
                          fats: 10,
                          servingSize: "1 unidade",
                        },
                      ],
                    },
                  ],
                  waterIntake: 500,
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Nutrição atualizada com sucesso",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      dailyNutritionId: { type: "string" },
                    },
                  },
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequestError" },
            "401": { $ref: "#/components/responses/UnauthorizedError" },
            "500": { $ref: "#/components/responses/InternalError" },
          },
        },
        put: {
          tags: ["Nutrition"],
          summary: "Atualizar nutrição do dia (PUT)",
          description:
            "Cria ou atualiza completamente a nutrição diária do student. Útil para substituir todos os dados de uma vez.",
          operationId: "updateDailyNutritionPut",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    date: { type: "string", format: "date-time" },
                    meals: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          type: {
                            type: "string",
                            enum: ["breakfast", "lunch", "dinner", "snack"],
                          },
                          calories: { type: "number" },
                          protein: { type: "number" },
                          carbs: { type: "number" },
                          fats: { type: "number" },
                          time: { type: "string", format: "date-time" },
                          completed: { type: "boolean" },
                          order: { type: "number" },
                          foods: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                foodId: { type: "string", nullable: true },
                                foodName: { type: "string" },
                                servings: { type: "number" },
                                calories: { type: "number" },
                                protein: { type: "number" },
                                carbs: { type: "number" },
                                fats: { type: "number" },
                                servingSize: { type: "string" },
                              },
                            },
                          },
                        },
                      },
                    },
                    waterIntake: { type: "number" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Nutrição atualizada com sucesso",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      dailyNutritionId: { type: "string" },
                    },
                  },
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequestError" },
            "401": { $ref: "#/components/responses/UnauthorizedError" },
            "500": { $ref: "#/components/responses/InternalError" },
          },
        },
        patch: {
          tags: ["Nutrition"],
          summary: "Atualizar nutrição do dia (PATCH - parcial)",
          description:
            "Atualiza parcialmente a nutrição diária do student. Permite atualizar apenas os campos fornecidos (ex: apenas waterIntake ou apenas uma refeição específica).",
          operationId: "updateDailyNutritionPatch",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  description: "Apenas os campos que deseja atualizar",
                  properties: {
                    date: { type: "string", format: "date-time" },
                    meals: {
                      type: "array",
                      description:
                        "Array completo de refeições (substitui todas as refeições)",
                      items: { type: "object" },
                    },
                    waterIntake: {
                      type: "number",
                      description: "Apenas atualizar consumo de água",
                    },
                  },
                },
                example: {
                  waterIntake: 1000,
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Nutrição atualizada com sucesso",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      dailyNutritionId: { type: "string" },
                    },
                  },
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequestError" },
            "401": { $ref: "#/components/responses/UnauthorizedError" },
            "500": { $ref: "#/components/responses/InternalError" },
          },
        },
      },
      // ============================================
      // FOODS ENDPOINTS
      // ============================================
      "/api/foods/search": {
        get: {
          tags: ["Foods"],
          summary: "Buscar alimentos",
          description:
            "Busca alimentos no banco de dados por nome e/ou categoria",
          operationId: "searchFoods",
          parameters: [
            {
              name: "q",
              in: "query",
              description: "Termo de busca (nome do alimento)",
              required: false,
              schema: { type: "string" },
            },
            {
              name: "category",
              in: "query",
              description: "Categoria do alimento",
              required: false,
              schema: {
                type: "string",
                enum: [
                  "protein",
                  "carbs",
                  "vegetables",
                  "fruits",
                  "fats",
                  "dairy",
                  "snacks",
                ],
              },
            },
            {
              name: "limit",
              in: "query",
              description: "Número máximo de resultados",
              required: false,
              schema: {
                type: "integer",
                default: 20,
                minimum: 1,
                maximum: 100,
              },
            },
          ],
          responses: {
            "200": {
              description: "Lista de alimentos encontrados",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      foods: {
                        type: "array",
                        items: { $ref: "#/components/schemas/FoodItem" },
                      },
                    },
                  },
                  example: {
                    foods: [
                      {
                        id: "food_item_123",
                        name: "Ovos",
                        calories: 155,
                        protein: 13,
                        carbs: 1.1,
                        fats: 11,
                        servingSize: "100g",
                        category: "protein",
                        image: null,
                      },
                    ],
                  },
                },
              },
            },
            "500": { $ref: "#/components/responses/InternalError" },
          },
        },
      },
      "/api/foods/{id}": {
        get: {
          tags: ["Foods"],
          summary: "Buscar detalhes de um alimento",
          description:
            "Retorna informações detalhadas de um alimento específico pelo ID",
          operationId: "getFoodById",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "ID do alimento",
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Detalhes do alimento",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      food: {
                        $ref: "#/components/schemas/FoodItem",
                        nullable: true,
                      },
                      message: { type: "string", nullable: true },
                    },
                  },
                  example: {
                    food: {
                      id: "food_item_123",
                      name: "Ovos",
                      calories: 155,
                      protein: 13,
                      carbs: 1.1,
                      fats: 11,
                      servingSize: "100g",
                      category: "protein",
                      image: null,
                    },
                  },
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequestError" },
            "500": { $ref: "#/components/responses/InternalError" },
          },
        },
      },
      // ============================================
      // MEMBERSHIPS ENDPOINTS
      // ============================================
      "/api/memberships": {
        get: {
          tags: ["Memberships"],
          summary: "Buscar memberships de academias",
          description:
            "Retorna todas as memberships (matrículas) do student em academias",
          operationId: "getMemberships",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          responses: {
            "200": {
              description: "Lista de memberships",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      memberships: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Membership" },
                      },
                    },
                  },
                  example: {
                    memberships: [
                      {
                        id: "membership_123",
                        gymId: "gym_123",
                        gymName: "Academia Fitness",
                        planName: "Plano Mensal",
                        startDate: "2024-01-01T00:00:00.000Z",
                        endDate: "2024-02-01T00:00:00.000Z",
                        status: "active",
                        autoRenew: true,
                      },
                    ],
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/UnauthorizedError" },
            "500": { $ref: "#/components/responses/InternalError" },
          },
        },
      },
      // ============================================
      // AUTH ENDPOINTS (mantidos do original)
      // ============================================
      "/api/auth/sign-up": {
        post: {
          tags: ["Autenticação"],
          summary: "Criar nova conta",
          description:
            "Registra um novo usuário no sistema. A senha é automaticamente hasheada com bcrypt.",
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
          description:
            "Autentica um usuário e retorna uma sessão. A senha é verificada usando bcrypt.",
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
                      role: "STUDENT",
                      hasGym: false,
                      hasStudent: true,
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
          description:
            "Retorna informações sobre a sessão atual do usuário autenticado.",
          operationId: "getSession",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
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
                      role: "STUDENT",
                      hasGym: false,
                      hasStudent: true,
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
          description:
            "Encerra a sessão atual do usuário, removendo o token do banco de dados e o cookie.",
          operationId: "signOut",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
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
          description:
            "Atualiza o role e tipo de um usuário (STUDENT ou GYM). Cria os registros necessários (Student ou Gym) se não existirem.",
          operationId: "updateRole",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
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
                    },
                  },
                  gym: {
                    value: {
                      userId: "clx1234567890",
                      role: "GYM",
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
  };

  return NextResponse.json(swaggerSpec);
}
