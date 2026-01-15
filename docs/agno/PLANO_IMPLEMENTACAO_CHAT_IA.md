# Plano de Implementação: Chat IA para Usuários Premium

## 🎯 Resumo Executivo

Implementar funcionalidades de chat com IA para usuários premium usando **DeepSeek-V3.2-Exp** (provedor mais barato do mercado):

- **Chat de Nutrição**: Usuário descreve o que comeu, IA extrai e adiciona automaticamente
- **Chat de Treinos**: Conversa guiada para gerar treino personalizado completo
- **Custo estimado**: ~$2-3/mês para 1000 usuários premium (com cache inteligente)
- **Stack**: Next.js + TypeScript + DeepSeek API (sem dependências extras)

## Visão Geral

Implementar funcionalidades de chat com IA para usuários premium em duas áreas:

1. **Chat de Nutrição**: Substituir/adicionar opção de chat no modal de busca de alimentos onde o usuário fala o que comeu e a IA processa e adiciona automaticamente
2. **Chat de Treinos**: Adicionar chat na página de aprendizado onde o usuário conversa sobre objetivos, restrições, etc., e a IA monta um treino personalizado

## Arquitetura Proposta

### Fluxo Simplificado

```
┌─────────────────────────────────────┐
│   Frontend (Next.js)                │
│   - Componente Chat                 │
│   - Verificação Premium             │
└──────────────┬──────────────────────┘
               │
               │ HTTP/REST
               ▼
┌─────────────────────────────────────┐
│   API Route (Next.js)                │
│   - Validação Premium                │
│   - Cache de Respostas               │
│   - Chamada DeepSeek API             │
│   - Processamento de Resposta        │
│   - Retorno Estruturado              │
└──────────────┬──────────────────────┘
               │
               │
               ▼
┌─────────────────────────────────────┐
│   DeepSeek API                       │
│   - Processamento de Linguagem      │
│   - Extração de Dados                │
│   - Cache Inteligente (até 90% off)  │
└─────────────────────────────────────┘
```

**Provedor**: DeepSeek-V3.2-Exp (mais barato do mercado)

## 1. Chat de Nutrição (Diet Page)

### 1.1 Funcionalidade

- **Localização**: `components/organisms/modals/food-search.tsx`
- **Comportamento**:
  - Adicionar aba/toggle "Chat IA" (apenas para premium)
  - Usuário descreve o que comeu em linguagem natural
  - IA extrai: alimentos, quantidades, refeição, horário
  - Adiciona automaticamente na refeição selecionada

### 1.2 Exemplo de Uso

**Usuário diz:**

> "Comi um prato de arroz, feijão, frango grelhado e salada no almoço"

**IA processa e retorna:**

```json
{
  "foods": [
    { "name": "Arroz branco", "servings": 1, "meal": "lunch" },
    { "name": "Feijão preto", "servings": 1, "meal": "lunch" },
    { "name": "Peito de frango grelhado", "servings": 1, "meal": "lunch" },
    { "name": "Salada mista", "servings": 1, "meal": "lunch" }
  ],
  "confidence": 0.95
}
```

### 1.3 Componentes Necessários

1. **`components/organisms/modals/food-search-chat.tsx`**

   - Componente de chat com interface conversacional
   - Input de mensagem
   - Histórico de mensagens
   - Indicador de processamento
   - Botão para confirmar/adicionar alimentos extraídos

2. **`app/api/nutrition/chat/route.ts`**
   - Validação de premium
   - Chamada para DeepSeek API
   - Processamento de resposta
   - Mapeamento para alimentos do banco
   - Retorno estruturado

### 1.4 Integração

- Modificar `food-search.tsx` para ter tabs: "Buscar" e "Chat IA" (premium)
- Usar `canUseFeature(studentId, "ai_diet")` para verificar acesso
- Integrar com `handleAddFood` existente após IA processar

## 2. Chat de Treinos (Learning Path)

### 2.1 Funcionalidade

- **Localização**: `app/student/learn/learning-path.tsx`
- **Comportamento**:
  - Botão "Criar Treino com IA" (apenas para premium)
  - Chat conversacional sobre:
    - Objetivos (ganho de massa, perda de gordura, força, etc.)
    - Nível de experiência
    - Restrições físicas/lesões
    - Equipamentos disponíveis
    - Frequência de treino
    - Preferências
  - IA gera treino personalizado completo
  - Cria Unit/Workout automaticamente

