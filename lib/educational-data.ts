import type { MuscleInfo, ExerciseInfo, EducationalLesson } from "./types"

export const muscleDatabase: MuscleInfo[] = [
  {
    id: "pectoralis-major",
    name: "Peitoral Maior",
    scientificName: "Pectoralis Major",
    group: "peito",
    description: "Músculo grande e em forma de leque que cobre a maior parte da parede torácica anterior.",
    functions: [
      "Adução do braço (trazer o braço em direção ao corpo)",
      "Flexão do ombro (elevar o braço para frente)",
      "Rotação interna do braço",
      "Auxilia na respiração forçada",
    ],
    commonExercises: ["Supino reto", "Supino inclinado", "Crucifixo", "Flexão de braço", "Crossover"],
    anatomyFacts: [
      "Possui duas cabeças: clavicular (superior) e esternocostal (inferior)",
      "A cabeça clavicular é mais ativada em movimentos inclinados",
      "É um dos músculos mais treináveis e responsivos do corpo",
      "Recebe suprimento sanguíneo das artérias torácica e acromial",
    ],
  },
  {
    id: "latissimus-dorsi",
    name: "Grande Dorsal",
    scientificName: "Latissimus Dorsi",
    group: "costas",
    description: "O músculo mais largo das costas, responsável pela aparência em V do tronco.",
    functions: [
      "Extensão do ombro (puxar o braço para trás)",
      "Adução do braço",
      "Rotação interna do ombro",
      "Auxilia na respiração forçada",
    ],
    commonExercises: ["Barra fixa", "Pulldown", "Remada curvada", "Pullover", "Remada unilateral"],
    anatomyFacts: [
      "Origina-se na coluna vertebral inferior e pelve",
      "Insere-se no úmero (osso do braço)",
      "É o músculo mais largo do corpo humano",
      "Crucial para movimentos de escalada e natação",
    ],
  },
  {
    id: "quadriceps",
    name: "Quadríceps",
    scientificName: "Quadriceps Femoris",
    group: "pernas",
    description: "Grupo muscular composto por quatro músculos na parte frontal da coxa.",
    functions: [
      "Extensão do joelho (esticar a perna)",
      "Flexão do quadril (reto femoral)",
      "Estabilização da patela",
      "Suporte para caminhar, correr e pular",
    ],
    commonExercises: ["Agachamento", "Leg press", "Cadeira extensora", "Avanço", "Afundo"],
    anatomyFacts: [
      "Composto por: reto femoral, vasto lateral, vasto medial e vasto intermédio",
      "O reto femoral é o único que cruza duas articulações (quadril e joelho)",
      "Vasto medial é crucial para estabilidade do joelho",
      "Um dos grupos musculares mais fortes do corpo",
    ],
  },
  {
    id: "deltoid",
    name: "Deltoide",
    scientificName: "Deltoideus",
    group: "ombros",
    description: "Músculo triangular que cobre a articulação do ombro, responsável pela aparência arredondada.",
    functions: [
      "Abdução do braço (elevar lateralmente)",
      "Flexão do ombro (deltoide anterior)",
      "Extensão do ombro (deltoide posterior)",
      "Rotação do braço",
    ],
    commonExercises: [
      "Desenvolvimento militar",
      "Elevação lateral",
      "Elevação frontal",
      "Remada alta",
      "Crucifixo invertido",
    ],
    anatomyFacts: [
      "Possui três cabeças: anterior, lateral e posterior",
      "Cada cabeça tem funções distintas",
      "Essencial para a mobilidade do ombro em todos os planos",
      "Altamente vascularizado, permitindo recuperação rápida",
    ],
  },
  {
    id: "biceps-brachii",
    name: "Bíceps Braquial",
    scientificName: "Biceps Brachii",
    group: "bracos",
    description: "Músculo de duas cabeças localizado na parte frontal do braço.",
    functions: [
      "Flexão do cotovelo (dobrar o braço)",
      "Supinação do antebraço (virar a palma para cima)",
      "Flexão leve do ombro",
      "Estabilização do ombro",
    ],
    commonExercises: ["Rosca direta", "Rosca martelo", "Rosca scott", "Rosca inclinada", "Rosca concentrada"],
    anatomyFacts: [
      "Possui cabeça longa e cabeça curta",
      "A cabeça longa é mais ativa na rosca inclinada",
      "Atravessa duas articulações: ombro e cotovelo",
      "Trabalha em conjunto com o braquial para flexão do cotovelo",
    ],
  },
  {
    id: "rectus-abdominis",
    name: "Reto Abdominal",
    scientificName: "Rectus Abdominis",
    group: "core",
    description: "Músculo longo e plano que forma os 'gominhos' abdominais quando desenvolvido.",
    functions: [
      "Flexão do tronco (aproximar tórax da pelve)",
      "Estabilização da coluna vertebral",
      "Compressão dos órgãos abdominais",
      "Auxilia na respiração forçada e tosse",
    ],
    commonExercises: ["Abdominal tradicional", "Crunch", "Elevação de pernas", "Prancha", "Abdominal na roldana"],
    anatomyFacts: [
      "Separado pela linha alba no centro",
      "Dividido por intersecções tendíneas que criam os 'gominhos'",
      "O número de gominhos visíveis é genético",
      "Trabalha 24/7 para estabilização postural",
    ],
  },
  {
    id: "gluteus-maximus",
    name: "Glúteo Máximo",
    scientificName: "Gluteus Maximus",
    group: "gluteos",
    description: "O maior e mais superficial dos três músculos glúteos, formando as nádegas.",
    functions: [
      "Extensão do quadril (levar a perna para trás)",
      "Rotação lateral do quadril",
      "Estabilização da pelve",
      "Auxílio na posição ereta",
    ],
    commonExercises: ["Agachamento", "Levantamento terra", "Hip thrust", "Stiff", "Passada"],
    anatomyFacts: [
      "É o maior músculo do corpo humano",
      "Crucial para locomoção bípede (andar ereto)",
      "Altamente responsivo a treino de força",
      "Essencial para corrida e saltos",
    ],
  },
]

