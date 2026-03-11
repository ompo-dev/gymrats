# Estratégia de Reestruturação: Controle de Acesso e Roles (RBAC/ABAC)

Este documento detalha o plano de ação técnico para reestruturar o controle de acesso e permissões da base de código do GymRats. Essa reestruturação é um pré-requisito fundamental para suportar o novo modelo de negócio descrito no plano estratégico principal (`docs/paln.md`), que introduzirá a role de PERSONAL, planos múltiplos granulares (Aluno Pro, Academia Enterprise, etc.) e o programa de indicações.

---

## 1. O Problema Atual

Atualmente, as verificações de papéis de usuários (roles) e de acesso a funcionalidades (plans) encontram-se espalhadas de forma ad-hoc por toda aplicação:
- Verificações fixadas por código (`if (role === 'STUDENT')`).
- Lógica de acesso ligada diretamente ao nome ou ID do plano (`if (studentStore.plan === 'premium')`).
- Duplicação de regras em rotas de API, Server Actions e Componentes UI.

Com o novo modelo de negócio expandindo dinamicamente as permissões (e.g., uma academia "Enterprise" tem o recurso de gerir e atribuir personais; um aluno "Pro" pode frequentar qualquer academia "Enterprise"), essa abordagem hardcoded invariavelmente levará a falhas de segurança, bugs onde usuários ganham acessos indevidos e pesadelos de manutenção.

---

## 2. Visão da Nova Arquitetura de Acessos

Precisamos mudar para um modelo híbrido centrado em um único motor de permissões:
- **RBAC (Role-Based Access Control):** Define o "espaço de trabalho" principal (`STUDENT`, `GYM`, `PERSONAL`, `ADMIN`).
- **ABAC (Attribute-Based Access Control) + Contexto Relacional:** Libera features baseado nos atributos (Plano Atual: `Free`, `Premium`, `Pro`, Status de Pagamento) e no contexto da relação (ex: "Aluno ganha benefícios premium automaticamente se matriculado em uma Academia Enterprise").

O objetivo é separar **O QUE** a pessoa é (Role/Plano) de **O QUE** ela pode fazer (Feature/Permissão).

Em vez de: 
`if (user.role === 'GYM' && user.plan === 'enterprise') { ... }`

Faremos: 
`if (ability.can('assign_personal')) { ... }`

---

## 3. Componentes da Reestruturação

Iremos criar um novo pacote ou diretório central chamado `lib/access-control` que funcionará como a única fonte de verdade de permissões do sistema inteiro (Front-end, Back-end e Middleware).

### 3.1 Dicionário Unificado de Roles e Planos

Expandiremos as estaturas atuais, mapeando explicitamente o que existe e o que será criado.

```typescript
// lib/access-control/types.ts

export type UserRole = "STUDENT" | "GYM" | "PERSONAL" | "ADMIN" | "PENDING";

export type StudentPlan = "FREE" | "PREMIUM" | "PRO";
export type GymPlan = "BASIC" | "PREMIUM" | "ENTERPRISE";
export type PersonalPlan = "COM_IA" | "SUPERIOR";

export type UserPlan = StudentPlan | GymPlan | PersonalPlan;
```

### 3.2 Mapeamento de Funcionalidades (Features Flags Monetizadas)

Todas as funcionalidades exclusivas ganharão uma string identificadora única (Feature Code).

```typescript
// lib/access-control/features.ts

export const Features = {
  // AI
  USE_AI_WORKOUT: "use_ai_workout",
  USE_AI_NUTRITION: "use_ai_nutrition",
  
  // Gyms
  ASSIGN_PERSONAL: "assign_personal",
  BOOST_PLACEMENT: "boost_placement",
  
  // Network / Pro
  NETWORK_ACCESS: "network_access",
} as const;

export type FeatureKey = typeof Features[keyof typeof Features];
```

### 3.3 A Matriz de Permissões (Políticas)

Dentro do motor de acesso, apenas uma função calculará o acesso baseado nos atributos.

