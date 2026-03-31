# GymRats - Guia Mestre da Plataforma

Atualizado em: 2026-03-12

## 1. Objetivo deste documento

Este arquivo existe para explicar a plataforma GymRats de ponta a ponta com base no comportamento real do codigo atual. Ele cobre:

- visao de negocio
- monetizacao
- regras de negocio
- fluxo de assinaturas e pagamentos
- diferencas entre student, gym, personal e admin
- arquitetura do monorepo
- mapa de apps, packages, rotas, hooks, stores e componentes
- escolhas tecnicas relevantes
- pontos de atencao e nuances da implementacao atual

Sempre que houver diferenca entre discurso comercial e comportamento real, este documento prioriza o comportamento real do codigo.

---

## 2. O que e a plataforma

GymRats e uma plataforma fitness multi-tenant com tres grandes frentes:

1. `student`: app do aluno para treino, nutricao, progresso, pagamentos, academias e personais.
2. `gym`: backoffice da academia para alunos, planos, pagamentos, cupons, campanhas, check-ins, equipamentos e assinatura da propria academia.
3. `personal`: backoffice do personal trainer para alunos, afiliacoes com academias, planos proprios, cobrancas e campanhas.

Em termos de produto, a plataforma mistura:

- SaaS B2C para aluno
- SaaS B2B para academia
- SaaS B2B2C para personal
- marketplace/rede para descoberta de academias e personais
- camada gamificada de treino e educacao
- camada financeira baseada principalmente em PIX

---

## 3. Visao de negocio e tese de monetizacao

### 3.1 Tese central

O GymRats tenta monetizar em varias camadas ao mesmo tempo:

- assinatura direta do aluno
- assinatura da academia
- assinatura do personal
- cobranca recorrente da mensalidade da academia do aluno
- cobranca da mensalidade/plano do personal para o aluno
- campanhas de impulsionamento
- comissoes/referrals

### 3.2 Como o negocio se sustenta

As principais receitas hoje no codigo sao:

#### Receita 1: assinatura do aluno

- Plano `Premium`
- Plano `Pro` no catalogo de planos e no motor de acesso

#### Receita 2: assinatura da academia

- Plano `Basic`
- Plano `Premium`
- Plano `Enterprise`

No plano mensal da academia existe uma composicao:

- preco base do plano
- preco por aluno ativo
- preco por personal afiliado ativo

No plano anual o comportamento atual e mais simples:

- cobra somente a base anual
- `pricePerStudent = 0`
- `pricePerPersonal = 0`

#### Receita 3: assinatura do personal

- Plano `Standard`
- Plano `Pro AI`

Personais afiliados a academias com `premium` ou `enterprise` ativos recebem 50% de desconto na propria assinatura.

#### Receita 4: pagamentos recorrentes de servicos

- aluno compra plano de academia
- aluno compra plano de personal
- academia recebe do aluno
- personal recebe do aluno

#### Receita 5: boost campaigns

Academias e personais podem comprar campanhas impulsionadas na vitrine/local discovery.

#### Receita 6: referrals

Alunos indicam novos alunos, academias ou personais:

- o indicado recebe 5% de desconto no checkout quando o codigo e valido
- o aluno indicador recebe 50% de comissao no primeiro pagamento confirmado do indicado

---

## 4. Perfis de usuario e dominios de responsabilidade

### 4.1 Student

Responsabilidades do lado do aluno:

- onboarding fitness
- assinatura do app
- acesso a treino e nutricao
- historico de treino e recordes
- progresso gamificado
- descobrir academias
- contratar planos de academias
- contratar personais
- gerenciar referrals
- acompanhar pagamentos

### 4.2 Gym

Responsabilidades da academia:

- onboarding da unidade
- cadastro e manutencao de perfil
- assinatura do SaaS da academia
- criacao de planos de membership
- controle de alunos
- emissao e acompanhamento de pagamentos
- cupons e campanhas
- check-in e checkout
- equipamentos e manutencao
- despesas e resumo financeiro
- filiacao com personais
- atribuicao de personal para aluno

