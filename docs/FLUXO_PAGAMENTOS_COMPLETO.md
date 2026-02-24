# 💳 Fluxo Completo de Pagamentos - GymRats

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura de Pagamentos](#arquitetura-de-pagamentos)
3. [Modelos de Dados](#modelos-de-dados)
4. [Planos e Preços](#planos-e-preços)
5. [Fluxo de Assinatura (Primeira Vez)](#fluxo-de-assinatura-primeira-vez)
6. [Fluxo de Upgrade (Mensal → Anual)](#fluxo-de-upgrade-mensal--anual)
7. [Fluxo de Cancelamento](#fluxo-de-cancelamento)
8. [Fluxo de Re-assinatura](#fluxo-de-re-assinatura)
9. [Trial (Período de Teste)](#trial-período-de-teste)
10. [Webhook - Confirmação de Pagamento](#webhook---confirmação-de-pagamento)
11. [Frontend - Componentes de UI](#frontend---componentes-de-ui)
12. [Regras de Negócio](#regras-de-negócio)
13. [Variáveis de Ambiente](#variáveis-de-ambiente)
14. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O sistema de pagamentos do GymRats é baseado no gateway **Abacate Pay** e funciona com cobranças avulsas (ONE_TIME) via **PIX**. Não há cobrança recorrente automática no gateway — cada renovação gera uma nova cobrança.

### Stack de Pagamentos

| Camada | Tecnologia | Arquivo Principal |
|--------|------------|-------------------|
| Gateway | Abacate Pay API v1 | `lib/api/abacatepay.ts` |
| Server Action | Next.js Server Actions | `lib/actions/abacate-pay.ts` |
| Webhook | Next.js API Route | `app/api/webhooks/abacatepay/route.ts` |
| State (UI) | Zustand | `stores/subscription-ui-store.ts` |
| State (Dados) | Zustand Unified | `hooks/use-student.ts` |
| Componente | React | `components/organisms/sections/subscription-section.tsx` |
| Página | React | `app/student/payments/student-payments-page.tsx` |
| Database | Prisma/PostgreSQL | `prisma/schema.prisma` (models: Subscription, SubscriptionPayment) |

---

## 🏗️ Arquitetura de Pagamentos

```
┌──────────────────────────────────────────────────────────────┐
│                    FRONTEND (Browser)                        │
│                                                              │
│  ┌─────────────────────┐    ┌─────────────────────────────┐  │
│  │ StudentPaymentsPage │───▶│   SubscriptionSection       │  │
│  │  (Página Principal) │    │  (Orquestrador de Planos)   │  │
│  └─────────────────────┘    └──────────┬──────────────────┘  │
│                                        │                     │
│  ┌─────────────────────┐    ┌──────────▼──────────────────┐  │
│  │SubscriptionUIStore  │◀───│      PlansSelector          │  │
│  │  (Zustand - UI)     │    │  (Seleção de Plano/Período) │  │
│  └─────────────────────┘    └──────────┬──────────────────┘  │
│                                        │ onClick "Assinar"   │
└────────────────────────────────────────┼─────────────────────┘
                                         │
                              ┌──────────▼──────────────────┐
                              │  createAbacateBilling()     │
                              │  (Server Action)            │
                              │  lib/actions/abacate-pay.ts │
                              └──────────┬──────────────────┘
                                         │
                    ┌────────────────────┐│┌────────────────────────┐
                    │   Prisma (DB)      │││   Abacate Pay API      │
                    │   Upsert           │◀│   POST /v1/billing     │
                    │   Subscription     │ │   Cria cobrança PIX    │
                    │   → pending_payment│ │   → Retorna { url }    │
                    └────────────────────┘ └───────────┬────────────┘
                                                       │
                              ┌─────────────────────────▼──────┐
                              │  Usuário paga via PIX          │
                              │  (Página do Abacate Pay)       │
                              └─────────────────────────┬──────┘
                                                        │
                              ┌──────────────────────────▼─────┐
                              │  Webhook POST                  │
                              │  /api/webhooks/abacatepay      │
                              │  Event: billing.paid           │
                              │  → Status: active              │
                              │  → Datas: +1 mês ou +1 ano    │
                              └────────────────────────────────┘
```

---

## 🗃️ Modelos de Dados

### Subscription (Aluno)

```prisma
model Subscription {
  id                   String    @id @default(cuid())
  studentId            String    @unique
  plan                 String    @default("free")        // "free", "Premium Mensal", "Premium Anual"
  status               String    @default("active")      // "active", "canceled", "pending_payment", "trialing"
  currentPeriodStart   DateTime
  currentPeriodEnd     DateTime
  cancelAtPeriodEnd    Boolean   @default(false)
  canceledAt           DateTime?
  trialStart           DateTime?
  trialEnd             DateTime?
  abacatePayBillingId  String?   @unique                 // ID da cobrança no gateway
  abacatePayCustomerId String?                            // ID do cliente no gateway
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
}
```

### SubscriptionPayment (Histórico)

```prisma
model SubscriptionPayment {
  id                  String    @id @default(cuid())
  subscriptionId      String?
  amount              Float                              // Em reais (não centavos)
  currency            String    @default("BRL")
  status              String                             // "succeeded", "pending", "failed"
  paymentMethod       String?                            // "pix", "credit_card"
  abacatePayBillingId String?   @unique
  paidAt              DateTime?
  createdAt           DateTime  @default(now())
}
```

### Ciclo de Status da Subscription

```
                    ┌──────────┐
         Novo ─────▶│   free   │
                    └────┬─────┘
                         │ startTrial() ou assinar
                    ┌────▼─────────────┐
                    │    trialing      │ (7 dias gratuitos)
                    └────┬─────────────┘
                         │ trial expira ou assina
              ┌──────────▼──────────────┐
              │    pending_payment      │ (aguardando PIX)
              └──────────┬──────────────┘
                         │ webhook billing.paid
                    ┌────▼─────┐
         ┌──────────│  active  │◀─── Re-assinatura
         │          └────┬─────┘
         │               │ cancelar
         │          ┌────▼──────┐
         │          │ canceled  │
         │          └───────────┘
         │
         │ upgrade (mensal→anual)
         └──▶ pending_payment ──▶ active (com novo período)
```

---

## 💰 Planos e Preços

### Student (Aluno)

| Plano | Período | Preço | Desconto |
|-------|---------|-------|----------|
| Premium Mensal | Mensal | R$ 15,00 | - |
| Premium Anual | Anual | R$ 150,00 | ~17% (2 meses grátis) |

Os preços são definidos em centavos no server action:

```typescript
// lib/actions/abacate-pay.ts
const prices = {
  premium: {
    monthly: 1500,  // R$ 15,00
    annual: 15000,  // R$ 150,00
  },
};
```

### Gym (Academia) - Futuros

| Plano | Mensal | Anual |
|-------|--------|-------|
| Basic | R$ 99 + R$ 5/aluno | R$ 990 (fixo) |
| Premium | R$ 199 + R$ 3/aluno | R$ 1990 (fixo) |
| Enterprise | R$ 499 + R$ 2/aluno | R$ 4990 (fixo) |

---

## 🆕 Fluxo de Assinatura (Primeira Vez)

### Passo a passo

1. **Usuário navega** para `/student?tab=payments&subTab=subscription`
2. **UI renderiza** `SubscriptionSection` > `PlansSelector` com os planos disponíveis
3. **Usuário seleciona** período (Mensal/Anual) via `BillingPeriodSelector`
4. **Usuário clica** "Assinar Premium"
5. **`handleUpgrade()`** é chamado no `StudentPaymentsPage`
6. **`createAbacateBilling()`** (Server Action) executa:
   - Valida sessão do usuário
   - Busca o `studentId` no banco
   - Cria cobrança no Abacate Pay com metadados (`studentId`, `planId`, `billingPeriod`)
   - Faz upsert na tabela `Subscription`:
     - `plan`: "Premium Mensal" ou "Premium Anual"
     - `status`: "pending_payment"
     - `currentPeriodStart`: agora
     - `currentPeriodEnd`: agora + 1 mês (ou + 1 ano)
     - `cancelAtPeriodEnd`: false
     - `canceledAt`: null
   - Retorna `{ url }` do checkout
7. **Browser redireciona** para a página de pagamento do Abacate Pay
8. **Usuário paga** via PIX
9. **Abacate Pay envia** webhook `billing.paid` para `/api/webhooks/abacatepay`
10. **Webhook processa**:
    - Encontra a subscription pelo `abacatePayBillingId` ou `metadata.studentId`
    - Calcula período: +1 ano (se `metadata.billingPeriod === "annual"` ou valor ≥ R$ 150) ou +1 mês
    - Atualiza subscription: `status: "active"`, novas datas de período
    - Registra pagamento na tabela `SubscriptionPayment`
11. **Abacate Pay redireciona** o usuário de volta para `completionUrl` com `?success=true`
12. **UI detecta** `success=true` via `useSearchParams` e inicia polling
13. **Polling** busca a subscription atualizada até detectar `status: "active"`
14. **Toast de sucesso** é exibido

### Diagrama de Sequência

```
Usuário     Frontend        Server Action      Abacate Pay     Webhook        DB
  │            │                  │                 │              │            │
  │──Clica────▶│                  │                 │              │            │
  │            │──createBilling──▶│                 │              │            │
  │            │                  │───POST /bill───▶│              │            │
  │            │                  │◀──{ url, id }───│              │            │
  │            │                  │──upsert─────────┼──────────────┼──────────▶│
  │            │                  │  pending_payment│              │            │
  │            │◀──{ url }────────│                 │              │            │
  │◀──redirect─│                  │                 │              │            │
  │──Paga PIX──┼──────────────────┼────────────────▶│              │            │
  │            │                  │                 │──billing.paid▶│           │
  │            │                  │                 │              │──update───▶│
  │            │                  │                 │              │  active    │
  │◀──redirect─┼──────────────────┼─────────────────│              │            │
  │            │──polling─────────┼──getSubscription─┼─────────────┼──read────▶│
  │            │◀─status:active───│                 │              │            │
  │◀──toast────│                  │                 │              │            │
```

---

## ⬆️ Fluxo de Upgrade (Mensal → Anual)

O upgrade segue o **mesmo fluxo** da assinatura, porém com regras de UI mais restritivas:

1. **PlansSelector** detecta que o usuário já está no Premium Mensal
2. **Título** muda para "Mudar para Plano Anual"
3. **BillingPeriodSelector** é pré-selecionado em "Anual" (via `initializeFromSubscription`)
4. **Filtro de planos**: Se o período selecionado for "monthly" (mesmo do atual), o card não aparece
5. **Ao clicar**: `createAbacateBilling("premium", "annual")` → checkout → pagamento → webhook atualiza

### Regras de UI para Upgrade

- ✅ Mensal → Anual: **Permitido** (mostra o card)
- ❌ Mensal → Mensal: **Bloqueado** (mesmo plano + mesmo período)
- ❌ Anual → Mensal: **Bloqueado** (sem downgrade)
- ❌ Anual → Anual: **Bloqueado** (já é o plano atual)

---

## ❌ Fluxo de Cancelamento

1. **Usuário clica** "Cancelar Assinatura" na UI
2. **Modal de confirmação** aparece
3. **`handleCancelConfirm()`** executa a mutation de cancelamento
4. **Optimistic Update**: UI reflete cancelamento imediatamente
5. **API atualiza** no banco:
   - `status`: "canceled"
   - `cancelAtPeriodEnd`: true
   - `canceledAt`: agora
6. **Usuário mantém acesso** até `currentPeriodEnd`

---

## 🔄 Fluxo de Re-assinatura

Quando um usuário cancelado tenta assinar novamente:

1. `createAbacateBilling` reseta os campos de cancelamento:
   - `cancelAtPeriodEnd`: false
   - `canceledAt`: null
2. Novas datas de período são calculadas a partir de agora
3. O fluxo segue normalmente (checkout → pagamento → webhook → active)

---

## 🎁 Trial (Período de Teste)

### Configuração

- **Duração**: 7 dias
- **Plano**: Premium (todas as features)
- **Limite**: 1 trial por aluno

### Fluxo

1. Usuário clica "Iniciar Teste Grátis" na `TrialOffer`
2. `handleStartTrial()` chama a API
3. Subscription criada com:
   - `status`: "trialing"
   - `trialStart`: agora
   - `trialEnd`: agora + 7 dias
   - `plan`: "Premium Mensal" (padrão)
4. Após 7 dias, o trial expira e a UI mostra opções de assinatura

---

## 📡 Webhook - Confirmação de Pagamento

### Endpoint

```
POST /api/webhooks/abacatepay?webhookSecret={SECRET}
```

### Segurança (Dupla verificação)

1. **HMAC Signature**: Header `x-webhook-signature` verificado com `verifyWebhookSignature()`
2. **Query Param Secret**: `?webhookSecret=` comparado com `ABACATEPAY_WEBHOOK_SECRET`
3. **Regra**: Pelo menos uma das duas verificações deve passar

### Evento: `billing.paid`

```json
{
  "event": "billing.paid",
  "data": {
    "billing": {
      "id": "bill_abc123",
      "amount": 15000,
      "status": "PAID",
      "customer": { "id": "cust_xyz" },
      "metadata": {
        "studentId": "cmk76bfmw...",
        "planId": "premium",
        "billingPeriod": "annual"
      }
    }
  }
}
```

### Processamento

1. **Busca** a subscription por `abacatePayBillingId` ou `metadata.studentId`
2. **Determina** se é anual: `metadata.billingPeriod === "annual"` ou `amount >= 15000`
3. **Calcula** período: `+1 ano` (anual) ou `+1 mês` (mensal)
4. **Atualiza** subscription:
   - `plan`: "Premium Anual" ou "Premium Mensal"
   - `status`: "active"
   - `currentPeriodStart`: agora
   - `currentPeriodEnd`: agora + período
   - `cancelAtPeriodEnd`: false
   - `canceledAt`: null
5. **Registra** pagamento em `SubscriptionPayment`

---

## 🖥️ Frontend - Componentes de UI

### Hierarquia de Componentes

```
StudentPaymentsPage
├── Tabs: Academias | Histórico | Métodos | Assinatura
│
└── Tab "Assinatura"
    └── SubscriptionSection (Orquestrador)
        ├── TrialOffer (Se elegível)
        ├── SubscriptionStatus (Status atual + cancelar)
        ├── DuoCard (Trial ativo com contagem regressiva)
        └── PlansSelector
            ├── BillingPeriodSelector (Mensal / Anual)
            └── PlanCard[] (Cards dos planos disponíveis)
```

### SubscriptionUIStore (Zustand)

Gerencia o estado da UI de seleção de planos:

```typescript
interface SubscriptionUIState {
  selectedPlan: string;                        // ex: "premium"
  selectedBillingPeriod: "monthly" | "annual"; // período selecionado
  isProcessingPayment: boolean;                // loading do checkout

  // Inicializa com base na subscription atual
  initializeFromSubscription(plans, currentPlan, currentBillingPeriod, userType);
}
```

**Regra de inicialização para Student**:
- Se está no **Mensal** → pré-seleciona **Anual** (para facilitar o upgrade)
- Se está no **Anual** → planos não aparecem (sem downgrade)
- Se **não tem** subscription → pré-seleciona **Premium Mensal**

### Proteção contra Reset de UI

O `SubscriptionSection` usa um `useRef` para evitar que o `initializeFromSubscription` seja chamado múltiplas vezes com os mesmos dados, prevenindo que a seleção do usuário seja resetada por re-renders:

```typescript
const prevSubscriptionId = useRef<string | null>(null);
useEffect(() => {
  const checkKey = `${subId}-${subPlan}-${subPeriod}`;
  if (prevSubscriptionId.current !== checkKey) {
    initializeFromSubscription(...);
    prevSubscriptionId.current = checkKey;
  }
}, [...]);
```

---

## 📏 Regras de Negócio

### Filtro de Planos (PlansSelector)

| Situação | O que aparece |
|----------|---------------|
| Sem subscription | Todos os planos |
| Trial ativo | Todos os planos |
| Premium Mensal ativo | Apenas Premium Anual (upgrade) |
| Premium Anual ativo | Nenhum plano (sem downgrade) |
| Cancelado | Todos os planos (re-assinar) |
| Pending Payment | Depende do plano pendente |

### Detecção de Billing Period

A função `getStudentSubscription()` em `app/student/actions.ts` infere o `billingPeriod` com **duas estratégias**:

1. **Pelo nome do plano** (prioridade): Se contém "Anual" → `annual`
2. **Pela diferença de datas** (fallback): Se `currentPeriodEnd - currentPeriodStart > 330 dias` → `annual`

```typescript
let billingPeriod: "monthly" | "annual" = "monthly";
if (subscription.plan.toLowerCase().includes("anual")) {
  billingPeriod = "annual";
} else if (daysDiff >= 330 && daysDiff <= 370) {
  billingPeriod = "annual";
}
```

### Nomes de Plano

Os nomes são salvos de forma descritiva no banco:

| Contexto | Nome salvo |
|----------|------------|
| Checkout (pending) | "Premium Mensal" ou "Premium Anual" |
| Webhook (active) | "Premium Mensal" ou "Premium Anual" |
| Trial | "Premium Mensal" (padrão) |
| Legado | "premium" (normalizado em runtime) |

---

## 🔐 Variáveis de Ambiente

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `NEXT_PUBLIC_APP_URL` | URL base da aplicação | `https://gymrats.app` |
| `ABACATEPAY_API_TOKEN` | Token de API do Abacate Pay | `apt_live_xxx` |
| `ABACATEPAY_WEBHOOK_SECRET` | Secret para validação do webhook | `whsec_xxx` |

---

## 🔧 Troubleshooting

### Status fica `pending_payment` após pagar

**Causa provável**: Webhook não está chegando ou está falhando.

**Verificar**:
1. URL do webhook configurada no Abacate Pay: `{APP_URL}/api/webhooks/abacatepay?webhookSecret={SECRET}`
2. Logs do servidor para ver se o webhook está sendo recebido
3. Se o `abacatePayBillingId` no banco corresponde ao ID da cobrança paga
4. Se a variável `ABACATEPAY_WEBHOOK_SECRET` está correta

**Mitigação**: O `createAbacateBilling` já salva as datas corretas de período no checkout, então a UI mostra as informações corretas mesmo sem o webhook.

### Datas de período erradas

**Causa**: A subscription mantinha datas de um plano anterior.

**Solução implementada**: O `createAbacateBilling` agora calcula e salva `currentPeriodStart` e `currentPeriodEnd` corretos no momento do checkout, baseado no `billingPeriod`.

### UI reseta a seleção de "Anual" para "Mensal"

**Causa**: O `initializeFromSubscription` era chamado em cada re-render por mudança de referência do array de `plans`.

**Solução implementada**: 
1. Array de `plans` memoizado com `useMemo` no `StudentPaymentsPage`
2. `useRef` no `SubscriptionSection` para evitar re-inicializações desnecessárias

### Usuário consegue re-assinar o mesmo plano ativo

**Causa**: Filtro de planos não verificava corretamente o plano + período atual.

**Solução implementada**: `PlansSelector` agora bloqueia qualquer card que tenha o mesmo `planId + billingPeriod` da subscription ativa.

---

## 📁 Arquivos Relacionados

| Arquivo | Responsabilidade |
|---------|------------------|
| `lib/api/abacatepay.ts` | Cliente HTTP do Abacate Pay (createBilling, createCustomer, verifyWebhook) |
| `lib/actions/abacate-pay.ts` | Server Action: cria cobrança e faz upsert da subscription |
| `app/api/webhooks/abacatepay/route.ts` | Webhook handler: processa `billing.paid` |
| `app/student/actions.ts` | `getStudentSubscription()`: busca e formata dados da subscription |
| `stores/subscription-ui-store.ts` | Estado da UI de seleção de planos (Zustand) |
| `hooks/use-subscription.ts` | Hook de mutations (cancelar, iniciar trial) |
| `hooks/use-subscription-unified.ts` | Hook unificado com dados + mutations |
| `components/organisms/sections/subscription-section.tsx` | Componente orquestrador da subscription |
| `components/organisms/sections/subscription/plans-selector.tsx` | Seleção e filtragem de planos |
| `components/organisms/sections/subscription/billing-period-selector.tsx` | Toggle Mensal/Anual |
| `components/organisms/sections/subscription/subscription-status.tsx` | Exibição do status atual |
| `components/organisms/sections/subscription/trial-offer.tsx` | Card de oferta de trial |
| `app/student/payments/student-payments-page.tsx` | Página principal de pagamentos do aluno |
| `prisma/schema.prisma` | Models: Subscription, SubscriptionPayment |

---

*Documentação gerada em 24/02/2026 — GymRats v1.0*