export const exerciseDatabase: ExerciseInfo[] = [
  {
    id: "bench-press",
    name: "Supino Reto",
    primaryMuscles: ["peito"],
    secondaryMuscles: ["ombros", "bracos"],
    difficulty: "intermediario",
    equipment: ["Barra", "Banco", "Anilhas"],
    instructions: [
      "Deite-se no banco com os pés apoiados no chão",
      "Pegue a barra com pegada ligeiramente mais larga que os ombros",
      "Desça a barra controladamente até tocar o peito",
      "Empurre a barra de volta à posição inicial",
      "Mantenha os omoplatas retraídos durante todo o movimento",
    ],
    tips: [
      "Mantenha os cotovelos a 45 graus do corpo, não 90 graus",
      "Crie um pequeno arco nas costas",
      "Empurre através da linha média do peito",
      "Respire fundo antes de descer, expire ao empurrar",
    ],
    commonMistakes: [
      "Bater a barra no peito sem controle",
      "Cotovelos muito abertos (90 graus)",
      "Tirar os glúteos do banco",
      "Não usar amplitude completa",
      "Movimentos assimétricos da barra",
    ],
    benefits: [
      "Desenvolvimento completo do peitoral",
      "Aumento de força do tronco superior",
      "Transferência para movimentos funcionais de empurrar",
      "Estímulo hormonal para crescimento muscular",
    ],
    scientificEvidence:
      "Estudos eletromiográficos mostram que o supino reto ativa significativamente as três porções do peitoral, com ênfase na porção esternocostal.",
  },
  {
    id: "squat",
    name: "Agachamento Livre",
    primaryMuscles: ["pernas", "gluteos"],
    secondaryMuscles: ["core", "costas"],
    difficulty: "intermediario",
    equipment: ["Barra", "Rack", "Anilhas"],
    instructions: [
      "Posicione a barra sobre o trapézio superior",
      "Pés na largura dos ombros, ligeiramente abertos",
      "Desça flexionando quadris e joelhos simultaneamente",
      "Mantenha o tronco ereto e joelhos alinhados com os pés",
      "Desça até quadris abaixo da linha dos joelhos",
      "Suba empurrando através dos calcanhares",
    ],
    tips: [
      "Mantenha o core contraído durante todo movimento",
      "Olhe ligeiramente para cima para manter coluna neutra",
      "Joelhos devem seguir a direção dos pés",
      "Inspire na descida, expire na subida",
    ],
    commonMistakes: [
      "Joelhos colapsando para dentro",
      "Calcanhar saindo do chão",
      "Tronco inclinando demais para frente",
      "Não atingir profundidade adequada",
      "Perder tensão no core",
    ],
    benefits: [
      "Desenvolvimento completo de membros inferiores",
      "Aumento de força funcional",
      "Estímulo à produção de hormônios anabólicos",
      "Melhora de mobilidade e estabilidade",
      "Fortalecimento do core",
    ],
    scientificEvidence:
      "Pesquisas demonstram que o agachamento profundo ativa mais fibras dos quadríceps e glúteos comparado ao agachamento parcial, além de ser seguro para joelhos saudáveis.",
  },
  {
    id: "deadlift",
    name: "Levantamento Terra",
    primaryMuscles: ["costas", "gluteos", "pernas"],
    secondaryMuscles: ["core", "bracos"],
    difficulty: "avancado",
    equipment: ["Barra", "Anilhas"],
    instructions: [
      "Posicione-se com pés sob a barra, na largura dos quadris",
      "Segure a barra com pegada pronada ou mista",
      "Mantenha coluna neutra, peito para cima",
      "Empurre o chão com os pés enquanto puxa a barra",
      "Estenda quadris e joelhos simultaneamente",
      "Finalize em posição ereta com ombros para trás",
    ],
    tips: [
      "A barra deve deslizar próxima ao corpo",
      "Ative o latíssimo para estabilizar a barra",
      "Pense em 'empurrar o chão' e não 'puxar a barra'",
      "Mantenha o core fortemente contraído",
    ],
    commonMistakes: [
      "Arredondar a coluna lombar",
      "Barra longe do corpo",
      "Puxar com os braços ao invés das pernas",
      "Hiperextensão na posição final",
      "Descer a barra sem controle",
    ],
    benefits: [
      "Exercício mais completo para corpo todo",
      "Desenvolvimento extremo de força posterior",
      "Fortalecimento de pegada",
      "Melhora de postura",
      "Alto gasto calórico",
    ],
    scientificEvidence:
      "Considerado o exercício com maior ativação muscular total, recrutando mais de 200 músculos simultaneamente segundo análises biomecânicas.",
  },
  {
    id: "pull-up",
    name: "Barra Fixa",
    primaryMuscles: ["costas"],
    secondaryMuscles: ["bracos", "ombros", "core"],
    difficulty: "intermediario",
    equipment: ["Barra fixa"],
    instructions: [
      "Segure a barra com pegada pronada (palmas para frente)",
      "Mãos ligeiramente mais largas que os ombros",
      "Puxe os cotovelos para baixo e para trás",
      "Eleve o corpo até queixo passar a barra",
      "Desça controladamente até extensão completa",
    ],
    tips: [
      "Inicie o movimento retraindo as escápulas",
      "Pense em puxar os cotovelos, não as mãos",
      "Mantenha o core ativo para evitar balanço",
      "Use pegada completa (polegar envolvendo a barra)",
    ],
    commonMistakes: [
      "Usar impulso do corpo (kipping)",
      "Não usar amplitude completa",
      "Projetar os ombros para frente",
      "Elevar apenas usando bíceps",
      "Não controlar a descida",
    ],
    benefits: [
      "Desenvolvimento completo das costas",
      "Melhora de força relativa",
      "Fortalecimento de pegada",
      "Desenvolvimento funcional",
      "Versatilidade (várias variações)",
    ],
    scientificEvidence:
      "EMG mostra que a barra fixa ativa significativamente mais o grande dorsal comparado a máquinas de pulldown, especialmente na fase excêntrica.",
  },
]