### 4.3 Personal

Responsabilidades do personal:

- onboarding profissional
- assinatura do SaaS do personal
- afiliacao com academias
- gestao de alunos proprios
- cobranca de planos proprios
- cupons e campanhas
- despesas e financeiro
- acompanhamento de alunos

### 4.4 Admin

No motor de acesso, `ADMIN` e bypass:

- pode tudo no `packages/access-control/src/core.ts`
- tambem acessa o dashboard de observabilidade

---

## 5. Matriz de planos e precos

Fonte principal: `packages/access-control/src/plans-config.ts`

## 5.1 Planos do aluno

| Plano | Mensal | Anual | Observacao |
| --- | ---: | ---: | --- |
| Premium | R$ 6,00 | R$ 60,00 | treino IA, nutricao IA e recursos premium do app |
| Pro | R$ 150,00 | R$ 1.500,00 | inclui Premium + network access |

Features comerciais do `Premium`:

- treinos personalizados com IA
- planos de dieta com IA
- acompanhamento de progresso e metricas
- historico de treinos e recordes
- integracao com academias parceiras

Features comerciais do `Pro`:

- tudo do Premium
- acesso livre a toda rede parceira

## 5.2 Planos da academia

| Plano | Base mensal | Base anual | Por aluno ativo no mensal | Por personal afiliado no mensal |
| --- | ---: | ---: | ---: | ---: |
| Basic | R$ 300,00 | R$ 3.000,00 | R$ 1,50 | R$ 150,00 |
| Premium | R$ 500,00 | R$ 5.000,00 | R$ 1,00 | R$ 100,00 |
| Enterprise | R$ 700,00 | R$ 7.000,00 | R$ 0,50 | R$ 50,00 |

Descricao comercial:

- `Basic`: academia individual
- `Premium`: multiplas unidades e relatorios avancados
- `Enterprise`: premium + beneficio para alunos

Formula atual de cobranca mensal da academia:

```text
total = preco_base + (alunos_ativos * preco_por_aluno) + (personais_ativos * preco_por_personal)
```

Formula atual de cobranca anual:

```text
total = preco_base_anual
```

## 5.3 Planos do personal

| Plano | Mensal | Anual | Desconto por afiliacao premium/enterprise |
| --- | ---: | ---: | ---: |
| Standard | R$ 300,00 | R$ 3.000,00 | 50% |
| Pro AI | R$ 450,00 | R$ 4.500,00 | 50% |

Regra real:

- se o personal tem afiliacao ativa com uma academia cujo plano esta `premium` ou `enterprise`, a assinatura do personal recebe `discountPercent = 50`

---

## 6. Controle de acesso e destravamento de features

Arquivos principais:

- `packages/access-control/src/features.ts`
- `packages/access-control/src/policies.ts`
- `packages/access-control/src/core.ts`
- `packages/access-control/src/types.ts`

### 6.1 Chaves centrais de feature

- `use_ai_workout`
- `use_ai_nutrition`
- `assign_personal`
- `boost_placement`
- `advanced_reports`
- `network_access`

### 6.2 Politicas diretas por papel e plano

#### Student

- `FREE`: sem features premium
- `PREMIUM`: `use_ai_workout`, `use_ai_nutrition`
- `PRO`: `use_ai_workout`, `use_ai_nutrition`, `network_access`

#### Gym

- `BASIC`: `use_ai_workout`, `use_ai_nutrition`
- `PREMIUM`: `use_ai_workout`, `use_ai_nutrition`, `advanced_reports`
- `ENTERPRISE`: `use_ai_workout`, `use_ai_nutrition`, `advanced_reports`, `assign_personal`

#### Personal

- `STANDARD`: `use_ai_workout`
- `PRO_AI`: `use_ai_workout`, `use_ai_nutrition`

### 6.3 Heranca por ambiente

O motor `checkAbility(user, feature, env)` trabalha com duas camadas:

