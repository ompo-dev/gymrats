export interface EquipmentItem {
  id: string;
  name: string;
  type: "cardio" | "musculacao" | "funcional";
  category: string;
  description?: string;
}

export const equipmentDatabase: EquipmentItem[] = [
  // ============================================
  // EQUIPAMENTOS CARDIO
  // ============================================
  {
    id: "eq-cardio-001",
    name: "Esteira",
    type: "cardio",
    category: "Cardio",
  },
  {
    id: "eq-cardio-002",
    name: "Bicicleta Ergométrica Vertical",
    type: "cardio",
    category: "Cardio",
  },
  {
    id: "eq-cardio-003",
    name: "Bicicleta Ergométrica Horizontal",
    type: "cardio",
    category: "Cardio",
  },
  {
    id: "eq-cardio-004",
    name: "Transport",
    type: "cardio",
    category: "Cardio",
  },
  {
    id: "eq-cardio-005",
    name: "Elíptico",
    type: "cardio",
    category: "Cardio",
  },
  {
    id: "eq-cardio-006",
    name: "Remo Ergométrico",
    type: "cardio",
    category: "Cardio",
  },
  {
    id: "eq-cardio-007",
    name: "Escada Escaladora",
    type: "cardio",
    category: "Cardio",
  },
  {
    id: "eq-cardio-008",
    name: "Bike Spinning",
    type: "cardio",
    category: "Cardio",
  },
  {
    id: "eq-cardio-009",
    name: "Assault Bike",
    type: "cardio",
    category: "Cardio",
  },
  {
    id: "eq-cardio-010",
    name: "Stepper",
    type: "cardio",
    category: "Cardio",
  },

  // ============================================
  // EQUIPAMENTOS MUSCULAÇÃO - PEITO
  // ============================================
  {
    id: "eq-musc-peito-001",
    name: "Supino Reto",
    type: "musculacao",
    category: "Peito",
  },
  {
    id: "eq-musc-peito-002",
    name: "Supino Inclinado",
    type: "musculacao",
    category: "Peito",
  },
  {
    id: "eq-musc-peito-003",
    name: "Supino Declinado",
    type: "musculacao",
    category: "Peito",
  },
  {
    id: "eq-musc-peito-004",
    name: "Peck Deck",
    type: "musculacao",
    category: "Peito",
  },
  {
    id: "eq-musc-peito-005",
    name: "Crossover",
    type: "musculacao",
    category: "Peito",
  },
  {
    id: "eq-musc-peito-006",
    name: "Voador",
    type: "musculacao",
    category: "Peito",
  },

  // ============================================
  // EQUIPAMENTOS MUSCULAÇÃO - COSTAS
  // ============================================
  {
    id: "eq-musc-costas-001",
    name: "Puxada Alta",
    type: "musculacao",
    category: "Costas",
  },
  {
    id: "eq-musc-costas-002",
    name: "Remada Baixa",
    type: "musculacao",
    category: "Costas",
  },
  {
    id: "eq-musc-costas-003",
    name: "Remada Alta",
    type: "musculacao",
    category: "Costas",
  },
  {
    id: "eq-musc-costas-004",
    name: "Puxada Frontal",
    type: "musculacao",
    category: "Costas",
  },
  {
    id: "eq-musc-costas-005",
    name: "Puxada Atrás",
    type: "musculacao",
    category: "Costas",
  },
  {
    id: "eq-musc-costas-006",
    name: "Remada Unilateral",
    type: "musculacao",
    category: "Costas",
  },
  {
    id: "eq-musc-costas-007",
    name: "Pulley",
    type: "musculacao",
    category: "Costas",
  },
  {
    id: "eq-musc-costas-008",
    name: "Remada Sentado",
    type: "musculacao",
    category: "Costas",
  },

  // ============================================
  // EQUIPAMENTOS MUSCULAÇÃO - OMBROS
  // ============================================
  {
    id: "eq-musc-ombros-001",
    name: "Desenvolvimento",
    type: "musculacao",
    category: "Ombros",
  },
  {
    id: "eq-musc-ombros-002",
    name: "Elevação Lateral",
    type: "musculacao",
    category: "Ombros",
  },
  {
    id: "eq-musc-ombros-003",
    name: "Elevação Frontal",
    type: "musculacao",
    category: "Ombros",
  },
  {
    id: "eq-musc-ombros-004",
    name: "Desenvolvimento Arnold",
    type: "musculacao",
    category: "Ombros",
  },
  {
    id: "eq-musc-ombros-005",
    name: "Crucifixo Inverso",
    type: "musculacao",
    category: "Ombros",
  },

  // ============================================
  // EQUIPAMENTOS MUSCULAÇÃO - BRAÇOS
  // ============================================
  {
    id: "eq-musc-bracos-001",
    name: "Extensão de Tríceps",
    type: "musculacao",
    category: "Braços",
  },
  {
    id: "eq-musc-bracos-002",
    name: "Rosca Direta",
    type: "musculacao",
    category: "Braços",
  },
  {
    id: "eq-musc-bracos-003",
    name: "Rosca Scott",
    type: "musculacao",
    category: "Braços",
  },
  {
    id: "eq-musc-bracos-004",
    name: "Rosca Martelo",
    type: "musculacao",
    category: "Braços",
  },
  {
    id: "eq-musc-bracos-005",
    name: "Tríceps Pulley",
    type: "musculacao",
    category: "Braços",
  },
  {
    id: "eq-musc-bracos-006",
    name: "Tríceps Coice",
    type: "musculacao",
    category: "Braços",
  },
  {
    id: "eq-musc-bracos-007",
    name: "Rosca 21",
    type: "musculacao",
    category: "Braços",
  },

  // ============================================
  // EQUIPAMENTOS MUSCULAÇÃO - PERNAS
  // ============================================
  {
    id: "eq-musc-pernas-001",
    name: "Leg Press 45°",
    type: "musculacao",
    category: "Pernas",
  },
  {
    id: "eq-musc-pernas-002",
    name: "Leg Press Horizontal",
    type: "musculacao",
    category: "Pernas",
  },
  {
    id: "eq-musc-pernas-003",
    name: "Extensão de Pernas",
    type: "musculacao",
    category: "Pernas",
  },
  {
    id: "eq-musc-pernas-004",
    name: "Flexão de Pernas",
    type: "musculacao",
    category: "Pernas",
  },
  {
    id: "eq-musc-pernas-005",
    name: "Panturrilha em Pé",
    type: "musculacao",
    category: "Pernas",
  },
  {
    id: "eq-musc-pernas-006",
    name: "Panturrilha Sentado",
    type: "musculacao",
    category: "Pernas",
  },
  {
    id: "eq-musc-pernas-007",
    name: "Abdutora",
    type: "musculacao",
    category: "Pernas",
  },
  {
    id: "eq-musc-pernas-008",
    name: "Adutora",
    type: "musculacao",
    category: "Pernas",
  },
  {
    id: "eq-musc-pernas-009",
    name: "Hack Squat",
    type: "musculacao",
    category: "Pernas",
  },
  {
    id: "eq-musc-pernas-010",
    name: "Cadeira Extensora",
    type: "musculacao",
    category: "Pernas",
  },
  {
    id: "eq-musc-pernas-011",
    name: "Mesa Flexora",
    type: "musculacao",
    category: "Pernas",
  },
  {
    id: "eq-musc-pernas-012",
    name: "Leg Curl",
    type: "musculacao",
    category: "Pernas",
  },
  {
    id: "eq-musc-pernas-013",
    name: "Cadeira Adutora",
    type: "musculacao",
    category: "Pernas",
  },
  {
    id: "eq-musc-pernas-014",
    name: "Cadeira Abdutora",
    type: "musculacao",
    category: "Pernas",
  },
  {
    id: "eq-musc-pernas-015",
    name: "Glúteo",
    type: "musculacao",
    category: "Pernas",
  },
  {
    id: "eq-musc-pernas-016",
    name: "Afundo",
    type: "musculacao",
    category: "Pernas",
  },

  // ============================================
  // EQUIPAMENTOS MUSCULAÇÃO - ABDOMEN
  // ============================================
  {
    id: "eq-musc-abdomen-001",
    name: "Abdominal",
    type: "musculacao",
    category: "Abdomen",
  },
  {
    id: "eq-musc-abdomen-002",
    name: "Abdominal Inclinado",
    type: "musculacao",
    category: "Abdomen",
  },
  {
    id: "eq-musc-abdomen-003",
    name: "Giro",
    type: "musculacao",
    category: "Abdomen",
  },
  {
    id: "eq-musc-abdomen-004",
    name: "Abdominal com Peso",
    type: "musculacao",
    category: "Abdomen",
  },

  // ============================================
  // EQUIPAMENTOS MUSCULAÇÃO - COMPLETO/MULTI
  // ============================================
  {
    id: "eq-musc-completo-001",
    name: "Smith Machine",
    type: "musculacao",
    category: "Completo",
  },
  {
    id: "eq-musc-completo-002",
    name: "Graviton",
    type: "musculacao",
    category: "Completo",
  },
  {
    id: "eq-musc-completo-003",
    name: "Paralelas",
    type: "musculacao",
    category: "Completo",
  },
  {
    id: "eq-musc-completo-004",
    name: "Barra Fixa",
    type: "musculacao",
    category: "Completo",
  },
  {
    id: "eq-musc-completo-005",
    name: "Rack de Agachamento",
    type: "musculacao",
    category: "Completo",
  },
  {
    id: "eq-musc-completo-006",
    name: "Power Rack",
    type: "musculacao",
    category: "Completo",
  },
  {
    id: "eq-musc-completo-007",
    name: "Cage",
    type: "musculacao",
    category: "Completo",
  },
  {
    id: "eq-musc-completo-008",
    name: "Multi Estação",
    type: "musculacao",
    category: "Completo",
  },
  {
    id: "eq-musc-completo-009",
    name: "Cross Over",
    type: "musculacao",
    category: "Completo",
  },
  {
    id: "eq-musc-completo-010",
    name: "Torre Funcional",
    type: "musculacao",
    category: "Completo",
  },

  // ============================================
  // EQUIPAMENTOS FUNCIONAL
  // ============================================
  {
    id: "eq-func-001",
    name: "Kettlebell",
    type: "funcional",
    category: "Funcional",
  },
  {
    id: "eq-func-002",
    name: "Medicine Ball",
    type: "funcional",
    category: "Funcional",
  },
  {
    id: "eq-func-003",
    name: "TRX",
    type: "funcional",
    category: "Funcional",
  },
  {
    id: "eq-func-004",
    name: "Corda de Batalha",
    type: "funcional",
    category: "Funcional",
  },
  {
    id: "eq-func-005",
    name: "Box Jump",
    type: "funcional",
    category: "Funcional",
  },
  {
    id: "eq-func-006",
    name: "Bola Suíça",
    type: "funcional",
    category: "Funcional",
  },
  {
    id: "eq-func-007",
    name: "Rolamento Abdominal",
    type: "funcional",
    category: "Funcional",
  },
  {
    id: "eq-func-008",
    name: "Escada de Agilidade",
    type: "funcional",
    category: "Funcional",
  },
  {
    id: "eq-func-009",
    name: "Pneus",
    type: "funcional",
    category: "Funcional",
  },
  {
    id: "eq-func-010",
    name: "Barras Olímpicas",
    type: "funcional",
    category: "Funcional",
  },
  {
    id: "eq-func-011",
    name: "Halteres",
    type: "funcional",
    category: "Funcional",
  },
  {
    id: "eq-func-012",
    name: "Anilhas",
    type: "funcional",
    category: "Funcional",
  },
  {
    id: "eq-func-013",
    name: "Barras Paralelas",
    type: "funcional",
    category: "Funcional",
  },
  {
    id: "eq-func-014",
    name: "Paralelas Baixas",
    type: "funcional",
    category: "Funcional",
  },
  {
    id: "eq-func-015",
    name: "Barras de Suspensão",
    type: "funcional",
    category: "Funcional",
  },
  {
    id: "eq-func-016",
    name: "Escada de Corda",
    type: "funcional",
    category: "Funcional",
  },
  {
    id: "eq-func-017",
    name: "Wall Ball",
    type: "funcional",
    category: "Funcional",
  },
  {
    id: "eq-func-018",
    name: "Sandbag",
    type: "funcional",
    category: "Funcional",
  },
  {
    id: "eq-func-019",
    name: "Battling Ropes",
    type: "funcional",
    category: "Funcional",
  },
  {
    id: "eq-func-020",
    name: "Slamball",
    type: "funcional",
    category: "Funcional",
  },
  {
    id: "eq-func-021",
    name: "Bola Bosu",
    type: "funcional",
    category: "Funcional",
  },
  {
    id: "eq-func-022",
    name: "Disco de Equilíbrio",
    type: "funcional",
    category: "Funcional",
  },
  {
    id: "eq-func-023",
    name: "Prancha de Equilíbrio",
    type: "funcional",
    category: "Funcional",
  },
  {
    id: "eq-func-024",
    name: "Rolamento de Espuma",
    type: "funcional",
    category: "Funcional",
  },
  {
    id: "eq-func-025",
    name: "Bancos de Agachamento",
    type: "funcional",
    category: "Funcional",
  },
  {
    id: "eq-func-026",
    name: "Step",
    type: "funcional",
    category: "Funcional",
  },
  {
    id: "eq-func-027",
    name: "Pulley Baixo",
    type: "funcional",
    category: "Funcional",
  },
  {
    id: "eq-func-028",
    name: "Pulley Alto",
    type: "funcional",
    category: "Funcional",
  },
  {
    id: "eq-func-029",
    name: "Corda de Pular",
    type: "funcional",
    category: "Funcional",
  },
  {
    id: "eq-func-030",
    name: "Barras de Tração",
    type: "funcional",
    category: "Funcional",
  },
];