### 2.2 Exemplo de Uso

**Conversa:**

```
IA: "Olá! Vou te ajudar a criar um treino personalizado. Qual é seu objetivo principal?"
Usuário: "Quero ganhar massa muscular"
IA: "Ótimo! Qual seu nível de experiência?"
Usuário: "Intermediário, treino há 1 ano"
IA: "Quantos dias por semana você pode treinar?"
Usuário: "4 dias"
...
```

**IA gera treino completo:**

- Unit com título e descrição
- 4 Workouts (dias de treino)
- Exercícios com séries, repetições, descanso
- Baseado em dados educacionais do sistema

### 2.3 Componentes Necessários

1. **`components/organisms/modals/workout-ai-chat.tsx`**

   - Modal de chat completo
   - Fluxo conversacional guiado
   - Preview do treino sendo gerado
   - Confirmação antes de criar

2. **`app/api/workouts/ai-chat/route.ts`**
   - Validação de premium
   - Gerenciamento de contexto da conversa
   - Chamadas incrementais para DeepSeek API
   - Geração de treino estruturado
   - Criação de Unit/Workout no banco

### 2.4 Integração

- Adicionar botão "Criar Treino com IA" no empty state e no header
- Usar `canUseFeature(studentId, "ai_workout")` para verificar acesso
- Integrar com sistema de criação de Units/Workouts existente

## 3. Estrutura de Arquivos

```
app/
├── api/
│   ├── nutrition/
│   │   └── chat/
│   │       └── route.ts          # API para chat de nutrição
│   └── workouts/
│       └── ai-chat/
│           └── route.ts          # API para chat de treinos

components/
├── organisms/
│   ├── modals/
│   │   ├── food-search-chat.tsx  # Chat de nutrição
│   │   └── workout-ai-chat.tsx   # Chat de treinos
│   └── chat/
│       ├── chat-message.tsx      # Componente de mensagem
│       ├── chat-input.tsx         # Input de chat
│       └── chat-container.tsx    # Container do chat

lib/
├── ai/
│   ├── client.ts                  # Cliente DeepSeek com cache
│   ├── cache.ts                    # Sistema de cache inteligente
│   ├── prompts/
│   │   ├── nutrition.ts           # Prompts para nutrição
│   │   └── workout.ts             # Prompts para treinos
│   └── parsers/
│       ├── nutrition-parser.ts    # Parser de resposta nutrição
│       └── workout-parser.ts     # Parser de resposta treinos
└── utils/
    └── premium-check.ts           # Utilitário para verificar premium
```

## 4. Detalhamento Técnico

### 4.1 API de Nutrição (`/api/nutrition/chat`)

**Request:**

```typescript
{
  message: string;           // Mensagem do usuário
  conversationHistory?: Array<{ role: 'user' | 'assistant', content: string }>;
  selectedMealId?: string;   // Refeição selecionada (opcional)
  context?: {
    dailyNutrition: DailyNutrition;
    foodDatabase: FoodItem[];
  }
}
```

**Response:**

```typescript
{
  foods: Array<{
    foodId: string; // ID do alimento no banco (ou null se não encontrado)
    foodName: string; // Nome do alimento
    servings: number; // Quantidade de porções
    mealId: string; // ID da refeição
    confidence: number; // Confiança da extração (0-1)
  }>;
  message: string; // Resposta da IA
  needsConfirmation: boolean; // Se precisa confirmação do usuário
}
```

### 4.2 API de Treinos (`/api/workouts/ai-chat`)

**Request:**

```typescript
{
  message: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant', content: string }>;
  step?: 'objectives' | 'experience' | 'restrictions' | 'equipment' | 'frequency' | 'generating';
  context?: {
    studentProfile: StudentProfile;
    existingUnits: Unit[];
    exerciseDatabase: ExerciseInfo[];
  }
}
```

**Response:**

