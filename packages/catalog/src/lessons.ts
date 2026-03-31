import type { EducationalLesson } from "@gymrats/types";

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
          options: [
            "Estresse metabólico",
            "Tensão mecânica",
            "Dano muscular",
            "Tempo sob tensão",
          ],
          correctAnswer: 1,
          explanation:
            "A tensão mecânica é considerada o principal mecanismo de hipertrofia. Estudos mostram que é necessário aplicar sobrecarga progressiva (aumentar carga, séries ou repetições) para criar estímulo suficiente para crescimento muscular.",
        },
        {
          question: "Qual volume semanal é recomendado por grupo muscular?",
          options: [
            "5-10 séries",
            "10-20 séries",
            "20-30 séries",
            "30-40 séries",
          ],
          correctAnswer: 1,
          explanation:
            "Para a maioria dos praticantes, 10-20 séries semanais por grupo muscular é o volume ideal. Menos de 10 séries pode ser insuficiente para hipertrofia, enquanto mais de 30 séries pode levar a overreaching e reduzir recuperação.",
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
  {
    id: "lesson-periodization",
    title: "Periodização do Treinamento",
    category: "training-science",
    content: `
A periodização é a organização sistemática do treinamento ao longo do tempo para maximizar adaptações e prevenir estagnação.

**Tipos de Periodização:**

1. **Linear**: Aumento progressivo de intensidade com redução de volume
   - Fase 1: Alta volume, baixa intensidade (8-12 reps)
   - Fase 2: Volume médio, intensidade média (6-8 reps)
   - Fase 3: Baixo volume, alta intensidade (3-6 reps)

2. **Não-Linear (Undulating)**: Variação diária/semanal de intensidade
   - Dia 1: Alta volume (3x12)
   - Dia 2: Força (5x5)
   - Dia 3: Potência (4x3)

3. **Blocos**: Períodos focados (3-4 semanas cada)
   - Bloco 1: Acumulação (volume)
   - Bloco 2: Intensificação (força)
   - Bloco 3: Realização (potência)

**Benefícios:**
- Previne estagnação e platôs
- Maximiza adaptações específicas
- Reduz risco de overtraining
- Melhora performance a longo prazo

**Evidências:**
Meta-análises mostram 13-20% maiores ganhos com periodização comparado a treino não-periodizado (Rhea et al., 2003).
    `,
    keyPoints: [
      "Variação sistemática de volume e intensidade",
      "Previne estagnação e overtraining",
      "3 tipos principais: linear, não-linear e blocos",
      "Pode aumentar ganhos em 13-20%",
    ],
    duration: 10,
    xpReward: 30,
    completed: false,
    quiz: {
      questions: [
        {
          question: "Qual é o principal benefício da periodização?",
          options: [
            "Aumentar volume sempre",
            "Prevenir estagnação e maximizar adaptações",
            "Treinar mais vezes por semana",
            "Reduzir tempo de treino",
          ],
          correctAnswer: 1,
        },
        {
          question:
            "Na periodização linear, o que acontece com a intensidade ao longo do tempo?",
          options: [
            "Permanecer constante",
            "Aumentar progressivamente",
            "Diminuir",
            "Variar aleatoriamente",
          ],
          correctAnswer: 1,
        },
        {
          question: "Quantos tipos principais de periodização existem?",
          options: ["1", "2", "3", "4"],
          correctAnswer: 2,
        },
      ],
    },
  },
  {
    id: "lesson-carbs",
    title: "Carboidratos e Performance",
    category: "nutrition",
    content: `
Os carboidratos são a principal fonte de energia para exercícios de alta intensidade e fundamentais para recuperação.

**Funções Principais:**
- Reposição de glicogênio muscular e hepático
- Fornece energia para exercícios de força e HIIT
- Preserva proteína muscular (efeito poupador)
- Melhora recuperação pós-treino

**Necessidades por Tipo de Treino:**

**Treino de Força (Resistência):**
- 4-6g/kg de peso corporal
- Exemplo: 80kg = 320-480g/dia
- Timing: 40-60g antes e 1-1.2g/kg após treino

**Cardio de Alta Intensidade:**
- 6-8g/kg de peso corporal
- Importante para repor glicogênio rapidamente

**Treino Leve/Descanso:**
- 3-4g/kg de peso corporal
- Reduzir carboidratos em dias off mantém sensibilidade à insulina

**Tipos de Carboidratos:**
- **Rápidos** (alto IG): Arroz branco, batata, dextrose - pós-treino
- **Moderados**: Aveia, batata doce, quinoa - refeições gerais
- **Lentos** (baixo IG): Leguminosas, vegetais - antes de dormir

**Timing Estratégico:**
- Pré-treino (1-2h antes): 30-60g de carboidratos moderados
- Pós-treino (até 2h): 1-1.2g/kg para repor glicogênio
- Janela crítica: 30min-2h pós-treino é ideal mas não obrigatória

**Evidências:**
Consumo de carboidratos após treino aumenta síntese de glicogênio em 300% comparado a jejum (Ivy et al., 2002).
    `,
    keyPoints: [
      "4-6g/kg para treino de força",
      "Glicogênio é energia primária para exercícios",
      "Timing pós-treino maximiza reposição",
      "Preserva proteína muscular",
    ],
    duration: 8,
    xpReward: 25,
    completed: false,
    quiz: {
      questions: [
        {
          question:
            "Quantos gramas de carboidrato por kg são recomendados para treino de força?",
          options: ["2-3g/kg", "4-6g/kg", "8-10g/kg", "1-2g/kg"],
          correctAnswer: 1,
        },
        {
          question: "Qual é a função principal dos carboidratos no exercício?",
          options: [
            "Aumentar massa muscular",
            "Fornecer energia e repor glicogênio",
            "Queimar gordura",
            "Aumentar testosterona",
          ],
          correctAnswer: 1,
          explanation:
            "Os carboidratos são a principal fonte de energia durante exercícios de alta intensidade. Eles são convertidos em glicose e armazenados como glicogênio nos músculos e fígado, fornecendo combustível rápido para contrações musculares e repondo os estoques após o treino.",
        },
        {
          question: "Qual tipo de carboidrato é melhor pós-treino?",
          options: [
            "Carboidratos de baixo índice glicêmico",
            "Carboidratos de alto índice glicêmico",
            "Apenas fibra",
            "Não importa",
          ],
          correctAnswer: 1,
        },
      ],
    },
  },
  {
    id: "lesson-fats",
    title: "Gorduras e Saúde Hormonal",
    category: "nutrition",
    content: `
As gorduras são essenciais para produção hormonal, absorção de vitaminas e saúde geral.

**Funções Críticas:**
- Produção de testosterona e outros hormônios esteróides
- Absorção de vitaminas lipossolúveis (A, D, E, K)
- Regulação da inflamação
- Saúde cerebral e função cognitiva
- Fornece energia para atividades de baixa intensidade

**Necessidades Diárias:**
- Mínimo: 0.5g/kg (manter funções básicas)
- Ideal para atletas: 0.8-1.2g/kg
- Para produção hormonal ótima: 1-1.5g/kg

**Tipos de Gorduras:**

**Gorduras Saturadas:**
- Fontes: Carne, ovos, laticínios, óleo de coco
- Importante para produção de testosterona
- 30-40% da gordura total

**Gorduras Monoinsaturadas:**
- Fontes: Azeite, abacate, nozes, amendoim
- Reduzem colesterol LDL
- 40-50% da gordura total

**Gorduras Poli-insaturadas:**
- Ômega-3: Peixes gordos, linhaça, chia (anti-inflamatório)
- Ômega-6: Óleos vegetais (moderar consumo)
- 20-30% da gordura total

**Gorduras Trans:**
- Evitar completamente (processados, margarina)

**Impacto Hormonal:**
Dietas muito baixas em gordura (<15% calorias) podem reduzir testosterona em 10-15%. Gorduras saturadas e monoinsaturadas são especialmente importantes para síntese hormonal.

**Timing:**
Distribuir ao longo do dia. Não há necessidade de timing específico pós-treino para gorduras.
    `,
    keyPoints: [
      "0.8-1.2g/kg de gordura diária",
      "Essencial para produção hormonal",
      "30-40% saturadas, 40-50% monoinsaturadas",
      "Dietas muito baixas em gordura reduzem testosterona",
    ],
    duration: 7,
    xpReward: 25,
    completed: false,
    quiz: {
      questions: [
        {
          question:
            "Qual é a função mais importante das gorduras para atletas?",
          options: [
            "Fornecer energia rápida",
            "Produção hormonal e saúde celular",
            "Aumentar massa muscular diretamente",
            "Queimar gordura",
          ],
          correctAnswer: 1,
        },
        {
          question: "Quantos gramas de gordura por kg são ideais para atletas?",
          options: ["0.2-0.4g/kg", "0.8-1.2g/kg", "2-3g/kg", "0.1g/kg"],
          correctAnswer: 1,
        },
        {
          question:
            "Qual tipo de gordura é especialmente importante para testosterona?",
          options: [
            "Gorduras trans",
            "Gorduras saturadas e monoinsaturadas",
            "Apenas ômega-3",
            "Não importa",
          ],
          correctAnswer: 1,
        },
      ],
    },
  },
  {
    id: "lesson-hiit-vs-steady",
    title: "HIIT vs Cardio Steady-State",
    category: "training-science",
    content: `
Entenda as diferenças entre treinos de alta intensidade (HIIT) e cardio contínuo de baixa intensidade.

**HIIT (High-Intensity Interval Training):**

**Características:**
- Intervalos curtos de esforço máximo (20-60s)
- Períodos de descanso ativo/passivo
- Duração total: 15-30 minutos
- 85-95% frequência cardíaca máxima

**Benefícios:**
- Melhora VO2 max mais rapidamente
- Queima mais calorias pós-treino (EPOC)
- Preserva massa muscular melhor
- Economia de tempo
- Melhora sensibilidade à insulina

**Desvantagens:**
- Alto estresse no sistema nervoso
- Requer mais recuperação
- Risco de lesão se técnica ruim
- Não ideal para iniciantes

**Cardio Steady-State (LISS):**

**Características:**
- Intensidade constante e moderada
- 60-70% frequência cardíaca máxima
- Duração: 30-60+ minutos
- Conversação possível

**Benefícios:**
- Baixo impacto no sistema nervoso
- Melhor para recuperação ativa
- Acesso fácil a iniciantes
- Melhora capacidade aeróbica de base
- Baixo risco de lesão

**Desvantagens:**
- Mais tempo necessário
- Menor EPOC
- Pode interferir com ganhos de força se excessivo

**Recomendações:**
- **Cutting**: HIIT 2-3x/semana para preservar músculo
- **Bulking**: LISS 1-2x/semana para não interferir na recuperação
- **Recomposição**: Mistura de ambos
- **Iniciantes**: Começar com LISS e gradualmente introduzir HIIT

**Evidências:**
HIIT pode queimar 25-30% mais calorias no mesmo tempo e melhorar condicionamento aeróbico em 3x menos tempo (Boutcher, 2011).
    `,
    keyPoints: [
      "HIIT: mais eficiente em tempo, maior EPOC",
      "LISS: melhor para recuperação e iniciantes",
      "HIIT preserva mais massa muscular no cutting",
      "Combinação de ambos é ideal",
    ],
    duration: 9,
    xpReward: 30,
    completed: false,
    quiz: {
      questions: [
        {
          question:
            "Qual é a principal vantagem do HIIT comparado ao cardio contínuo?",
          options: [
            "Mais tempo de treino",
            "Maior EPOC e economia de tempo",
            "Mais fácil de executar",
            "Melhor para iniciantes",
          ],
          correctAnswer: 1,
        },
        {
          question: "Qual é a frequência cardíaca ideal para HIIT?",
          options: [
            "50-60% FCmax",
            "60-70% FCmax",
            "85-95% FCmax",
            "40-50% FCmax",
          ],
          correctAnswer: 2,
        },
        {
          question: "Para cutting, qual tipo de cardio é mais recomendado?",
          options: [
            "Apenas LISS",
            "Apenas HIIT",
            "HIIT 2-3x por semana",
            "Não fazer cardio",
          ],
          correctAnswer: 2,
        },
      ],
    },
  },
  {
    id: "lesson-bulk-cut",
    title: "Bulk e Cut: Estratégias de Composição Corporal",
    category: "nutrition",
    content: `
Bulk e Cut são fases estratégicas para maximizar ganhos musculares e depois reduzir gordura corporal.

**Fase de Bulk (Volume):**

**Objetivo:**
Ganhar massa muscular com mínimo ganho de gordura.

**Estratégia Nutricional:**
- Superávit calórico moderado: +300-500 calorias/dia
- Ganho de peso: 0.25-0.5kg/semana (ideal)
- Proteína: 2.2-2.4g/kg
- Carboidratos: 5-6g/kg
- Gordura: 1-1.2g/kg

**Duração:**
- Iniciantes: 8-12 meses
- Intermediários: 4-6 meses
- Avançados: 2-4 meses

**Sinais de que está funcionando:**
- Ganho de força consistente
- Medidas corporais aumentando
- Ganho de peso controlado
- Recuperação adequada

**Fase de Cut (Definição):**

**Objetivo:**
Reduzir gordura preservando massa muscular.

**Estratégia Nutricional:**
- Déficit calórico: -300-750 calorias/dia
- Perda de peso: 0.5-1% do peso corporal/semana
- Proteína: 2.4-2.8g/kg (aumentar para preservar músculo)
- Carboidratos: 2-4g/kg (reduzir gradualmente)
- Gordura: 0.8-1g/kg (manter para hormônios)

**Duração:**
- 8-16 semanas (depende da gordura inicial)
- Não prolongar mais que necessário

**Sinais de que está funcionando:**
- Perda de gordura visível
- Força mantida ou levemente reduzida
- Músculos mais definidos
- Níveis de energia razoáveis

**Recomposição Corporal:**
Para iniciantes/intermediários: manter calorias em manutenção com treino e nutrição adequados permite ganhar músculo e perder gordura simultaneamente.

**Erros Comuns:**
- Bulk muito agressivo (+1000+ calorias) = ganho de gordura excessivo
- Cut muito agressivo (<1000 calorias) = perda de massa muscular
- Bulk infinito sem fase de cut
- Não ajustar macros durante cut
    `,
    keyPoints: [
      "Bulk: +300-500 calorias, 0.25-0.5kg/semana",
      "Cut: -300-750 calorias, 0.5-1% peso/semana",
      "Aumentar proteína no cut para preservar músculo",
      "Recomposição possível para iniciantes",
    ],
    duration: 10,
    xpReward: 30,
    completed: false,
    quiz: {
      questions: [
        {
          question: "Qual superávit calórico é ideal para um bulk eficiente?",
          options: [
            "+100-200 calorias",
            "+300-500 calorias",
            "+800-1000 calorias",
            "+1500 calorias",
          ],
          correctAnswer: 1,
        },
        {
          question:
            "Quanto de proteína por kg deve-se consumir durante um cut?",
          options: ["1.6g/kg", "2.0g/kg", "2.4-2.8g/kg", "3.5g/kg"],
          correctAnswer: 2,
        },
        {
          question: "Qual é a perda de peso semanal ideal durante um cut?",
          options: [
            "2-3% do peso corporal",
            "0.5-1% do peso corporal",
            "5% do peso corporal",
            "Não importa",
          ],
          correctAnswer: 1,
        },
      ],
    },
  },
  {
    id: "lesson-supplements",
    title: "Suplementação Baseada em Evidências",
    category: "nutrition",
    content: `
Nem todos os suplementos são necessários, mas alguns têm evidências científicas sólidas.

**Suplementos Essenciais (Tier 1):**

**1. Whey Protein:**
- Conveniência para atingir meta proteica
- Rápida absorção pós-treino
- Dose: 20-40g após treino ou entre refeições
- Evidência: Forte para conveniência e MPS

**2. Creatina Monohidratada:**
- Aumenta força e potência em 5-15%
- Melhora performance em séries de 6-12 reps
- Dose: 3-5g/dia (manutenção), 20g/dia por 5 dias (saturação)
- Evidência: Mais estudado, segurança comprovada

**3. Vitamina D3:**
- Importante para saúde óssea e imunidade
- Muitos atletas têm deficiência
- Dose: 2000-4000 UI/dia
- Evidência: Importante para quem treina em ambientes fechados

**Suplementos Úteis (Tier 2):**

**4. Cafeína:**
- Aumenta performance em 5-12%
- Reduz percepção de esforço
- Dose: 3-6mg/kg (200-400mg para 70kg)
- Timing: 30-60min antes do treino
- Evidência: Forte para performance

**5. Beta-Alanina:**
- Aumenta capacidade de trabalho em séries múltiplas
- Dose: 3-5g/dia
- Efeito: Formigamento normal (parestesia)
- Evidência: Moderada para resistência muscular

**6. Ômega-3 (EPA/DHA):**
- Anti-inflamatório
- Saúde cardiovascular
- Dose: 1-2g EPA+DHA/dia
- Evidência: Forte para saúde geral

**Suplementos Questionáveis:**
- BCAAs (desnecessário se consumir proteína suficiente)
- Testosterona boosters (evidência fraca)
- Termogênicos (efeito mínimo)
- Glutamina (desnecessário com dieta adequada)

**Evidências:**
Creatina é o suplemento mais estudado e eficaz para ganhos de força (Kreider et al., 2017). Café/cafeína tem evidência nível A para performance (Guest et al., 2021).
    `,
    keyPoints: [
      "Tier 1: Whey, Creatina, Vitamina D",
      "Tier 2: Cafeína, Beta-Alanina, Ômega-3",
      "Creatina: suplemento mais estudado e eficaz",
      "Muitos suplementos são desnecessários com dieta adequada",
    ],
    duration: 9,
    xpReward: 25,
    completed: false,
    quiz: {
      questions: [
        {
          question: "Qual suplemento tem a evidência científica mais forte?",
          options: [
            "BCAA",
            "Creatina Monohidratada",
            "Testosterona booster",
            "Glutamina",
          ],
          correctAnswer: 1,
        },
        {
          question:
            "Qual é a dose diária recomendada de creatina para manutenção?",
          options: ["1g/dia", "3-5g/dia", "20g/dia", "50g/dia"],
          correctAnswer: 1,
        },
        {
          question: "Quanto de cafeína é recomendado antes do treino?",
          options: [
            "50-100mg",
            "200-400mg (3-6mg/kg)",
            "500-800mg",
            "Não há recomendação",
          ],
          correctAnswer: 1,
        },
      ],
    },
  },
  {
    id: "lesson-injury-prevention",
    title: "Prevenção de Lesões no Treino",
    category: "training-science",
    content: `
Prevenir lesões é mais importante que tratar. Entenda como manter-se seguro no treino.

**Princípios Fundamentais:**

**1. Progressão Gradual:**
- Aumentar carga em 2.5-5% por semana máximo
- Volume: aumentar 1-2 séries por semana
- Não aumentar carga e volume simultaneamente
- Respeitar adaptação do tecido conjuntivo (mais lenta que músculo)

**2. Aquecimento Adequado:**
- 5-10 minutos de cardio leve (eleva temperatura corporal)
- Mobilidade dinâmica (não alongamento estático pré-treino)
- Séries de aquecimento progressivas (50%, 70%, 90% da carga de trabalho)
- Ativação de músculos específicos (glúteos, core, manguito rotador)

**3. Técnica Correta:**
- Priorizar forma sobre carga sempre
- Amplitude completa de movimento
- Controle excêntrico (descer devagar)
- Não usar impulso excessivo
- Alinhamento adequado (joelhos, coluna, punhos)

**4. Balanceamento Muscular:**
- Manter proporção flexor:extensor adequada
- Quadríceps:Isquiotibiais (3:2)
- Peitoral:Dorsais (1:2 em volume)
- Agonistas:Antagonistas equilibrados

**5. Recuperação:**
- 48-72h entre treinos do mesmo grupo muscular
- Sono adequado (7-9h)
- Hidratação (35-40ml/kg)
- Nutrição pós-treino
- Mobilidade e alongamento em dias off

**Lesões Comuns e Prevenção:**

**Ombros:**
- Fortalecer manguito rotador (rotações externas)
- Evitar impingimento (elevações muito altas)
- Aquecer adequadamente antes de exercícios de empurrar

**Lombar:**
- Fortalecer core e glúteos
- Manter coluna neutra em levantamentos
- Evitar flexão repetitiva da coluna

**Joelhos:**
- Fortalecer quadríceps e glúteos
- Alinhar joelhos com pés em agachamentos
- Evitar valgo dinâmico (joelho caindo para dentro)

**Cotovelos:**
- Balancear flexores:extensores
- Variar pegadas e ângulos
- Não fazer extensões excessivas

**Evidências:**
Programas de prevenção de lesões podem reduzir lesões em 30-50% (Lauersen et al., 2014). Aquecimento adequado reduz risco de lesão em 32% (Fradkin et al., 2010).
    `,
    keyPoints: [
      "Progressão gradual: 2.5-5% carga por semana",
      "Aquecimento reduz lesões em 32%",
      "Técnica sempre antes de carga",
      "Balanceamento muscular previne desequilíbrios",
    ],
    duration: 10,
    xpReward: 30,
    completed: false,
    quiz: {
      questions: [
        {
          question: "Qual é o aumento de carga semanal máximo recomendado?",
          options: ["10-15%", "2.5-5%", "20-30%", "Não importa"],
          correctAnswer: 1,
        },
        {
          question: "Qual tipo de alongamento é recomendado ANTES do treino?",
          options: [
            "Alongamento estático",
            "Mobilidade dinâmica",
            "Alongamento passivo",
            "Não fazer alongamento",
          ],
          correctAnswer: 1,
        },
        {
          question:
            "Quanto tempo de descanso é recomendado entre treinos do mesmo grupo muscular?",
          options: ["12 horas", "24 horas", "48-72 horas", "1 semana"],
          correctAnswer: 2,
        },
      ],
    },
  },
  {
    id: "lesson-form-technique",
    title: "Técnica e Forma dos Exercícios",
    category: "form",
    content: `
A técnica correta é fundamental para resultados e segurança. Entenda os princípios universais.

**Princípios Universais de Técnica:**

**1. Controle do Movimento:**
- Fase excêntrica (negativa): 2-3 segundos de descida controlada
- Pausa isométrica (se aplicável): 1 segundo
- Fase concêntrica (positiva): 1-2 segundos de subida explosiva mas controlada
- Não usar momentum ou impulso

**2. Amplitude Completa de Movimento (ROM):**
- Usar toda amplitude possível com segurança
- Exemplo: Agachamento até paralelo ou abaixo
- Exemplo: Supino tocando o peito
- ROM completo = mais ativação muscular

**3. Respiração:**
- Inspirar na fase excêntrica (descer)
- Expirar na fase concêntrica (subir)
- Valsalva maneuver: Pressão intra-abdominal em cargas pesadas (>85% 1RM)
- Segurar ar momentaneamente no ponto mais difícil

**4. Alinhamento Postural:**
- **Coluna**: Neutra (não hiperestender ou arredondar)
- **Joelhos**: Alinhados com pés, não valgo (para dentro)
- **Ombros**: Retraídos e deprimidos (puxados para trás e para baixo)
- **Pés**: Plantados no chão, peso distribuído

**Exercícios Específicos:**

**Agachamento:**
- Pés na largura dos ombros/quadris
- Joelhos seguem direção dos pés
- Descida até quadris abaixo dos joelhos
- Empurrar através dos calcanhares
- Tronco ereto (não inclinar demais)

**Supino:**
- Retrair escápulas no banco
- Arco leve nas costas (não excessivo)
- Cotovelos a 45-60 graus (não 90 graus)
- Barra tocando linha dos mamilos
- Controle total do movimento

**Levantamento Terra:**
- Barra próxima às canelas
- Coluna neutra desde o início
- Quadris e joelhos se estendem simultaneamente
- Barra desliza pelas pernas
- Não arredondar coluna lombar

**Barra Fixa:**
- Retrair escápulas primeiro
- Puxar cotovelos, não apenas subir
- Queixo passa a barra
- Descida controlada (não soltar)

**Evidências:**
ROM completo ativa 20-40% mais fibras musculares (Bloomquist et al., 2013). Controle excêntrico é crucial para hipertrofia (Roig et al., 2009).
    `,
    keyPoints: [
      "Controle excêntrico: 2-3 segundos",
      "ROM completo ativa 20-40% mais fibras",
      "Respirar corretamente aumenta força",
      "Técnica sempre antes de carga",
    ],
    duration: 9,
    xpReward: 25,
    completed: false,
    quiz: {
      questions: [
        {
          question: "Quanto tempo deve durar a fase excêntrica (negativa)?",
          options: [
            "0.5 segundos",
            "2-3 segundos",
            "5-6 segundos",
            "Não importa",
          ],
          correctAnswer: 1,
        },
        {
          question: "Qual é a posição dos cotovelos ideal no supino?",
          options: [
            "90 graus (completamente aberto)",
            "45-60 graus",
            "0 graus (fechado)",
            "Não importa",
          ],
          correctAnswer: 1,
        },
        {
          question: "O que fazer primeiro em uma barra fixa?",
          options: [
            "Puxar com os braços",
            "Retrair as escápulas",
            "Usar impulso",
            "Não importa a ordem",
          ],
          correctAnswer: 1,
        },
      ],
    },
  },
  {
    id: "lesson-sleep-performance",
    title: "Sono e Performance no Treino",
    category: "recovery",
    content: `
O sono é um dos pilares mais importantes para recuperação e ganhos musculares.

**Por que o Sono é Fundamental:**

**1. Síntese de Hormônios:**
- 70% do Hormônio do Crescimento (GH) é secretado durante sono profundo
- Testosterona: Pico durante REM (últimas horas de sono)
- Cortisol: Reduz durante sono, aumenta ao acordar
- Privação de sono = cortisol elevado = catabolismo

**2. Recuperação Muscular:**
- Reparo de microlesões ocorre principalmente durante sono
- Síntese proteica aumenta durante sono
- Falta de sono reduz síntese proteica em 18%
- 1 noite mal dormida = 2 dias de recuperação comprometida

**3. Performance:**
- 1 noite de privação reduz força em 2-5%
- Afeta coordenação e técnica
- Reduz motivação e foco
- Aumenta percepção de esforço

**Necessidades de Sono:**
- **Mínimo**: 7 horas (funcional mas não ideal)
- **Ideal**: 7-9 horas para adultos
- **Atletas**: 8-10 horas podem ser benéficas
- **Qualidade > Quantidade**: Sono profundo contínuo é crucial

**Ciclos de Sono:**
- **NREM (N1-N3)**: Sono leve a profundo
- **REM**: Sonhos, consolidação de memória
- Ciclo completo: ~90 minutos
- 4-6 ciclos por noite ideal

**Como Melhorar o Sono:**

**Higiênica do Sono:**
- Horário consistente (mesmo fim de semana)
- Quarto escuro (cortinas blackout)
- Temperatura: 18-20°C ideal
- Sem telas 1-2h antes de dormir
- Rotina relaxante (leitura, alongamento leve)

**Nutrição:**
- Evitar refeições grandes 2-3h antes
- Proteína antes de dormir pode ajudar (caseína)
- Evitar cafeína após 14h
- Álcool reduz qualidade do sono (evitar)

**Exercício:**
- Treinar regularmente melhora sono
- Evitar treino intenso 2-3h antes de dormir
- Treino de manhã pode melhorar sono noturno

**Suplementos:**
- Melatonina: 0.5-3mg (ajuda início do sono)
- Magnésio: 200-400mg (relaxamento muscular)
- ZMA: Zinco + Magnésio + B6

**Evidências:**
Estudos mostram que dormir <6h reduz ganhos musculares em 60% comparado a 8h+ (Dattilo et al., 2011). Uma noite de privação aumenta cortisol em 37% e reduz testosterona em 15% (Leproult & Van Cauter, 2011).
    `,
    keyPoints: [
      "7-9 horas de sono ideal para atletas",
      "70% do GH secretado durante sono profundo",
      "Privação reduz síntese proteica em 18%",
      "Uma noite ruim = 2 dias de recuperação comprometida",
    ],
    duration: 8,
    xpReward: 25,
    completed: false,
    quiz: {
      questions: [
        {
          question: "Quantas horas de sono são ideais para atletas?",
          options: ["5-6 horas", "7-9 horas", "10-12 horas", "Não importa"],
          correctAnswer: 1,
        },
        {
          question:
            "Quanto do Hormônio do Crescimento é secretado durante o sono?",
          options: ["30%", "50%", "70%", "90%"],
          correctAnswer: 2,
        },
        {
          question: "Quanto a privação de sono reduz a síntese proteica?",
          options: ["5%", "10%", "18%", "30%"],
          correctAnswer: 2,
        },
      ],
    },
  },
  {
    id: "lesson-hydration",
    title: "Hidratação e Performance",
    category: "nutrition",
    content: `
A hidratação adequada é crucial para performance, recuperação e saúde geral.

**Importância da Água:**

**Funções no Corpo:**
- Transporte de nutrientes
- Regulação de temperatura
- Lubrificação de articulações
- Digestão e absorção
- Eliminação de resíduos

**Impacto na Performance:**
- Desidratação de 2% reduz performance em 10-15%
- 3-5% de desidratação: Reduz força, resistência e coordenação
- >5%: Risco de cãibras, fadiga extrema, confusão mental

**Necessidades Diárias:**

**Base:**
- 35-40ml por kg de peso corporal
- Exemplo: 70kg = 2.5-2.8L/dia
- Ajustar por clima, atividade e suor

**Durante Treino:**
- 150-300ml a cada 15-20 minutos
- Treinos <1h: Água é suficiente
- Treinos >1h: Considerar eletrólitos

**Pós-Treino:**
- Repor 150% do peso perdido em suor
- Exemplo: Perdeu 1kg = beber 1.5L
- Incluir sódio se suou muito

**Sinais de Desidratação:**
- Sede (já indica 1-2% desidratado)
- Urina escura
- Fadiga
- Dor de cabeça
- Cãibras musculares
- Tontura

**Eletrólitos:**

**Sódio:**
- Perdido mais no suor (principal eletrólito)
- Necessário para retenção de água
- 1-2g/hora de exercício intenso

**Potássio:**
- Importante para contração muscular
- Fontes: Bananas, batata, coco

**Magnésio:**
- Regula função muscular
- Perdido em menor quantidade

**Quando Usar Bebidas Esportivas:**
- Treinos >60-90 minutos
- Suor excessivo
- Clima quente
- Treinos múltiplos no dia

**Água vs Bebidas Esportivas:**
- **Água**: Treinos <1h, baixa intensidade
- **Bebidas esportivas**: Treinos longos, alta intensidade, calor extremo

**Evidências:**
Perda de apenas 2% do peso corporal em água reduz força em 6-8% e aumenta percepção de esforço (Cheuvront et al., 2010). Hidratação adequada melhora recuperação pós-treino significativamente.
    `,
    keyPoints: [
      "35-40ml/kg de peso corporal diário",
      "2% de desidratação reduz performance 10-15%",
      "Repor 150% do peso perdido pós-treino",
      "Eletrólitos necessários para treinos >1h",
    ],
    duration: 7,
    xpReward: 20,
    completed: false,
    quiz: {
      questions: [
        {
          question:
            "Quantos ml de água por kg de peso são recomendados diariamente?",
          options: ["20-25ml/kg", "35-40ml/kg", "50-60ml/kg", "Não importa"],
          correctAnswer: 1,
        },
        {
          question: "Quanto de desidratação reduz performance em 10-15%?",
          options: ["1%", "2%", "5%", "10%"],
          correctAnswer: 1,
        },
        {
          question: "Quando usar bebidas esportivas ao invés de água?",
          options: [
            "Sempre",
            "Treinos >60-90 minutos",
            "Nunca",
            "Apenas pela manhã",
          ],
          correctAnswer: 1,
        },
      ],
    },
  },
  {
    id: "lesson-cardio-heart-rate",
    title: "Zonas de Frequência Cardíaca",
    category: "training-science",
    content: `
Entender zonas de frequência cardíaca permite treinar na intensidade correta para seus objetivos.

**Cálculo da Frequência Cardíaca Máxima (FCmax):**
- Fórmula simples: 220 - idade
- Mais precisa: 208 - (0.7 × idade)
- Exemplo: 30 anos = 208 - 21 = 187 bpm

**Zonas de Treinamento:**

**Zona 1: Recuperação Ativa (50-60% FCmax)**
- Sensação: Muito fácil, conversa confortável
- Uso: Recuperação, aquecimento, resfriamento
- Benefícios: Melhora circulação, recuperação
- Duração: 20-60 minutos

**Zona 2: Aeróbica Base (60-70% FCmax)**
- Sensação: Fácil, conversa possível
- Uso: Cardio de baixa intensidade, base aeróbica
- Benefícios: Melhora eficiência energética, queima gordura
- Duração: 30-90+ minutos
- **Ideal para: Building base, recuperação, perda de gordura**

**Zona 3: Aeróbica (70-80% FCmax)**
- Sensação: Moderada, conversa difícil
- Uso: Cardio moderado, condicionamento
- Benefícios: Melhora VO2 max, endurance
- Duração: 20-60 minutos

**Zona 4: Anaeróbica (80-90% FCmax)**
- Sensação: Difícil, poucas palavras
- Uso: HIIT, intervalos intensos
- Benefícios: Melhora capacidade anaeróbica, VO2 max
- Duração: 3-10 minutos (intervalos)
- **Ideal para: HIIT, melhora de condicionamento rápido**

**Zona 5: Máxima (90-100% FCmax)**
- Sensação: Máximo esforço, sem fala
- Uso: Sprints, esforços máximos
- Benefícios: Melhora potência anaeróbica máxima
- Duração: 30 segundos - 2 minutos (intervalos)
- **Ideal para: Potência máxima, sprints**

**Aplicação Prática:**

**Para Perda de Gordura:**
- Zona 2 (60-70%): 70% do tempo
- Zona 4 (80-90%): 30% do tempo (HIIT)

**Para Condicionamento:**
- Mistura de Zona 3 e 4
- 2-3x HIIT por semana

**Para Recuperação:**
- Zona 1 ou 2
- 20-30 minutos

**Monitoramento:**
- Frequencímetro (mais preciso)
- Sensação (talk test)
- Escala de esforço percebido (RPE 1-10)

**Evidências:**
Treinar na zona correta melhora eficiência do treino em 40-60% (Seiler & Kjerland, 2006). Zona 2 é ideal para queima de gordura (60-70% da energia vem de gordura nessa zona).
    `,
    keyPoints: [
      "FCmax = 208 - (0.7 × idade)",
      "Zona 2 (60-70%): ideal para queima de gordura",
      "Zona 4 (80-90%): ideal para HIIT",
      "Treinar na zona correta aumenta eficiência 40-60%",
    ],
    duration: 8,
    xpReward: 25,
    completed: false,
    quiz: {
      questions: [
        {
          question: "Qual é a fórmula mais precisa para calcular FCmax?",
          options: [
            "220 - idade",
            "208 - (0.7 × idade)",
            "200 - idade",
            "210 - idade",
          ],
          correctAnswer: 1,
        },
        {
          question: "Qual zona é ideal para queima de gordura?",
          options: [
            "Zona 1 (50-60%)",
            "Zona 2 (60-70%)",
            "Zona 4 (80-90%)",
            "Zona 5 (90-100%)",
          ],
          correctAnswer: 1,
        },
        {
          question: "Qual zona é ideal para HIIT?",
          options: [
            "Zona 2 (60-70%)",
            "Zona 3 (70-80%)",
            "Zona 4 (80-90%)",
            "Zona 1 (50-60%)",
          ],
          correctAnswer: 2,
        },
      ],
    },
  },
];