1. habilidade direta pelo plano do proprio usuario
2. habilidade herdada do ambiente atual

Hoje a heranca implementada mais importante e:

- `GymInheritedFeatures.ENTERPRISE` concede `use_ai_workout` e `use_ai_nutrition`

### 6.4 Nuance importante do Enterprise

Existe uma diferenca entre marketing e comportamento real:

- o `plans-config.ts` diz: "Plano Basic gratuito para todos os seus alunos"
- o `GymSubscriptionService.syncStudentEnterpriseBenefit()` efetivamente promove o aluno para `subscription.plan = "premium"` com `source = "GYM_ENTERPRISE"`

Na pratica atual, o aluno beneficiado pelo Enterprise:

- ganha acesso premium do app
- fica marcado com `source = GYM_ENTERPRISE`
- pode ter restauracao do periodo proprio se sair da academia

Ou seja: o Enterprise hoje faz mais do que apenas "basic gratis". O comportamento de runtime se aproxima de `premium patrocinado pela academia`.

---

## 7. Fluxos criticos de negocio

## 7.1 Autenticacao e sessao

Arquivos principais:

- `apps/web/stores/auth-store.ts`
- `apps/web/components/providers/auth-session-provider.tsx`
- `apps/web/hooks/use-user-session.ts`
- `apps/api/src/routes/auth/**`

Fluxo:

1. o frontend sobe e `AuthSessionProvider` chama `ensureSession()`
2. o store de auth usa TTL de 60 segundos para evitar sincronizacao redundante
3. o client usa token/cookie para chamar `/api/auth/session`
4. se falhar com 401, tenta `refreshAuthToken()`
5. o app decide o papel e o shell correto do usuario

Regra importante:

- `useUserSession()` hoje e hook de leitura
- a carga real de sessao fica centralizada no auth store

## 7.2 Onboarding de aluno

Arquivos principais:

- `apps/web/app/student/onboarding/**`
- `apps/api/src/routes/students/onboarding/route.ts`
- `apps/api/src/lib/services/student-domain.service.ts`

O onboarding coleta:

- dados basicos
- objetivos
- nivel
- disponibilidade
- perfil corporal
- preferencias de treino e dieta
- limitacoes

Esses dados abastecem:

- `Student`
- `StudentProfile`
- `StudentProgress`

## 7.3 Trial do aluno

Arquivo principal:

- `apps/api/src/lib/utils/auto-trial.ts`

Regra atual:

- trial de 14 dias
- so pode ser usado uma vez
- se `trialStart` ja existe, nunca mais pode usar
- se ja assinou algo pago antes, nao pode usar
- o trial cria ou atualiza a assinatura para `plan = "premium"` e `status = "trialing"`

## 7.4 Assinatura propria do aluno

Arquivos principais:

- `apps/api/src/lib/api/handlers/subscriptions.handler.ts`
- `apps/api/src/lib/utils/subscription.ts`
- `apps/api/src/routes/subscriptions/**`
- `apps/worker/src/webhook.worker.ts`
- `apps/api/src/lib/services/webhook.service.ts`

Fluxo:

1. aluno chama `/api/subscriptions/create`
2. backend valida sessao
3. valida referral se existir
4. cria ou atualiza `Subscription` com `status = "pending_payment"`
5. gera PIX via AbacatePay
6. salva `abacatePayBillingId`
7. frontend mostra QR/brCode
8. AbacatePay confirma pagamento via webhook
9. webhook vai para fila BullMQ
10. worker processa e muda assinatura para `status = "active"`
11. cria `SubscriptionPayment`
12. processa referral do primeiro pagamento

Nuance atual:

- o handler principal de student hoje cria checkout para `premium`
- o catalogo e o motor de acesso ja conhecem `PRO`
- o webhook tambem sabe marcar `Pro`, mas o self-service principal inspecionado ainda esta mais orientado a `Premium`

## 7.5 O que acontece quando uma academia assina o plano Enterprise