export const educationalLessons: EducationalLesson[] = [
  {
    id: "lesson-hypertrophy",
    title: "Ciência da Hipertrofia Muscular",
    category: "training-science",
    content: `
A hipertrofia muscular é o aumento do tamanho das células musculares através de três mecanismos principais:

1. **Tensão Mecânica**: O estímulo mais importante. Ocorre quando o músculo gera força contra resistência progressiva. Cargas de 60-85% de 1RM são ideais.

2. **Estresse Metabólico**: O "pump" sentido durante o treino. Acúmulo de metabólitos como lactato e íons de hidrogênio que sinalizam crescimento muscular.

3. **Dano Muscular**: Microlesões nas fibras durante o treino, especialmente na fase excêntrica, que estimulam reparo e crescimento.

**Princípios Fundamentais:**
- Volume total: 10-20 séries por grupo muscular por semana
- Frequência: 2-3x por semana por músculo
- Intensidade: 6-12 repetições para hipertrofia
- Progressão de carga é essencial

**Evidências Científicas:**
Estudos recentes (Schoenfeld, 2021) mostram que o volume total de treino é o fator mais correlacionado com ganhos musculares, seguido por frequência e progressão de carga.
    `,
    keyPoints: [
      "Tensão mecânica é o driver primário de hipertrofia",
      "10-20 séries semanais por grupo muscular",
      "Progressão de carga é essencial",
      "Recuperação adequada é fundamental",
    ],
    duration: 8,
    xpReward: 25,
    completed: false,
    quiz: {
      questions: [
        {
          question: "Qual é o mecanismo mais importante para hipertrofia?",
          options: ["Estresse metabólico", "Tensão mecânica", "Dano muscular", "Tempo sob tensão"],
          correctAnswer: 1,
        },
        {
          question: "Qual volume semanal é recomendado por grupo muscular?",
          options: ["5-10 séries", "10-20 séries", "20-30 séries", "30-40 séries"],
          correctAnswer: 1,
        },
      ],
    },
  },
  {
    id: "lesson-protein",
    title: "Proteína e Síntese Muscular",
    category: "nutrition",
    content: `
A proteína é essencial para construção e reparo muscular. Entenda como otimizar:

**Quantidade Diária:**
- Iniciantes: 1.6g/kg de peso corporal
- Intermediários/Avançados: 2.0-2.2g/kg
- Cutting: Até 2.4g/kg para preservar massa magra

**Timing:**
- Janela anabólica: 24-48h após o treino (não apenas 30min)
- Distribuir em 4-5 refeições de 25-40g
- Proteína antes de dormir previne catabolismo noturno

**Fontes de Qualidade:**
- Alto valor biológico: ovos, whey, carne, peixe
- Vegetais: combinação de leguminosas e cereais
- Leucina é o aminoácido-chave: 2-3g por refeição

**Síntese Proteica Muscular (MPS):**
Maximizada com 25-40g de proteína de qualidade. Mais que isso não aumenta MPS proporcionalmente.
    `,
    keyPoints: [
      "1.6-2.2g de proteína por kg de peso corporal",
      "Distribuir em múltiplas refeições",
      "Leucina é crucial para MPS",
      "Janela anabólica dura 24-48h",
    ],
    duration: 6,
    xpReward: 20,
    completed: false,
    quiz: {
      questions: [
        {
          question: "Quanto de proteína por kg é recomendado para hipertrofia?",
          options: ["1.0-1.2g/kg", "1.6-2.2g/kg", "3.0-4.0g/kg", "0.8g/kg"],
          correctAnswer: 1,
        },
      ],
    },
  },
  {
    id: "lesson-recovery",
    title: "Recuperação e Crescimento Muscular",
    category: "recovery",
    content: `
O crescimento muscular ocorre durante o descanso, não durante o treino. Otimize sua recuperação:

**Sono:**
- 7-9 horas por noite
- Durante o sono profundo ocorre 70% da secreção de GH
- Falta de sono reduz síntese proteica em até 18%

**Nutrição Pós-Treino:**
- Proteína: 25-40g
- Carboidratos: 0.5-1g/kg para repor glicogênio
- Timing flexível dentro de 24h

**Técnicas de Recuperação:**
- Alongamento e mobilidade
- Massagem e foam rolling
- Crioterapia e contraste térmico
- Recuperação ativa (caminhada leve)

**Overtraining:**
Sinais: fadiga persistente, insônia, queda de performance, aumento de cortisol. Respeite os dias de descanso.
    `,
    keyPoints: [
      "7-9 horas de sono são essenciais",
      "Nutrição pós-treino dentro de 24h",
      "Recuperação ativa ajuda",
      "Overtraining prejudica ganhos",
    ],
    duration: 7,
    xpReward: 20,
    completed: false,
  },
]
