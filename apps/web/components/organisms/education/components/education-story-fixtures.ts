import type { EducationalLesson } from "@/lib/types";

export const educationCategoryOptions = [
  { value: "all", label: "Todas", emoji: "AL" },
  { value: "training-science", label: "Treino", emoji: "TR" },
  { value: "nutrition", label: "Nutricao", emoji: "NU" },
  { value: "recovery", label: "Recuperacao", emoji: "RE" },
  { value: "anatomy", label: "Anatomia", emoji: "AN" },
  { value: "form", label: "Forma", emoji: "FO" },
];

export const educationCategoryLabels: Record<string, string> = {
  anatomy: "Anatomia",
  nutrition: "Nutricao",
  "training-science": "Treino",
  recovery: "Recuperacao",
  form: "Forma",
};

export const educationCategoryIcons: Record<string, string> = {
  anatomy: "AN",
  nutrition: "NU",
  "training-science": "TR",
  recovery: "RE",
  form: "FO",
};

export const educationCategoryColors: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  anatomy: {
    bg: "bg-duo-blue/20",
    text: "text-duo-blue",
    border: "border-duo-blue",
  },
  nutrition: {
    bg: "bg-duo-green/20",
    text: "text-duo-green",
    border: "border-duo-green",
  },
  "training-science": {
    bg: "bg-duo-yellow/20",
    text: "text-duo-yellow",
    border: "border-duo-yellow",
  },
  recovery: {
    bg: "bg-duo-orange/20",
    text: "text-duo-orange",
    border: "border-duo-orange",
  },
  form: {
    bg: "bg-duo-red/20",
    text: "text-duo-red",
    border: "border-duo-red",
  },
};

export function getEducationCategoryIcon(category: string) {
  return educationCategoryIcons[category] ?? "ED";
}

export function getEducationCategoryLabel(category: string) {
  return educationCategoryLabels[category] ?? category;
}

export function getEducationCategoryColor(category: string) {
  return (
    educationCategoryColors[category] ?? {
      bg: "bg-duo-blue/20",
      text: "text-duo-blue",
      border: "border-duo-blue",
    }
  );
}

export const educationLessonLibrary: EducationalLesson[] = [
  {
    id: "lesson-hypertrophy",
    title: "Ciencia da Hipertrofia",
    category: "training-science",
    content: `## Fundamentos

Hipertrofia depende de **sobrecarga progressiva**, recuperacao e consistencia.

### Drivers principais

1. Tensao mecanica
2. Estresse metabolico
3. Recuperacao adequada

- Volume semanal entre 10 e 20 series
- Frequencia de 2 a 3 vezes por semana
- Progressao de carga ao longo do ciclo`,
    keyPoints: [
      "Tensao mecanica e o principal estimulo",
      "Volume total precisa ser acompanhado",
      "Recuperacao sustenta adaptacao",
    ],
    duration: 8,
    xpReward: 25,
    completed: false,
    quiz: {
      questions: [
        {
          question: "Qual e o principal driver de hipertrofia?",
          options: [
            "Tempo de treino",
            "Tensao mecanica",
            "Alongamento passivo",
            "Cafeina",
          ],
          correctAnswer: 1,
          explanation:
            "A sobrecarga progressiva cria tensao suficiente para sinalizar adaptacao muscular.",
        },
        {
          question: "Qual faixa de series semanais e comum para hipertrofia?",
          options: ["2 a 4", "5 a 8", "10 a 20", "30 a 40"],
          correctAnswer: 2,
          explanation:
            "A maioria das revisoes aponta 10 a 20 series por grupo muscular como faixa eficiente.",
        },
      ],
    },
  },
  {
    id: "lesson-protein",
    title: "Proteina e Sintese Muscular",
    category: "nutrition",
    content: `## Proteina no dia

Distribuir proteina ao longo do dia ajuda na sintese muscular.

**Boas fontes**

- Ovos
- Carnes magras
- Iogurte
- Leguminosas`,
    keyPoints: [
      "Distribuicao ao longo do dia importa",
      "Leucina e relevante para a resposta anabolica",
    ],
    duration: 6,
    xpReward: 20,
    completed: true,
    quiz: {
      questions: [
        {
          question: "Qual nutriente e foco principal desta licao?",
          options: ["Gordura", "Proteina", "Fibra", "Sodio"],
          correctAnswer: 1,
        },
      ],
    },
  },
  {
    id: "lesson-recovery",
    title: "Recuperacao para Crescer",
    category: "recovery",
    content: `## Recuperacao

Dormir bem e reduzir fadiga melhora a resposta ao treino.

- Sono de qualidade
- Hidratacao
- Gestao de estresse`,
    keyPoints: ["Sono e uma alavanca central", "Nao existe progresso sem recuperacao"],
    duration: 5,
    xpReward: 15,
    completed: false,
  },
];

export const educationLessonsByCategory = {
  "training-science": [educationLessonLibrary[0]],
  nutrition: [educationLessonLibrary[1]],
  recovery: [educationLessonLibrary[2]],
};