Esta e uma das regras centrais do sistema.

Arquivos principais:

- `packages/access-control/src/plans-config.ts`
- `apps/api/src/routes/gym-subscriptions/create/route.ts`
- `apps/api/src/lib/utils/subscription.ts`
- `apps/api/src/lib/services/gym/gym-subscription.service.ts`
- `apps/api/src/lib/services/webhook.service.ts`

### Passo a passo da contratacao

1. a academia autenticada chama `/api/gym-subscriptions/create`
2. o backend identifica a `gymId` ativa
3. conta alunos ativos em `GymMembership`
4. conta personais afiliados ativos em `GymPersonalAffiliation`
5. calcula o valor total do plano
6. cria ou atualiza `GymSubscription` com `status = "pending"`
7. gera PIX via `createGymSubscriptionPix()`
8. salva `abacatePayBillingId`
9. frontend exibe PIX
10. webhook `billing.paid` chega via AbacatePay
11. o worker ativa a assinatura da academia
12. `GymSubscriptionService.handleGymDowngrade()` e chamado para recalibrar o ecossistema
13. `GymSubscriptionService.syncAllStudentsEnterpriseBenefit(gymId)` propaga o beneficio aos alunos ativos daquela academia

### Como o valor e calculado

No mensal:

```text
enterprise_mensal = 70000 centavos + (alunos_ativos * 50) + (personais_ativos * 5000)
```

Em reais:

```text
enterprise_mensal = R$ 700,00 + (alunos_ativos * R$ 0,50) + (personais_ativos * R$ 50,00)
```

No anual:

```text
enterprise_anual = R$ 7.000,00
```

### Efeito nos alunos da academia

Ao detectar membership ativa em academia enterprise ativa:

1. o sistema procura memberships do aluno em gyms com `subscription.plan = "enterprise"` e `status = "active"`
2. se existir pelo menos uma, marca ou atualiza a assinatura do aluno como:
   - `plan = "premium"`
   - `status = "active"`
   - `source = "GYM_ENTERPRISE"`
   - `enterpriseGymId = gymId`
3. se o aluno ja tinha premium proprio com periodo futuro, salva o fim do periodo em `ownPeriodEndBackup`

### Restauracao quando o aluno sai do Enterprise

Se o aluno perde o beneficio enterprise:

- se havia `ownPeriodEndBackup` futuro, o sistema restaura a assinatura propria:
  - `source = "OWN"`
  - `plan = "premium"`
  - `status = "active"`
- se nao havia backup valido:
  - a assinatura vira `plan = "free"`
  - `status = "inactive"`

### Impacto sobre multiplas unidades

Uma mesma conta de academia pode ter varias unidades (`Gym`).

Regra importante:

- a unidade mais antiga e a "principal"
- so a principal, com assinatura `premium` ou `enterprise` ativa, consegue manter/desbloquear as outras unidades
- se a principal cai para basic, free ou cancelado, as demais podem ser inativadas/canceladas

### Regra de cancelamento da academia principal

Quando a unidade principal cancela:

- a principal cancela a propria assinatura
- as demais podem ser canceladas com `canceledBecausePrincipalCanceled = true`
- se a principal voltar a assinar antes do periodo expirar, as outras podem ser restauradas

Isto e controlado por:

- `enforceActiveGymLimit()`
- `restoreSubscriptionsSuspendedByPrincipalCancelOnly()`
- `restoreSubscriptionsSuspendedByPrincipalCancel()`
- `suspendOtherGymsBecausePrincipalDowngraded()`

## 7.6 Trial da academia

Arquivos principais:

- `apps/api/src/routes/gym-subscriptions/start-trial/route.ts`
- `apps/api/src/lib/utils/auto-trial.ts`

Regra atual:

- trial de 14 dias
- plano base do trial = `basic`
- billing period = `monthly`
- cria `GymSubscription` com `status = "trialing"`

## 7.7 Aluno entrando em uma academia

Arquivos principais:

