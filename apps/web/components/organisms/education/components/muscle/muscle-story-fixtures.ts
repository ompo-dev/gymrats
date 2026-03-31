import type { ExerciseInfo, MuscleGroup, MuscleInfo } from "@/lib/types";

export const muscleGroupLabels: Record<MuscleGroup, string> = {
  peito: "Peito",
  costas: "Costas",
  pernas: "Pernas",
  ombros: "Ombros",
  bracos: "Bracos",
  core: "Core",
  gluteos: "Gluteos",
  cardio: "Cardio",
  funcional: "Funcional",
};

export function getDifficultyClasses(difficulty: string) {
  switch (difficulty) {
    case "iniciante":
      return "bg-duo-green/20 text-duo-green";
    case "intermediario":
      return "bg-duo-yellow/20 text-duo-yellow";
    case "avancado":
      return "bg-duo-red/20 text-duo-red";
    default:
      return "bg-duo-blue/20 text-duo-blue";
  }
}

export const muscleLibrary: MuscleInfo[] = [
  {
    id: "pectoralis-major",
    name: "Peitoral Maior",
    scientificName: "Pectoralis Major",
    group: "peito",
    description: "Musculo principal de empurrar do tronco superior.",
    functions: [
      "Aducao do braco",
      "Flexao horizontal do ombro",
      "Suporte a movimentos de empurrar",
    ],
    commonExercises: ["Supino reto", "Supino inclinado", "Crossover"],
    anatomyFacts: [
      "Tem cabecas clavicular e esternal",
      "Responde bem a diferentes angulos de supino",
    ],
  },
  {
    id: "latissimus-dorsi",
    name: "Grande Dorsal",
    scientificName: "Latissimus Dorsi",
    group: "costas",
    description: "Musculo amplo que contribui para a largura das costas.",
    functions: [
      "Extensao do ombro",
      "Aducao do braco",
      "Estabilidade do tronco superior",
    ],
    commonExercises: ["Barra fixa", "Pulldown", "Remada"],
    anatomyFacts: [
      "Importante para movimentos de puxar",
      "Contribui para o formato em V",
    ],
  },
  {
    id: "quadriceps",
    name: "Quadriceps",
    scientificName: "Quadriceps Femoris",
    group: "pernas",
    description: "Grupo muscular dominante da parte anterior da coxa.",
    functions: ["Extensao do joelho", "Estabilidade da patela"],
    commonExercises: ["Agachamento", "Leg press", "Avanco"],
    anatomyFacts: [
      "E formado por quatro musculos",
      "Tem alto papel em locomocao e potencia",
    ],
  },
];

export const groupedMuscles: [string, MuscleInfo[]][] = [
  ["peito", [muscleLibrary[0]]],
  ["costas", [muscleLibrary[1]]],
  ["pernas", [muscleLibrary[2]]],
];

export const exerciseLibrary: ExerciseInfo[] = [
  {
    id: "bench-press",
    name: "Supino Reto",
    primaryMuscles: ["peito"],
    secondaryMuscles: ["ombros", "bracos"],
    difficulty: "intermediario",
    equipment: ["Barra", "Banco"],
    instructions: [
      "Apoie os pes no chao",
      "Desca a barra com controle",
      "Empurre ate a extensao dos cotovelos",
    ],
    tips: [
      "Mantenha as escapulas estabilizadas",
      "Evite cotovelos totalmente abertos",
    ],
    commonMistakes: ["Perder controle na descida", "Arredondar ombros"],
    benefits: ["Forca de empurrar", "Desenvolvimento do peitoral"],
    scientificEvidence:
      "Boas revisoes mostram alta ativacao do peitoral em supino reto bem executado.",
  },
  {
    id: "pull-up",
    name: "Barra Fixa",
    primaryMuscles: ["costas"],
    secondaryMuscles: ["bracos", "core"],
    difficulty: "avancado",
    equipment: ["Barra fixa"],
    instructions: [
      "Inicie em suspensao",
      "Puxe o corpo ate o queixo passar da barra",
      "Desca controlando a fase eccentrica",
    ],
    tips: ["Evite impulso excessivo", "Mantenha o tronco firme"],
    commonMistakes: ["Encolher ombros", "Perder amplitude"],
    benefits: ["Forca relativa", "Largura dorsal"],
  },
  {
    id: "squat",
    name: "Agachamento Livre",
    primaryMuscles: ["pernas", "gluteos"],
    secondaryMuscles: ["core"],
    difficulty: "intermediario",
    equipment: ["Barra", "Rack"],
    instructions: [
      "Posicione os pes na largura dos ombros",
      "Desca com controle",
      "Suba empurrando o chao",
    ],
    tips: ["Mantenha o core ativo", "Alinhe joelhos e pes"],
    commonMistakes: ["Joelhos colapsando", "Perder profundidade"],
    benefits: ["Forca global", "Estabilidade", "Potencia"],
  },
];

export const groupedExercises = [
  { muscleGroup: "peito" as MuscleGroup, exercises: [exerciseLibrary[0]] },
  { muscleGroup: "costas" as MuscleGroup, exercises: [exerciseLibrary[1]] },
  { muscleGroup: "pernas" as MuscleGroup, exercises: [exerciseLibrary[2]] },
];