```typescript
{
  message: string;           // Resposta da IA
  nextStep?: string;         // Próximo passo da conversa
  workoutPreview?: {         // Preview do treino (quando estiver pronto)
    unit: {
      title: string;
      description: string;
    };
    workouts: Array<{
      name: string;
      type: 'strength' | 'cardio';
      exercises: Array<{
        name: string;
        sets: number;
        reps: string;
        rest: number;
      }>;
    }>;
  };
  isComplete: boolean;      // Se o treino está completo e pronto para criar
}
```

### 4.3 Cliente LLM (DeepSeek)

**`lib/ai/client.ts`**

```typescript
import { getCachedResponse, cacheResponse } from "./cache";

interface ChatCompletionOptions {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  systemPrompt: string;
  temperature?: number;
  responseFormat?: "json_object" | "text";
}

/**
 * Cliente DeepSeek com cache inteligente
 * Reduz custo em até 90% para prompts similares
 */
export async function chatCompletion({
  messages,
  systemPrompt,
  temperature = 0.7,
  responseFormat = "text",
}: ChatCompletionOptions): Promise<string> {
  // Verificar cache primeiro (reduz custo drasticamente)
  const cacheKey = JSON.stringify({ messages, systemPrompt });
  const cached = getCachedResponse(cacheKey);
  if (cached) {
    console.log("[AI] Cache hit - resposta reutilizada");
    return cached;
  }

  // Chamar DeepSeek API
  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat", // Modelo padrão do DeepSeek
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature,
      ...(responseFormat === "json_object" && {
        response_format: { type: "json_object" },
      }),
    }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: response.statusText }));
    throw new Error(
      `DeepSeek API error: ${response.status} - ${JSON.stringify(error)}`
    );
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("Resposta vazia da API DeepSeek");
  }

  // Cachear resposta por 1 hora
  cacheResponse(cacheKey, content, 3600);

  return content;
}

/**
 * Versão com retry automático para maior confiabilidade
 */
export async function chatCompletionWithRetry(
  options: ChatCompletionOptions,
  maxRetries = 3
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await chatCompletion(options);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Se não for erro de rate limit, não retry
      if (
        !lastError.message.includes("429") &&
        !lastError.message.includes("rate limit")
      ) {
        throw lastError;
      }

      // Esperar antes de retry (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.warn(`[AI] Retry ${attempt}/${maxRetries} após ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw (
    lastError || new Error("Falha ao chamar DeepSeek após múltiplas tentativas")
  );
}
```

**Variáveis de ambiente necessárias**:

```env
# DeepSeek API Key (obter em https://platform.deepseek.com)
DEEPSEEK_API_KEY=sk-...
```

### 4.4 Prompts

**Nutrição (`lib/ai/prompts/nutrition.ts`):**

```typescript
export const NUTRITION_SYSTEM_PROMPT = `
Você é um assistente de nutrição especializado em extrair informações sobre alimentos consumidos.

Quando o usuário descrever o que comeu, extraia:
1. Nomes dos alimentos
2. Quantidades aproximadas (em porções)
3. Refeição (breakfast, lunch, dinner, snack)
4. Horário (se mencionado)

Retorne um JSON com a estrutura:
{
  "foods": [
    {
      "foodName": "nome do alimento",
      "servings": número de porções,
      "meal": "tipo de refeição",
      "confidence": 0.0-1.0
    }
  ],
  "message": "resposta amigável ao usuário"
}

Se não tiver certeza sobre algum alimento, pergunte ao usuário.
Se a quantidade não estiver clara, use valores padrão razoáveis.
`;
```

**Treinos (`lib/ai/prompts/workout.ts`):**

```typescript
export const WORKOUT_SYSTEM_PROMPT = `
Você é um personal trainer especializado em criar treinos personalizados.

Conduza uma conversa para coletar:
1. Objetivos (ganho de massa, perda de gordura, força, resistência, etc.)
2. Nível de experiência (iniciante, intermediário, avançado)
3. Restrições físicas ou lesões
4. Equipamentos disponíveis
5. Frequência de treino (dias por semana)
6. Preferências (grupos musculares favoritos, etc.)

Após coletar todas as informações, gere um treino completo e estruturado.

Retorne JSON quando o treino estiver pronto:
{
  "unit": {
    "title": "título da unidade",
    "description": "descrição"
  },
  "workouts": [
    {
      "name": "nome do treino",
      "type": "strength" | "cardio",
      "exercises": [
        {
          "name": "nome do exercício",
          "sets": número de séries,
          "reps": "faixa de repetições",
          "rest": segundos de descanso
        }
      ]
    }
  ],
  "message": "mensagem final ao usuário"
}
`;
```

## 5. Verificação de Premium

### 5.1 Middleware de Verificação

**`lib/utils/premium-check.ts`:**

```typescript
import { hasPremiumAccess, canUseFeature } from "@/lib/utils/subscription";
import { getSession } from "@/lib/utils/session";
import { NextRequest, NextResponse } from "next/server";