- `apps/api/src/routes/students/gyms/[gymId]/join/route.ts`
- `apps/api/src/lib/services/gym/gym-membership-payment.service.ts`
- `apps/api/src/lib/services/gym-domain.service.ts`
- `apps/api/src/lib/services/webhook.service.ts`

Fluxo:

1. aluno escolhe um `MembershipPlan` de uma academia
2. backend verifica se ele ja possui membership `active` ou `pending`
3. aplica cupom se houver
4. cria `GymMembership` com `status = "pending"`
5. cria PIX para o pagamento da membership
6. cria `Payment` em `pending`
7. quando o webhook confirma:
   - `Payment` vira `paid`
   - `GymMembership` vira `active`
   - `GymProfile.activeStudents` incrementa
   - se a academia for enterprise, recalcula beneficio do aluno

Regra importante:

- mesmo em academia enterprise, o aluno continua pagando a mensalidade da academia
- o beneficio enterprise e sobre o plano do app, nao sobre a mensalidade da academia

## 7.8 Pagamento pendente e "Pagar agora"

Arquivos principais:

- `apps/api/src/routes/students/payments/[paymentId]/pay-now/route.ts`
- `apps/api/src/routes/payments/[paymentId]/route.ts`
- `apps/api/src/lib/services/gym/gym-membership-payment.service.ts`
- `apps/web/hooks/use-payment-flow.ts`
- `apps/web/hooks/use-payment-status.ts`

Fluxo:

1. existe um `Payment` pendente
2. aluno abre a tela de pagamentos
3. ao clicar em pagar, frontend chama `/api/students/payments/[paymentId]/pay-now`
4. backend tenta reaproveitar o PIX em cache se ainda estiver valido
5. se nao estiver, gera outro PIX
6. frontend faz polling do status com backoff `2s -> 5s -> 10s`
7. o polling pausa quando a aba fica oculta
8. para em status terminal:
   - `paid`
   - `canceled`
   - `expired`
   - `withdrawn`

Regra de idempotencia:

- mutacoes importantes usam `X-Idempotency-Key`
- o `createSafeHandler` replaya resposta se a chave ja tiver sido concluida

## 7.9 Contratacao de personal pelo aluno

Arquivos principais:

- `apps/api/src/routes/students/personals/[personalId]/subscribe/route.ts`
- `apps/api/src/lib/services/webhook.service.ts`

Fluxo:

1. aluno escolhe um plano do personal
2. backend valida que nao existe assignment ativo previo
3. aplica cupom se houver
4. cria `PersonalStudentPayment` com `status = "pending"`
5. gera PIX
6. salva `abacatePayBillingId`
7. quando o webhook confirma:
   - cria ou reativa `StudentPersonalAssignment`
   - `assignedBy = "PERSONAL"`
   - `status = "active"`
   - `PersonalStudentPayment` vira `paid`

## 7.10 Atribuicao de personal pela academia

Arquivos principais:

- `apps/api/src/routes/gym/students/[id]/assign-personal/route.ts`
- `apps/api/src/lib/services/personal/student-personal.service.ts`

Regras:

- personal precisa estar afiliado ativamente a academia
- assignment via academia usa `assignedBy = "GYM"`
- assignment e identificado pela combinacao `studentId + personalId + gymId`

## 7.11 Assinatura do personal

Arquivos principais:

- `apps/api/src/routes/personals/subscription/route.ts`
- `apps/api/src/routes/personals/subscription/cancel/route.ts`
- `apps/api/src/lib/services/personal/personal-subscription.service.ts`
- `apps/api/src/lib/utils/subscription.ts`

Fluxo:

1. personal pede assinatura com `plan` e `billingPeriod`
2. backend checa se ha afiliacao ativa a gym premium/enterprise
3. calcula preco efetivo com ou sem 50% de desconto
4. faz `upsert` em `PersonalSubscription` com `status = "pending_payment"`
5. gera PIX
6. no webhook, vira `active`