```typescript
// lib/access-control/policies.ts
import { Features } from "./features";

export const RolePlanPolicies: Record<UserRole, Partial<Record<string, FeatureKey[]>>> = {
  STUDENT: {
    FREE: [],
    PREMIUM: [Features.USE_AI_WORKOUT, Features.USE_AI_NUTRITION],
    PRO: [Features.USE_AI_WORKOUT, Features.USE_AI_NUTRITION, Features.NETWORK_ACCESS],
  },
  GYM: {
    BASIC: [],
    PREMIUM: [],
    ENTERPRISE: [Features.ASSIGN_PERSONAL],
  },
  PERSONAL: {
    COM_IA: [Features.USE_AI_WORKOUT],
    SUPERIOR: [Features.USE_AI_WORKOUT], // adicione outras depois
  },
  // ...
};

### 3.4 Contexto Relacional (Herança de Planos)

Para cobrir cenários como "Aluno ganha Premium de graça se a Academia onde está matriculado tiver plano Enterprise" ou "Personal ganha desconto de 50% se filiado a academia Enterprise", o validador de acesso não deve apenas olhar para o usuário de forma isolada, mas permitir injetar um contexto:

```typescript
// Exemplo de como funcionará a injeção de contexto nas permissões
export function checkAbility(user: UserContext, feature: FeatureKey, environmentContext?: EnvironmentContext): boolean {
  // 1. O usuário tem o plano explicitamente via sua matriz? (Ex: Aluno pagou o Premium)
  if (hasDirectAbility(user, feature)) return true;

  // 2. Existe uma herança contextual? (Ex: Aluno não pagou o Premium, 
  // mas o contexto do ambiente (Academia logada) é Enterprise)
  if (environmentContext?.type === 'GYM' && environmentContext.plan === 'ENTERPRISE') {
      if (inheritedFeatures[environmentContext.plan]?.includes(feature)) {
          return true; // Ganhou a feature "de graça" por tabela
      }
  }

  return false;
}
```
```

---

## 4. Integração no Back-End (Server & API)

Ao recebermos uma requisição na API (Elysia) ou Server Actions, deixaremos de verificar o nível de assinatura diretamente. 

Vamos injetar um objeto/contexto nas requests do backend, permitindo validações fluidas:

### 4.1 Server Actions & Elysia
```typescript
// Dentro de uma rota ou Server Action:
import { requireAbility } from "@/lib/access-control/server";

export async function createAiWorkout() {
  const session = await getAuthSession();
  
  // requireAbility fará a validação da Role atual + Status do Pagamento + Regra da Matriz
  // e lançará um erro AuthorizationError se falhar.
  await requireAbility(session.user, Features.USE_AI_WORKOUT); 
  
  // ... lógica continua
}
```

### 4.2 Middleware (Sincronização de Roles)
O atual `middleware.ts` / `middleware-auth.ts` deixará de depender apenas de caminhos arbitrários e passará a usar guards para garantir que um usuário sem a tabela de dependências (Perfil criado em database, Plano Ativo) não consiga burlar caminhos da URl.

---

## 5. Integração no Front-End (Zustand e React)

No Next.js, a proteção visual dos componentes ditará se um botão aparece, está bloqueado (com cadeado de paywall) ou oculto.

Criaremos um hook global de acesso:

```tsx
import { useAbility } from "@/hooks/use-ability";
import { Features } from "@/lib/access-control/features";

export function GenerateAIBtn() {
   const { can, userPlan, missingPlanAlert } = useAbility();

   if (!can(Features.USE_AI_WORKOUT)) {
       return <Button onClick={missingPlanAlert}>Usar IA (Requer Premium ou Academia Enterprise)</Button>
   }

   return <Button>Gerar Treino</Button>
}
```

O hook global `useAbility` irá calcular os privilégios baseados nos dados cacheados na *store* de sessão, incluindo automaticamente regras contextuais (ex: conferindo na store se a academia atual tem o status Enterprise).

Ao encapsular o `useAbility`, delegamos toda complexidade condicional (`if active && not expired && plan === premium && role === student`) para que o componente não precise sequer saber.

---

## 6. Roadmap Passo a Passo (Checklist Granular de Implementação)