export async function requirePremium(
  request: NextRequest,
  featureKey: string
): Promise<{ studentId: string } | NextResponse> {
  const session = await getSessionFromRequest(request);

  if (!session?.user?.student?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const studentId = session.user.student.id;
  const hasAccess = await canUseFeature(studentId, featureKey);

  if (!hasAccess) {
    return NextResponse.json(
      {
        error: "Recurso premium",
        message: "Esta funcionalidade requer assinatura premium",
      },
      { status: 403 }
    );
  }

  return { studentId };
}
```

### 5.2 Uso nas API Routes

```typescript
// app/api/nutrition/chat/route.ts
export async function POST(request: NextRequest) {
  const premiumCheck = await requirePremium(request, "ai_diet");

  if (premiumCheck instanceof NextResponse) {
    return premiumCheck; // Erro de autenticação/premium
  }

  const { studentId } = premiumCheck;
  // ... resto da lógica
}
```

## 6. Processamento e Mapeamento

### 6.1 Mapeamento de Alimentos

**Desafio**: IA pode retornar nomes genéricos ("frango grelhado") que precisam ser mapeados para alimentos do banco.

**Solução**:

1. Buscar no `foodDatabase` por similaridade (fuzzy match)
2. Se não encontrar exato, buscar por categoria/termos-chave
3. Se ainda não encontrar, criar entrada temporária ou pedir confirmação

**`lib/ai/parsers/nutrition-parser.ts`:**

```typescript
export async function mapFoodToDatabase(
  foodName: string,
  foodDatabase: FoodItem[]
): Promise<FoodItem | null> {
  // 1. Busca exata
  let found = foodDatabase.find(
    (f) => f.name.toLowerCase() === foodName.toLowerCase()
  );

  if (found) return found;

  // 2. Busca por similaridade (fuzzy)
  const similarity = foodDatabase
    .map((food) => ({
      food,
      score: calculateSimilarity(foodName, food.name),
    }))
    .sort((a, b) => b.score - a.score);

  if (similarity[0]?.score > 0.7) {
    return similarity[0].food;
  }

  // 3. Busca por termos-chave
  const keywords = extractKeywords(foodName);
  found = foodDatabase.find((food) =>
    keywords.some((keyword) => food.name.toLowerCase().includes(keyword))
  );

  return found || null;
}
```

### 6.2 Geração de Treinos

**Integração com dados educacionais:**

- Usar `exerciseDatabase` de `lib/educational-data.ts`
- IA seleciona exercícios baseado em:
  - Grupos musculares alvo
  - Nível de dificuldade
  - Equipamentos disponíveis
  - Objetivos do usuário

**`lib/ai/parsers/workout-parser.ts`:**

```typescript
export function mapExercisesToDatabase(
  exerciseNames: string[],
  exerciseDatabase: ExerciseInfo[]
): Array<{
  exercise: ExerciseInfo;
  sets: number;
  reps: string;
  rest: number;
}> {
  return exerciseNames.map((name) => {
    // Buscar exercício no database
    const exercise =
      exerciseDatabase.find(
        (e) => e.name.toLowerCase() === name.toLowerCase()
      ) ||
      exerciseDatabase.find((e) =>
        e.name.toLowerCase().includes(name.toLowerCase())
      );

    if (!exercise) {
      throw new Error(`Exercício "${name}" não encontrado`);
    }

    return {
      exercise,
      sets: extractSets(name), // Extrair da resposta da IA ou usar padrão
      reps: extractReps(name),
      rest: extractRest(name),
    };
  });
}
```

## 7. UI/UX

### 7.1 Chat de Nutrição

- **Layout**: Modal com duas abas: "Buscar" (atual) e "Chat IA" (premium)
- **Indicador Premium**: Badge "Premium" na aba de chat
- **Interface**:
  - Histórico de mensagens (scrollável)
  - Input na parte inferior
  - Botão de envio
  - Indicador de processamento
  - Preview dos alimentos extraídos antes de adicionar

### 7.2 Chat de Treinos

- **Layout**: Modal full-screen ou grande
- **Fluxo**:

  1. Tela inicial com botão "Começar"
  2. Conversa guiada (perguntas da IA)
  3. Preview do treino sendo construído (lado direito ou abaixo)
  4. Confirmação final
  5. Criação do treino

- **Estados**:
  - `idle`: Pronto para começar
  - `chatting`: Em conversa
  - `generating`: Gerando treino
  - `preview`: Mostrando preview
  - `creating`: Criando no banco
  - `success`: Treino criado

## 8. Tratamento de Erros

### 8.1 Erros Comuns

1. **Usuário não premium**: Retornar 403 com mensagem clara
2. **DeepSeek API não disponível**: Fallback para busca manual
3. **Resposta inválida da IA**: Retry ou pedir confirmação manual
4. **Alimento não encontrado**: Sugerir alternativas ou criar manualmente
5. **Timeout**: Retry com timeout maior ou cancelar

### 8.2 Fallbacks

- **Nutrição**: Se IA falhar, manter busca manual disponível
- **Treinos**: Se IA falhar, oferecer criação manual guiada

## 9. Custos e Limites

### 9.1 Preços DeepSeek-V3.2-Exp

**Modelo escolhido**: DeepSeek-V3.2-Exp (mais barato do mercado)

- **Input (cache miss)**: $0.28 por 1M tokens
- **Input (cache hit)**: $0.028 por 1M tokens ⚡ (10x mais barato!)
- **Output**: $0.42 por 1M tokens
- **Context Window**: 128K tokens
- **Qualidade**: Boa, otimizado para custo e performance

### 9.2 Custo por Conversa

**Com cache inteligente** (implementado no cliente):

- **Nutrição** (~500 input + 200 output):

  - Com cache hit: $0.000014 + $0.000084 = **$0.000098** (~$0.0001)
  - Sem cache: $0.00014 + $0.000084 = **$0.000224** (~$0.0002)

- **Treinos** (~2000 input + 1000 output):
  - Com cache hit: $0.000056 + $0.00042 = **$0.000476** (~$0.0005)
  - Sem cache: $0.00056 + $0.00042 = **$0.00098** (~$0.001)

### 9.3 Estimativa de Custos Mensais

**Cenário: 1000 usuários premium**

**DeepSeek com cache inteligente** (implementado):

- Nutrição: 1000 × 10 conversas × $0.0001 = **$1/mês**
- Treinos: 1000 × 2 conversas × $0.0005 = **$1/mês**
- **Total: ~$2-3/mês** (com cache)

**DeepSeek sem cache** (fallback):

- Nutrição: 1000 × 10 × $0.0002 = **$2/mês**
- Treinos: 1000 × 2 × $0.001 = **$2/mês**
- **Total: ~$4/mês**

**Nota**: O sistema implementa cache automático, então o custo real será próximo do cenário com cache.

### 9.4 Estratégia de Cache para Reduzir Custos

**Implementar cache de prompts similares**:

```typescript
// lib/ai/cache.ts
import { createHash } from "crypto";

interface CachedResponse {
  promptHash: string;
  response: string;
  timestamp: number;
  ttl: number; // Time to live em segundos
}

// Cache em memória (ou Redis em produção)
const promptCache = new Map<string, CachedResponse>();

export function getCachedResponse(
  prompt: string,
  maxAge: number = 3600 // 1 hora
): string | null {
  const hash = createHash("sha256")
    .update(normalizePrompt(prompt))
    .digest("hex");

  const cached = promptCache.get(hash);

  if (cached && Date.now() - cached.timestamp < cached.ttl * 1000) {
    return cached.response;
  }

  return null;
}

export function cacheResponse(
  prompt: string,
  response: string,
  ttl: number = 3600
): void {
  const hash = createHash("sha256")
    .update(normalizePrompt(prompt))
    .digest("hex");

  promptCache.set(hash, {
    promptHash: hash,
    response,
    timestamp: Date.now(),
    ttl,
  });
}

// Normalizar prompt para cache (remover variações menores)
function normalizePrompt(prompt: string): string {
  return prompt
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, ""); // Remover pontuação
}
```

**Benefícios do cache**:

- Reduz custo em até 90% para prompts similares
- Respostas instantâneas para casos comuns
- Melhor experiência do usuário

### 9.5 Rate Limiting

- **Por usuário**: 20 requisições/dia
- **Global**: 1000 requisições/hora
- Implementar com Redis ou similar

## 10. Implementação por Fases

### Fase 1: Chat de Nutrição (MVP)

1. ✅ Criar componente de chat básico
2. ✅ API route com validação premium
3. ✅ Integração com DeepSeek
4. ✅ Parser de resposta
5. ✅ Mapeamento para alimentos
6. ✅ Integração com `food-search.tsx`

### Fase 2: Chat de Treinos

1. ✅ Criar componente de chat conversacional
2. ✅ API route com gerenciamento de contexto
3. ✅ Prompts para coleta de informações
4. ✅ Geração de treino estruturado
5. ✅ Integração com criação de Units/Workouts

### Fase 3: Melhorias

1. Cache de respostas similares
2. Histórico de conversas
3. Edição de treinos gerados
4. Aprendizado com feedback do usuário

## 11. Considerações de Segurança

1. **Validação de entrada**: Sanitizar mensagens do usuário
2. **Prompt injection**: Validar e filtrar inputs maliciosos
3. **Rate limiting**: Prevenir abuso
4. **Dados sensíveis**: Não enviar informações pessoais sensíveis para DeepSeek API
5. **Logs**: Não logar mensagens completas, apenas metadados

## 12. Testes

### 12.1 Testes Unitários

- Parsers de resposta
- Mapeamento de alimentos/exercícios
- Validação de premium

### 12.2 Testes de Integração

- Fluxo completo de chat de nutrição
- Fluxo completo de chat de treinos
- Tratamento de erros

### 12.3 Testes E2E

- Conversa completa de nutrição
- Conversa completa de treinos
- Verificação de premium

---

## Próximos Passos

1. ✅ **Decisão de IA**: **DeepSeek-V3.2-Exp** (mais barato, ~$2-3/mês)
2. ✅ **Setup de ambiente**: Obter API key e configurar
3. **Implementação Fase 1**: Chat de nutrição
4. **Testes e validação**
5. **Implementação Fase 2**: Chat de treinos

### Configuração Inicial

**1. Obter API Key do DeepSeek**:

- Acessar: https://platform.deepseek.com
- Criar conta (gratuita)
- Obter API key na dashboard
- Adicionar ao `.env.local`:
  ```env
  DEEPSEEK_API_KEY=sk-...
  ```

**2. Instalar dependências**:

```bash
# DeepSeek usa fetch nativo do Next.js
# Não precisa instalar pacotes adicionais!
# Apenas garantir que está usando Next.js 13+ (já está no projeto)
```

**3. Testar conexão**:

```typescript
// scripts/test-deepseek.ts
import { chatCompletion } from "@/lib/ai/client";

async function test() {
  try {
    const response = await chatCompletion({
      messages: [{ role: "user", content: "Olá! Responda em português." }],
      systemPrompt:
        "Você é um assistente útil que sempre responde em português.",
    });

    console.log("✅ DeepSeek conectado!");
    console.log("Resposta:", response);
  } catch (error) {
    console.error("❌ Erro ao conectar DeepSeek:", error);
  }
}

test();
```

**4. Verificar variáveis de ambiente**:

```bash
# No terminal
echo $DEEPSEEK_API_KEY

# Ou criar/editar .env.local
DEEPSEEK_API_KEY=sk-sua-chave-aqui
```

---

**Documento criado em**: 2025-01-27  
**Baseado em**: Requisitos do usuário para funcionalidades premium simples e práticas