## 7.12 Referrals

Arquivo principal:

- `apps/api/src/lib/services/referral.service.ts`

Regras atuais:

- o codigo de referral e gerado a partir do prefixo do email do aluno, com `@`
- evita auto-indicacao de student para ele mesmo
- impede criar mais de um referral para a mesma entidade indicada
- referral atende tres tipos:
  - `STUDENT`
  - `GYM`
  - `PERSONAL`

### Desconto do indicado

Hoje o desconto aplicado no checkout e:

- `5%` sobre o valor da assinatura quando o codigo e valido

Isto ocorre em:

- assinatura do aluno
- assinatura da academia

### Comissao do indicador

No primeiro pagamento confirmado:

- `commissionAmountCents = floor(amountCents * 0.5)`
- o referral muda de `PENDING` para `CONVERTED`

Em outras palavras:

- 50% de comissao sobre o primeiro pagamento confirmado do indicado

## 7.13 Saques de referrals do aluno

Arquivos principais:

- `apps/api/src/lib/services/referral.service.ts`

Regras:

- valor minimo de saque: R$ 3,50
- precisa cadastrar `pixKey` e `pixKeyType`
- saldo desconta saques `pending` e `complete`
- o calculo atual considera taxa fixa de `R$ 0,80` por saque

## 7.14 Saques da academia

Arquivos principais:

- `apps/api/src/lib/services/gym/gym-financial.service.ts`

Regras:

- valor minimo de saque: R$ 3,50
- academia precisa cadastrar chave PIX
- saldo disponivel considera:
  - pagamentos `paid`
  - menos taxa de R$ 0,80 por pagamento recebido
  - menos saques concluidos
  - menos taxa de R$ 0,80 por saque

## 7.15 Boost campaigns

Arquivos principais:

- `apps/api/src/routes/boost-campaigns/nearby/route.ts`
- `apps/api/src/routes/gyms/boost-campaigns/**`
- `apps/api/src/routes/personals/boost-campaigns/**`
- `apps/api/src/lib/services/webhook.service.ts`

Regras:

- campanha nasce `pending_payment`
- apos webhook vira `active`
- possui `startsAt` e `endsAt`
- expira automaticamente quando passa do horario
- pode ser filtrada por raio geografico usando latitude/longitude e haversine
- cada aluno conta no maximo 1 impressao e 1 clique por campanha

---

## 8. Modelo de dados principal

Fonte principal: `packages/db/prisma/schema.prisma`

### 8.1 Entidades de identidade

- `User`
- `Account`
- `Session`
- `Verification`

### 8.2 Entidades do aluno

- `Student`
- `StudentProfile`
- `StudentProgress`
- `WeightHistory`
- `WorkoutHistory`
- `WorkoutProgress`
- `PersonalRecord`
- `DailyNutrition`
- `Subscription`
- `SubscriptionPayment`
- `Referral`
- `StudentWithdraw`

### 8.3 Entidades da academia

- `Gym`
- `GymProfile`
- `GymStats`
- `GymSubscription`
- `GymMembership`
- `MembershipPlan`
- `Payment`
- `Expense`
- `GymWithdraw`
- `GymCoupon`
- `Equipment`
- `MaintenanceRecord`
- `CheckIn`

### 8.4 Entidades do personal

- `Personal`
- `PersonalSubscription`
- `GymPersonalAffiliation`
- `StudentPersonalAssignment`
- `PersonalMembershipPlan`
- `PersonalStudentPayment`
- `PersonalCoupon`
- `PersonalExpense`

### 8.5 Conteudo e treino

- `WeeklyPlan`
- `PlanSlot`
- `Workout`
- `WorkoutExercise`
- `NutritionPlan`
- `Meal`

### 8.6 Marketplace e growth

- `BoostCampaign`
- `BoostCampaignEngagement`
- `ProGymAccess`

### 8.7 Observabilidade

- `TelemetryEvent`
- `TelemetryRollupMinute`
- `BusinessEvent`