Esse roadmap é a **Fase Zero** necessária antes de codar os itens 1 a 5 descritos no documento `docs/paln.md`. Toda tarefa abaixo é projetada para ser processada em pequenos PRs isolados, evitando quebras drásticas na aplicação.

### 🏁 Fase 1: Fundação do Sistema de Controle de Acesso (`lib/access-control/`)

> **Objetivo:** Criar o motor central que irá coordenar as permissões, isolado da UI e Banco de Dados.

1. **[x] 1.1 Criar Tipos Base (Roles e Planos)**
   - **Arquivo:** `lib/access-control/types.ts`
   - **O que fazer:** Exportar todas as roles do sistema (`UserRole`), os respectivos planos de cada um (`StudentPlan`, `GymPlan`, `PersonalPlan`), o `UserContext` e o `EnvironmentContext` para encapsular e unificar o que vem do Prisma para a aplicação.

2. **[x] 1.2 Criar Dicionário de Features (Flags)**
   - **Arquivo:** `lib/access-control/features.ts`
   - **O que fazer:** Criar o dicionário estrito contendo as features chave hoje monetizadas. Exemplos iniciais: `USE_AI_WORKOUT`, `USE_AI_NUTRITION`, `ASSIGN_PERSONAL`, `NETWORK_ACCESS`.
   - **Por que:** Evita "magic strings" soltas no código e evita erros de digitação.

3. **[x] 1.3 Criar Matriz de Políticas Base (Policies)**
   - **Arquivo:** `lib/access-control/policies.ts`
   - **O que fazer:** Definir um objeto/mapa central de qual Plano contém qual Feature. Definir a lógica de "Herança" e cruzamento de dados (ex: Plano `STUDENT_PREMIUM` habilita certas features; a academia ser `GYM_ENTERPRISE` habilita certas features para o aluno indiretamente).

4. **[x] 1.4 Criar Função Core de Avaliação (`checkAbility`)**
   - **Arquivo:** `lib/access-control/core.ts`
   - **O que fazer:** Criar e exportar a função base `checkAbility(userContext, feature, environmentContext)` que retorna *boolean*, avaliando não só as features explícitas do plano como os cenários contextuais cruzados do abac+.

### 🏁 Fase 2: Adaptação de Banco e Contextos de Usuário

> **Objetivo:** Garantir que o Prisma, Middleware e Tokens Auth tragam todas as informações vitais e as mapeiem para as Tipagens limpas feitas no Passo 1.

1. **[x] 2.1 Atualização de Schema Prisma (Novos Tipos e Planos)**
   - **Arquivo:** `prisma/schema.prisma`
   - **O que fazer:** Se os atributos de "Plan" hoje são Strings genéricas, validar a criação de Enums tipados, dar suporte nativo à nova string de Role `PERSONAL` em models do `User`. Alterar/Re-migrar o DB.

2. **[x] 2.2 Sincronização Sessão-Auth (Contexto Enriquecido)**
   - **Arquivo:** `lib/utils/session.ts` (ou local onde cria o token payload).
   - **O que fazer:** Hoje a sessão e tokens carregam a flag solta de *role*. É necessário expandir as queries que constroem a autenticação (ex: injetar não só a Role, mas o código exato do ActivePlan e do ActiveGymPlan na payload atual) para servir ao contexto.

3. **[ ] 2.3 Middleware Guards**
   - **Arquivo:** `middleware.ts` e arquivos relacionados.
   - **O que fazer:** Adicionar verificação unificada para prevenir quebras brutas quando o usuário acessa URL "Gym" sem que o plano Ativo exista. Transferir regras arbitrárias hardcoded ali para o novo modelo de *Roles*.

### 🏁 Fase 3: Server Actions e Rotas Elysia

> **Objetivo:** Injetar a verificação de segurança no Back-End para impedir que chamadas curl/fetch contornem bloqueios da UI.

1. **[x] 3.1 Criar Função Server-Side de Exigência (Guard)**
   - **Arquivo:** `lib/access-control/server.ts`
   - **O que fazer:** Criar função assíncrona `requireAbility(feature, envContext)` que puxa a Session do DB/Token, valida contra `checkAbility()` e emite `throw new AuthorizationError()` / Code 403 se falhar.

