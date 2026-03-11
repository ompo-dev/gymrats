/**
 * Script para popular o banco de dados com dados iniciais
 * Execute: node scripts/seed-database.js
 *
 * Este script popula:
 * - Units e Workouts
 * - WorkoutExercises e AlternativeExercises
 * - Gyms com campos completos
 * - MembershipPlans
 * - FoodItems
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function seedDatabase() {
  try {
    console.log("🌱 Iniciando seed do banco de dados...\n");

    // ============================================
    // 1. UNITS E WORKOUTS
    // ============================================
    console.log("📚 Populando Units e Workouts...");

    const unitsData = [
      {
        title: "Semana 1",
        description: "Começando sua jornada fitness",
        color: "#58CC02",
        icon: "💪",
        order: 1,
        workouts: [
          {
            title: "Peito e Tríceps - Dia A",
            description: "Treino focado em desenvolvimento do peitoral",
            type: "strength",
            muscleGroup: "peito",
            difficulty: "iniciante",
            xpReward: 50,
            estimatedTime: 45,
            order: 0,
            exercises: [
              {
                name: "Supino Reto",
                sets: 4,
                reps: "12-10-8-8",
                rest: 90,
                notes: "Aumente o peso a cada série",
                educationalId: "supino-reto",
                order: 0,
                alternatives: [
                  {
                    name: "Supino com Halteres",
                    reason: "Banco de supino ocupado",
                    educationalId: "supino-halteres",
                    order: 0,
                  },
                  {
                    name: "Flexão de Braço com Carga",
                    reason: "Sem equipamento disponível",
                    educationalId: "flexao-bracos",
                    order: 1,
                  },
                  {
                    name: "Supino na Máquina",
                    reason: "Alternativa mais segura",
                    educationalId: "supino-maquina",
                    order: 2,
                  },
                ],
              },
              {
                name: "Supino Inclinado",
                sets: 3,
                reps: "12",
                rest: 90,
                educationalId: "supino-inclinado",
                order: 1,
                alternatives: [
                  {
                    name: "Supino Inclinado com Halteres",
                    reason: "Banco de supino ocupado",
                    educationalId: "supino-inclinado-halteres",
                    order: 0,
                  },
                  {
                    name: "Flexão Inclinada",
                    reason: "Sem equipamento",
                    educationalId: "flexao-inclinada",
                    order: 1,
                  },
                  {
                    name: "Crossover Superior",
                    reason: "Foco na porção superior",
                    educationalId: "crossover-superior",
                    order: 2,
                  },
                ],
              },
              {
                name: "Crucifixo",
                sets: 3,
                reps: "15",
                rest: 60,
                notes: "Foco na contração",
                educationalId: "crucifixo",
                order: 2,
                alternatives: [
                  {
                    name: "Crucifixo com Cabos",
                    reason: "Banco ocupado",
                    educationalId: "crucifixo-cabos",
                    order: 0,
                  },
                  {
                    name: "Peck Deck",
                    reason: "Maior isolamento",
                    educationalId: "peck-deck",
                    order: 1,
                  },
                  {
                    name: "Flexão com Abertura",
                    reason: "Sem equipamento",
                    educationalId: "flexao-abertura",
                    order: 2,
                  },
                ],
              },
              {
                name: "Tríceps Testa",
                sets: 3,
                reps: "12",
                rest: 60,
                educationalId: "triceps-testa",
                order: 3,
                alternatives: [
                  {
                    name: "Tríceps Francês",
                    reason: "Banco ocupado",
                    educationalId: "triceps-frances",
                    order: 0,
                  },
                  {
                    name: "Tríceps Coice",
                    reason: "Alternativa com halteres",
                    educationalId: "triceps-coice",
                    order: 1,
                  },
                  {
                    name: "Mergulho no Banco",
                    reason: "Sem equipamento",
                    educationalId: "mergulho-banco",
                    order: 2,
                  },
                ],
              },
              {
                name: "Tríceps Corda",
                sets: 3,
                reps: "15",
                rest: 45,
                educationalId: "triceps-corda",
                order: 4,
                alternatives: [
                  {
                    name: "Tríceps Barra Reta",
                    reason: "Corda não disponível",
                    educationalId: "triceps-barra",
                    order: 0,
                  },
                  {
                    name: "Tríceps Unilateral",
                    reason: "Cabo ocupado",
                    educationalId: "triceps-unilateral",
                    order: 1,
                  },
                  {
                    name: "Paralelas",
                    reason: "Máxima ativação",
                    educationalId: "paralelas",
                    order: 2,
                  },
                ],
              },
            ],
          },
          {
            title: "Costas e Bíceps - Dia B",
            description: "Desenvolvimento completo das costas",
            type: "strength",
            muscleGroup: "costas",
            difficulty: "iniciante",
            xpReward: 50,
            estimatedTime: 50,
            order: 1,
            exercises: [
              {
                name: "Barra Fixa",
                sets: 4,
                reps: "8-10",
                rest: 120,
                notes: "Assistida se necessário",
                educationalId: "barra-fixa",
                order: 0,
                alternatives: [
                  {
                    name: "Pulldown",
                    reason: "Barra ocupada ou força insuficiente",
                    educationalId: "pulldown",
                    order: 0,
                  },
                  {
                    name: "Barra Fixa Assistida",
                    reason: "Progressão gradual",
                    educationalId: "barra-fixa-assistida",
                    order: 1,
                  },
                  {
                    name: "Remada Graviton",
                    reason: "Máquina alternativa",
                    educationalId: "remada-graviton",
                    order: 2,
                  },
                ],
              },
              {
                name: "Remada Curvada",
                sets: 4,
                reps: "12",
                rest: 90,
                educationalId: "remada-curvada",
                order: 1,
                alternatives: [
                  {
                    name: "Remada Cavalinho",
                    reason: "Mais estabilidade",
                    educationalId: "remada-cavalinho",
                    order: 0,
                  },
                  {
                    name: "Remada com Halteres",
                    reason: "Barra ocupada",
                    educationalId: "remada-halteres",
                    order: 1,
                  },
                  {
                    name: "Remada no Cabo",
                    reason: "Tensão constante",
                    educationalId: "remada-cabo",
                    order: 2,
                  },
                ],
              },
              {
                name: "Pulldown",
                sets: 3,
                reps: "12",
                rest: 60,
                educationalId: "pulldown",
                order: 2,
                alternatives: [
                  {
                    name: "Pulldown Triângulo",
                    reason: "Pegada diferente",
                    educationalId: "pulldown-triangulo",
                    order: 0,
                  },
                  {
                    name: "Pullover",
                    reason: "Cabo ocupado",
                    educationalId: "pullover",
                    order: 1,
                  },
                  {
                    name: "Barra Fixa Pegada Fechada",
                    reason: "Variação com peso corporal",
                    educationalId: "barra-fixa-fechada",
                    order: 2,
                  },
                ],
              },
              {
                name: "Rosca Direta",
                sets: 3,
                reps: "12",
                rest: 60,
                educationalId: "rosca-direta",
                order: 3,
                alternatives: [
                  {
                    name: "Rosca Alternada",
                    reason: "Barra ocupada",
                    educationalId: "rosca-alternada",
                    order: 0,
                  },
                  {
                    name: "Rosca Scott",
                    reason: "Maior isolamento",
                    educationalId: "rosca-scott",
                    order: 1,
                  },
                  {
                    name: "Rosca no Cabo",
                    reason: "Tensão constante",
                    educationalId: "rosca-cabo",
                    order: 2,
                  },
                ],
              },
              {
                name: "Rosca Martelo",
                sets: 3,
                reps: "12",
                rest: 60,
                educationalId: "rosca-martelo",
                order: 4,
                alternatives: [
                  {
                    name: "Rosca Inversa",
                    reason: "Foco no braquial",
                    educationalId: "rosca-inversa",
                    order: 0,
                  },
                  {
                    name: "Rosca Concentrada",
                    reason: "Halteres ocupados",
                    educationalId: "rosca-concentrada",
                    order: 1,
                  },
                  {
                    name: "Rosca com Corda",
                    reason: "Variação com cabo",
                    educationalId: "rosca-corda",
                    order: 2,
                  },
                ],
              },
            ],
          },
          {
            title: "Corrida Intervalada",
            description: "HIIT de corrida para queimar calorias",
            type: "cardio",
            muscleGroup: "cardio",
            difficulty: "intermediario",
            xpReward: 40,
            estimatedTime: 25,
            order: 2,
            exercises: [
              {
                name: "Corrida 6km/h",
                sets: 1,
                reps: "25min",
                rest: 0,
                notes: "Ritmo moderado, mantenha conversação",
                educationalId: "corrida-moderada",
                order: 0,
                alternatives: [
                  {
                    name: "Caminhada Rápida 5km/h",
                    reason: "Menor impacto nas articulações",
                    order: 0,
                  },
                  {
                    name: "Elíptico",
                    reason: "Esteira ocupada ou problemas no joelho",
                    order: 1,
                  },
                  {
                    name: "Bike Ergométrica",
                    reason: "Sem impacto, mesmo gasto calórico",
                    order: 2,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        title: "Semana 2",
        description: "Aumentando a intensidade",
        color: "#1CB0F6",
        icon: "🔥",
        order: 2,
        workouts: [
          {
            title: "Pernas Completo - Dia C",
            description: "Treino intenso de pernas e glúteos",
            type: "strength",
            muscleGroup: "pernas",
            difficulty: "intermediario",
            xpReward: 75,
            estimatedTime: 60,
            order: 0,
            exercises: [
              {
                name: "Agachamento Livre",
                sets: 4,
                reps: "12-10-8-8",
                rest: 120,
                educationalId: "agachamento-livre",
                order: 0,
                alternatives: [
                  {
                    name: "Leg Press",
                    reason: "Rack ocupado ou mais seguro",
                    educationalId: "leg-press",
                    order: 0,
                  },
                  {
                    name: "Agachamento no Smith",
                    reason: "Maior estabilidade",
                    educationalId: "agachamento-smith",
                    order: 1,
                  },
                  {
                    name: "Agachamento Búlgaro",
                    reason: "Foco unilateral",
                    educationalId: "agachamento-bulgaro",
                    order: 2,
                  },
                ],
              },
              {
                name: "Leg Press",
                sets: 4,
                reps: "15",
                rest: 90,
                educationalId: "leg-press",
                order: 1,
                alternatives: [
                  {
                    name: "Agachamento Livre",
                    reason: "Leg press ocupado",
                    educationalId: "agachamento-livre",
                    order: 0,
                  },
                  {
                    name: "Hack Machine",
                    reason: "Máquina alternativa",
                    educationalId: "hack-machine",
                    order: 1,
                  },
                  {
                    name: "Afundo com Barra",
                    reason: "Exercício funcional",
                    educationalId: "afundo-barra",
                    order: 2,
                  },
                ],
              },
              {
                name: "Cadeira Extensora",
                sets: 3,
                reps: "15",
                rest: 60,
                educationalId: "cadeira-extensora",
                order: 2,
                alternatives: [
                  {
                    name: "Agachamento Sissy",
                    reason: "Cadeira ocupada",
                    educationalId: "agachamento-sissy",
                    order: 0,
                  },
                  {
                    name: "Extensão Unilateral",
                    reason: "Foco em cada perna",
                    educationalId: "extensao-unilateral",
                    order: 1,
                  },
                  {
                    name: "Leg Press Parcial",
                    reason: "Foco no quadríceps",
                    educationalId: "leg-press-parcial",
                    order: 2,
                  },
                ],
              },
              {
                name: "Mesa Flexora",
                sets: 3,
                reps: "12",
                rest: 60,
                educationalId: "mesa-flexora",
                order: 3,
                alternatives: [
                  {
                    name: "Stiff",
                    reason: "Mesa ocupada",
                    educationalId: "stiff",
                    order: 0,
                  },
                  {
                    name: "Flexora em Pé",
                    reason: "Variação unilateral",
                    educationalId: "flexora-pe",
                    order: 1,
                  },
                  {
                    name: "Good Morning",
                    reason: "Trabalho posterior completo",
                    educationalId: "good-morning",
                    order: 2,
                  },
                ],
              },
              {
                name: "Panturrilha",
                sets: 4,
                reps: "20",
                rest: 45,
                educationalId: "panturrilha",
                order: 4,
                alternatives: [
                  {
                    name: "Panturrilha no Leg Press",
                    reason: "Máquina ocupada",
                    educationalId: "panturrilha-leg-press",
                    order: 0,
                  },
                  {
                    name: "Panturrilha Unilateral",
                    reason: "Foco em cada perna",
                    educationalId: "panturrilha-unilateral",
                    order: 1,
                  },
                  {
                    name: "Elevação de Panturrilha Livre",
                    reason: "Sem equipamento",
                    educationalId: "elevacao-panturrilha",
                    order: 2,
                  },
                ],
              },
            ],
          },
          {
            title: "Bike Resistência",
            description: "Treino de resistência cardiovascular",
            type: "cardio",
            muscleGroup: "cardio",
            difficulty: "iniciante",
            xpReward: 35,
            estimatedTime: 30,
            order: 1,
            exercises: [
              {
                name: "Bike Ergométrica 30min",
                sets: 1,
                reps: "30min",
                rest: 0,
                notes: "Resistência média, 70-80% FC máx",
                educationalId: "bike-resistencia",
                order: 0,
                alternatives: [
                  {
                    name: "Spinning",
                    reason: "Bike ergométrica ocupada",
                    order: 0,
                  },
                  {
                    name: "Esteira Inclinada",
                    reason: "Simular subida, mesmo esforço",
                    order: 1,
                  },
                  {
                    name: "Remo Ergométrico",
                    reason: "Trabalho cardiovascular completo",
                    order: 2,
                  },
                ],
              },
            ],
          },
          {
            title: "HIIT Completo",
            description: "Alta intensidade para máxima queima",
            type: "cardio",
            muscleGroup: "cardio",
            difficulty: "avancado",
            xpReward: 60,
            estimatedTime: 20,
            order: 2,
            exercises: [
              {
                name: "HIIT Burpees 20min",
                sets: 1,
                reps: "20min",
                rest: 0,
                notes: "40s on / 20s off - Máxima intensidade",
                educationalId: "hiit-burpees",
                order: 0,
                alternatives: [
                  {
                    name: "HIIT Bike",
                    reason: "Menor impacto, mesma intensidade",
                    order: 0,
                  },
                  {
                    name: "HIIT Esteira",
                    reason: "Sprint intervals na esteira",
                    order: 1,
                  },
                  {
                    name: "HIIT Remo",
                    reason: "Trabalho completo corpo inteiro",
                    order: 2,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        title: "Semana 3",
        description: "Treino avançado",
        color: "#FF9600",
        icon: "⚡",
        order: 3,
        workouts: [
          {
            title: "Ombros e Trapézio",
            description: "Desenvolvimento completo dos deltóides",
            type: "strength",
            muscleGroup: "ombros",
            difficulty: "iniciante",
            xpReward: 50,
            estimatedTime: 40,
            order: 0,
            exercises: [],
          },
        ],
      },
    ];

    for (const unitData of unitsData) {
      const { workouts, ...unitFields } = unitData;

      // Verificar se unit já existe
      let unit = await prisma.unit.findFirst({
        where: { title: unitFields.title },
      });

      if (unit) {
        // Atualizar unit existente
        unit = await prisma.unit.update({
          where: { id: unit.id },
          data: {
            description: unitFields.description,
            color: unitFields.color,
            icon: unitFields.icon,
            order: unitFields.order,
          },
        });
        console.log(`  ✅ Unit "${unit.title}" atualizada`);
      } else {
        // Criar nova unit com workouts
        unit = await prisma.unit.create({
          data: {
            ...unitFields,
            workouts: {
              create: workouts.map((workout) => {
                const { exercises, ...workoutFields } = workout;
                return {
                  ...workoutFields,
                  exercises: {
                    create: exercises.map((exercise) => {
                      const { alternatives, ...exerciseFields } = exercise;
                      return {
                        ...exerciseFields,
                        alternatives: {
                          create: alternatives || [],
                        },
                      };
                    }),
                  },
                };
              }),
            },
          },
        });
        console.log(`  ✅ Unit "${unit.title}" criada`);
      }
    }

    // ============================================
    // 2. GYMS
    // ============================================
    console.log("\n🏋️ Populando Gyms...");

    // Primeiro, precisamos criar um usuário para as academias
    // Vamos buscar ou criar um usuário admin
    const gymUser = await prisma.user.upsert({
      where: { email: "admin@gymrats.com" },
      update: {},
      create: {
        email: "admin@gymrats.com",
        password: "hashed_password_placeholder", // Em produção, deve ser hash
        name: "Admin GymRats",
        role: "ADMIN",
      },
    });

    const gymsData = [
      {
        name: "PowerFit Academia",
        logo: "/abstract-gym-logo.png",
        address: "Rua das Flores, 123 - Centro",
        phone: "(11) 98765-4321",
        email: "contato@powerfit.com.br",
        cnpj: "12.345.678/0001-90",
        plan: "premium",
        isActive: true,
        isPartner: true,
        latitude: -23.5505,
        longitude: -46.6333,
        rating: 4.8,
        totalReviews: 234,
        amenities: JSON.stringify([
          "Estacionamento",
          "Vestiário",
          "Wifi",
          "Personal Trainer",
          "Ar Condicionado",
        ]),
        openingHours: JSON.stringify({
          open: "06:00",
          close: "22:00",
        }),
        photos: JSON.stringify([]),
        plans: [
          {
            name: "Mensal",
            type: "monthly",
            price: 120,
            duration: 30,
            benefits: JSON.stringify([
              "Acesso ilimitado",
              "1 avaliação física",
            ]),
            isActive: true,
          },
          {
            name: "Trimestral",
            type: "quarterly",
            price: 330,
            duration: 90,
            benefits: JSON.stringify([
              "Acesso ilimitado",
              "2 avaliações físicas",
              "5% desconto",
            ]),
            isActive: true,
          },
        ],
      },
      {
        name: "FitZone Premium",
        logo: "/fitzone-gym-logo.jpg",
        address: "Av. Paulista, 1500 - Bela Vista",
        phone: "(11) 91234-5678",
        email: "contato@fitzone.com.br",
        cnpj: "23.456.789/0001-01",
        plan: "premium",
        isActive: true,
        isPartner: true,
        latitude: -23.5629,
        longitude: -46.6544,
        rating: 4.6,
        totalReviews: 189,
        amenities: JSON.stringify([
          "Piscina",
          "Sauna",
          "Estacionamento",
          "Wifi",
          "Nutricionista",
        ]),
        openingHours: JSON.stringify({
          open: "05:00",
          close: "23:00",
        }),
        photos: JSON.stringify([]),
        plans: [
          {
            name: "Mensal",
            type: "monthly",
            price: 150,
            duration: 30,
            benefits: JSON.stringify([
              "Acesso ilimitado",
              "Piscina e Sauna",
              "1 avaliação física",
            ]),
            isActive: true,
          },
        ],
      },
      {
        name: "Strong Life Gym",
        logo: "/stronglife-gym-logo.jpg",
        address: "Rua Augusta, 890 - Jardins",
        phone: "(11) 92345-6789",
        email: "contato@stronglife.com.br",
        cnpj: "34.567.890/0001-12",
        plan: "premium",
        isActive: true,
        isPartner: true,
        latitude: -23.5558,
        longitude: -46.6614,
        rating: 4.9,
        totalReviews: 312,
        amenities: JSON.stringify([
          "CrossFit",
          "Funcional",
          "Estacionamento",
          "Personal 24h",
          "Vestiário Premium",
        ]),
        openingHours: JSON.stringify({
          open: "24h",
          close: "24h",
        }),
        photos: JSON.stringify([]),
        plans: [
          {
            name: "Mensal",
            type: "monthly",
            price: 140,
            duration: 30,
            benefits: JSON.stringify([
              "Acesso 24h",
              "CrossFit incluso",
              "1 avaliação física",
            ]),
            isActive: true,
          },
        ],
      },
    ];

    for (const gymData of gymsData) {
      const { plans, ...gymFields } = gymData;

      // Verificar se gym já existe
      let gym = await prisma.gym.findFirst({
        where: { email: gymFields.email },
      });

      if (gym) {
        // Atualizar gym existente
        gym = await prisma.gym.update({
          where: { id: gym.id },
          data: gymFields,
        });
        console.log(`  ✅ Gym "${gym.name}" atualizada`);

        // Atualizar plans (deletar existentes e recriar)
        await prisma.membershipPlan.deleteMany({
          where: { gymId: gym.id },
        });
        for (const plan of plans) {
          await prisma.membershipPlan.create({
            data: {
              ...plan,
              gymId: gym.id,
            },
          });
        }
      } else {
        // Criar nova gym com plans
        gym = await prisma.gym.create({
          data: {
            ...gymFields,
            userId: gymUser.id,
            plans: {
              create: plans.map((plan) => ({
                ...plan,
              })),
            },
          },
        });
        console.log(`  ✅ Gym "${gym.name}" criada`);
      }
    }

    // ============================================
    // 3. FOOD ITEMS
    // ============================================
    console.log("\n🍎 Populando Food Items...");

    const foodsData = [
      {
        name: "Peito de frango grelhado",
        calories: 165,
        protein: 31,
        carbs: 0,
        fats: 3.6,
        servingSize: "100g",
        category: "protein",
      },
      {
        name: "Arroz integral cozido",
        calories: 112,
        protein: 2.6,
        carbs: 24,
        fats: 0.9,
        servingSize: "100g",
        category: "carbs",
      },
      {
        name: "Batata doce cozida",
        calories: 86,
        protein: 1.6,
        carbs: 20,
        fats: 0.1,
        servingSize: "100g",
        category: "carbs",
      },
      {
        name: "Ovo inteiro cozido",
        calories: 155,
        protein: 13,
        carbs: 1.1,
        fats: 11,
        servingSize: "1 unidade (50g)",
        category: "protein",
      },
      {
        name: "Aveia em flocos",
        calories: 389,
        protein: 16.9,
        carbs: 66,
        fats: 6.9,
        servingSize: "100g",
        category: "carbs",
      },
      {
        name: "Banana",
        calories: 89,
        protein: 1.1,
        carbs: 23,
        fats: 0.3,
        servingSize: "1 unidade (100g)",
        category: "fruits",
      },
      {
        name: "Salmão grelhado",
        calories: 208,
        protein: 20,
        carbs: 0,
        fats: 13,
        servingSize: "100g",
        category: "protein",
      },
      {
        name: "Brócolis cozido",
        calories: 35,
        protein: 2.4,
        carbs: 7,
        fats: 0.4,
        servingSize: "100g",
        category: "vegetables",
      },
      {
        name: "Whey Protein",
        calories: 120,
        protein: 24,
        carbs: 3,
        fats: 1,
        servingSize: "1 scoop (30g)",
        category: "protein",
      },
      {
        name: "Azeite de oliva",
        calories: 884,
        protein: 0,
        carbs: 0,
        fats: 100,
        servingSize: "100ml",
        category: "fats",
      },
      {
        name: "Atum em lata",
        calories: 116,
        protein: 26,
        carbs: 0,
        fats: 1,
        servingSize: "100g",
        category: "protein",
      },
      {
        name: "Quinoa cozida",
        calories: 120,
        protein: 4.4,
        carbs: 22,
        fats: 1.9,
        servingSize: "100g",
        category: "carbs",
      },
      {
        name: "Maçã",
        calories: 52,
        protein: 0.3,
        carbs: 14,
        fats: 0.2,
        servingSize: "1 unidade (100g)",
        category: "fruits",
      },
      {
        name: "Abacate",
        calories: 160,
        protein: 2,
        carbs: 9,
        fats: 15,
        servingSize: "100g",
        category: "fats",
      },
      {
        name: "Frango desfiado",
        calories: 165,
        protein: 31,
        carbs: 0,
        fats: 3.6,
        servingSize: "100g",
        category: "protein",
      },
      {
        name: "Batata inglesa cozida",
        calories: 87,
        protein: 2,
        carbs: 20,
        fats: 0.1,
        servingSize: "100g",
        category: "carbs",
      },
      {
        name: "Mamão",
        calories: 43,
        protein: 0.5,
        carbs: 11,
        fats: 0.3,
        servingSize: "100g",
        category: "fruits",
      },
      {
        name: "Espinafre cozido",
        calories: 23,
        protein: 2.9,
        carbs: 3.6,
        fats: 0.4,
        servingSize: "100g",
        category: "vegetables",
      },
      {
        name: "Queijo cottage",
        calories: 98,
        protein: 11,
        carbs: 3.4,
        fats: 4.3,
        servingSize: "100g",
        category: "dairy",
      },
      {
        name: "Amendoim",
        calories: 567,
        protein: 26,
        carbs: 16,
        fats: 49,
        servingSize: "100g",
        category: "snacks",
      },
    ];

    for (const foodData of foodsData) {
      // Verificar se food já existe
      let food = await prisma.foodItem.findFirst({
        where: { name: foodData.name },
      });

      if (food) {
        // Atualizar food existente
        food = await prisma.foodItem.update({
          where: { id: food.id },
          data: foodData,
        });
        console.log(`  ✅ Food "${food.name}" atualizado`);
      } else {
        // Criar novo food
        food = await prisma.foodItem.create({
          data: foodData,
        });
        console.log(`  ✅ Food "${food.name}" criado`);
      }
    }

    // ============================================
    // 4. DADOS DO USUÁRIO MAICON PEREIRA BARBOSA
    // ============================================
    console.log("\n👤 Populando dados do usuário Maicon Pereira Barbosa...");

    // Buscar ou criar usuário
    const userEmail = "maicon@gmail.com"; // Ajuste o email se necessário
    let user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        student: {
          include: {
            profile: true,
            progress: true,
          },
        },
      },
    });

    if (!user) {
      // Criar usuário se não existir
      user = await prisma.user.create({
        data: {
          email: userEmail,
          name: "Maicon Pereira Barbosa",
          password: "hashed_password_placeholder", // Em produção, deve ser hash
          role: "ADMIN", // ADMIN com acesso a ambos os perfis
          student: {
            create: {},
          },
        },
        include: {
          student: {
            include: {
              profile: true,
              progress: true,
            },
          },
        },
      });
      console.log(`  ✅ Usuário "${user.name}" criado como ADMIN`);
    } else {
      // Atualizar nome e role se necessário
      const updates = {};
      if (user.name !== "Maicon Pereira Barbosa") {
        updates.name = "Maicon Pereira Barbosa";
      }
      if (user.role !== "ADMIN") {
        updates.role = "ADMIN";
      }

      if (Object.keys(updates).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updates,
          include: {
            student: {
              include: {
                profile: true,
                progress: true,
              },
            },
          },
        });
        console.log(`  ✅ Usuário atualizado (nome e/ou role)`);
      } else {
        console.log(`  ✅ Usuário "${user.name}" já existe como ADMIN`);
      }
    }

    // Garantir que tenha Student
    let student = user.student;
    if (!student) {
      student = await prisma.student.create({
        data: {
          userId: user.id,
        },
        include: {
          profile: true,
          progress: true,
        },
      });
      console.log(`  ✅ Perfil de student criado`);
    }

    // Garantir que tenha Gym (ADMIN pode ter ambos os perfis)
    let gym = await prisma.gym.findFirst({
      where: { userId: user.id },
    });

    if (!gym) {
      gym = await prisma.gym.create({
        data: {
          userId: user.id,
          name: "Academia Admin",
          address: "Endereço da academia",
          phone: "(00) 00000-0000",
          email: userEmail,
          plan: "premium",
          isActive: true,
        },
      });
      console.log(`  ✅ Perfil de gym criado para ADMIN`);
    } else {
      console.log(`  ✅ Perfil de gym já existe`);
    }

    // Criar ou atualizar StudentProfile
    const profileData = {
      height: 187, // 1.87m em cm
      weight: 91.5, // kg atual
      fitnessLevel: "intermediario",
      goals: JSON.stringify(["perder-peso"]), // Objetivo: perder peso
      weeklyWorkoutFrequency: 4,
      workoutDuration: 60,
    };

    if (student.profile) {
      await prisma.studentProfile.update({
        where: { studentId: student.id },
        data: profileData,
      });
      console.log(
        `  ✅ Perfil atualizado (${profileData.height}cm, ${profileData.weight}kg)`,
      );
    } else {
      await prisma.studentProfile.create({
        data: {
          studentId: student.id,
          ...profileData,
        },
      });
      console.log(
        `  ✅ Perfil criado (${profileData.height}cm, ${profileData.weight}kg)`,
      );
    }

    // Criar StudentProgress se não existir
    if (!student.progress) {
      await prisma.studentProgress.create({
        data: {
          studentId: student.id,
          currentLevel: 1,
          totalXP: 0,
          xpToNextLevel: 100,
        },
      });
      console.log(`  ✅ Progresso inicial criado`);
    }

    // Criar histórico de peso (mostrando perda de 2-3kg no último mês)
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    // Verificar se já existe histórico
    const existingWeightHistory = await prisma.weightHistory.findMany({
      where: { studentId: student.id },
      orderBy: { date: "desc" },
      take: 1,
    });

    if (existingWeightHistory.length === 0) {
      // Criar histórico de peso (perda de 2-3kg)
      const weightHistoryData = [
        {
          studentId: student.id,
          weight: 94.5, // Peso há 2 meses
          date: twoMonthsAgo,
          notes: "Peso inicial",
        },
        {
          studentId: student.id,
          weight: 93.5, // Peso há 1 mês
          date: oneMonthAgo,
          notes: "Em progresso",
        },
        {
          studentId: student.id,
          weight: 91.5, // Peso atual
          date: today,
          notes: "Meta alcançada - perda de 3kg",
        },
      ];

      for (const weightData of weightHistoryData) {
        await prisma.weightHistory.create({
          data: weightData,
        });
      }
      console.log(`  ✅ Histórico de peso criado (perda de 3kg no último mês)`);
    } else {
      // Atualizar último registro se necessário
      const lastWeight = existingWeightHistory[0];
      if (lastWeight.weight !== 91.5) {
        await prisma.weightHistory.update({
          where: { id: lastWeight.id },
          data: {
            weight: 91.5,
            date: today,
            notes: "Peso atualizado",
          },
        });
        console.log(`  ✅ Último registro de peso atualizado para 91.5kg`);
      } else {
        console.log(`  ✅ Histórico de peso já existe e está atualizado`);
      }
    }

    console.log("\n✅ Seed concluído com sucesso!");
    console.log("\n📝 Próximos passos:");
    console.log("   1. Execute: npx prisma generate");
    console.log("   2. Verifique os dados no banco");
    console.log("   3. Teste as funcionalidades da aplicação");
    console.log("\n👤 Dados do usuário Maicon:");
    console.log(`   - Nome: Maicon Pereira Barbosa`);
    console.log(`   - Email: ${userEmail}`);
    console.log(`   - Altura: 187cm (1.87m)`);
    console.log(`   - Peso atual: 91.5kg`);
    console.log(`   - Objetivo: Perder peso`);
    console.log(`   - Perda no último mês: 3kg`);
  } catch (error) {
    console.error("❌ Erro ao executar seed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase();