2. **[x] 3.2 Refatorar Server Actions Existentes**
   - **O que fazer:** Varrer `/lib/actions/` e nas ações de IA (`ai-workout`, `ai-nutrition`), limpar as velhas checagens `if (role === 'STUDENT' && plan === 'premium')` e trocar por `$requireAbility('USE_AI_WORKOUT')`.

3. **[x] 3.3 Refatorar Rotas Backend (Elysia API)**
   - **O que fazer:** Injetar as dependências `requireAbility` (ou equivalente no hook de rota global do Elysia) que exija o recurso específico.

### 🏁 Fase 4: Substituir Validações Front-End

> **Objetivo:** Simplificar toda a inteligência da UI, fazendo-a reagir ao "Posso fazer X?" e não a "Qual é meu plano?".

1. **[x] 4.1 Criar Hook Global do Client-Side**
   - **Arquivo:** `hooks/use-ability.ts` (ou `lib/access-control/client/use-ability.tsx`)
   - **O que fazer:** Um Wrapper do hook de context/Zustand de usuário logado interagindo com o módulo `lib/access-control/core.ts`. Precisa retornar a função `can(feature)` com o context do `environment` preenchido silenciosamente na bagagem.

2. **[x] 4.2 Provedor de Contexto do Ambiente (ABAC Provider)**
   - **Arquivo:** `providers/EnvironmentContextProvider.tsx`
   - **O que fazer:** Um provider root (talvez injetado no layout principal `app/student/layout.tsx`) onde você vai "pingar" ao buscar/definir qual é a ID e o PLano da Academia conectada atual para servir aos parâmetros do contexto de herança.

3. **[x] 4.3 Refatorar as Views de Workout/Gerador de IA (Paywalls)**
   - **O que fazer:** Percorrer todos os botões de ação restritos e componentes (ex: `Gerar IA`, `Ver Histórico de Treino Extra`, etc.). Suprimir checagens antigas de stores de *stripe* / *activePlan* e focar puramente em `<RenderIf can="USE_AI_WORKOUT">...</RenderIf>` ou `!can('USE_AI') ? <LockModal/> : <Content/>`.

### 🏁 Fase 5: Validação e Teste do Sistema Contextual (A Mágica)

> **Objetivo:** Colocar exatamente a inteligência de Cruzamento do `paln.md` à prova em código.

1. **[ ] 5.1 Teste de Herança: Aluno Free em Academia Enterprise**
   - **O que fazer:** Testar na UI local um aluno Plano "FREE", vinculado em dashboard/perfil a uma academia de owner com plano "ENTERPRISE". O Botão de IA deve desbloquear, validando a função core na perfeição.

2. **[ ] 5.2 Validação de Gateway de Pagamento (Downgrade/Expiração)**
   - **O que fazer:** Alterar data de validade ativa simulada no DB. O Auth Token/Session precisa refletir o rebaixamento de nível e todas as opções restritas da UI precisam se auto-trancar simultaneamente via `use-ability`.

---

## 7. Como Isso Facilita o Plano R$ 6k MRR (`docs/paln.md`)?

Ao abstrair essa complexidade, implementar o **Passo 1 do novo modelo (Aluno Pro nas Academias)** vira apenas:

1. Adicionar `PRO` à matriz de policies em `lib/access-control/policies.ts`.
2. Criar a nova feature `NETWORK_ACCESS`.
3. Associar essa feature ao plano `PRO`.
4. Na tela de QR Code para ler a entrada na Catraca:
   `if (ability.can(Features.NETWORK_ACCESS) && targetGymPlan === ENTERPRISE) { LiberaAcesso(); }`

Isso nos dará flexibilidade absoluta e agilidade incrível para focar nas regras de negócio financeiras ao invés de desviar atolados em "if/else" e paywalls quebrados por toda a codebase, garantindo que o GymRats cresça em uma base técnica madura e pronta para sustentar a Fase 4 corporativa.
