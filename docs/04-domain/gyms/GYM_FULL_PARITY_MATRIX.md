# Matriz de Paridade Full do Modulo Gym (As-Is -> Target)

## Objetivo

Definir a convergencia arquitetural do `gym` para o mesmo nivel do `student`, cobrindo:

- contratos e borda API
- dominio e invariantes
- store unificado + runtime de carregamento
- offline-first com command pattern
- idempotencia ponta a ponta
- observabilidade e rollout seguro

---

## 1) Estado Atual x Estado Alvo


| Capability                  | Student (Referencia)                             | Gym (Atual)                                          | Gap Critico                                       | Alvo de Paridade                               |
| --------------------------- | ------------------------------------------------ | ---------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------- |
| Borda API padronizada       | `createSafeHandler` + schemas + auth strategy    | Hibrido (`createSafeHandler` + handlers manuais)     | Contratos inconsistentes e respostas heterogeneas | 100% rotas `gym` em `createSafeHandler`        |
| Dominio centralizado        | `StudentDomainService` + servicos especializados | Servicos `gym-*` + logica espalhada em rotas/actions | Duplicacao de regra e risco de drift              | `GymDomainService` como ponto canonico         |
| Store unificado             | `student-unified-store` completo                 | `gym-store` simples e pouco acoplado ao runtime      | Sem pipeline unico de estado/sync                 | `gym-unified-store` com seções canonicas       |
| Carregamento priorizado     | `useStudentInitializer` + `useLoadPrioritized`   | fetch server-side massivo em `app/gym/page.tsx`      | Custo alto de bootstrap e pouca granularidade     | `useGymInitializer` + `useLoadPrioritizedGym`  |
| Offline-first real          | queue + SW + retries + command logs              | inexistente no fluxo principal gym                   | Perda de resiliencia em rede instavel             | mutacoes gym com `syncManager` + queue/SW      |
| Command Pattern             | comandos versionados por mutacao                 | inexistente no gym                                   | sem replay seguro e auditoria local               | comandos para mutacoes criticas gym            |
| Idempotencia E2E            | header no cliente e recomendacao server-side     | sem camada deduplicadora server-side                 | risco de duplicidade em retry/webhook/replay      | middleware utilitario de idempotencia por rota |
| Single-flight de sessao     | parcialmente enderecado no student               | `useUserSession` pode duplicar chamadas              | latencia e carga desnecessaria                    | cache/single-flight de `/api/auth/session`     |
| Observabilidade operacional | logs de comando/fila + sinais de sync            | logs pontuais por rota                               | visao parcial em producao                         | metricas por secao, erros e fila               |


---

## 2) Mapa Canonico de Seções Gym

Seções que passam a representar o shape canonico do estado de `gym`:

- `profile`
- `stats`
- `students`
- `equipment`
- `financialSummary`
- `recentCheckIns`
- `membershipPlans`
- `payments`
- `expenses`
- `subscription`
- `metadata` (loading, initialized, lastSync, pendingActions, errors, telemetry)

---

## 3) Matriz Endpoint -> Secao -> Dominio


| Secao              | Endpoint                             | Dominio/Service                           |
| ------------------ | ------------------------------------ | ----------------------------------------- |
| `profile`          | `GET /api/gyms/profile`              | `GymInventoryService.getProfile`          |
| `stats`            | `GET /api/gyms/stats`                | `GymInventoryService.getStats`            |
| `students`         | `GET /api/gyms/members`              | `GymDomainService.getMembers`             |
| `equipment`        | `GET /api/gyms/equipment`            | `GymInventoryService.getEquipment`        |
| `recentCheckIns`   | `GET /api/gyms/checkins/recent`      | `GymMemberService.getRecentCheckIns`      |
| `financialSummary` | `GET /api/gyms/financial-summary`    | `GymFinancialService.getFinancialSummary` |
| `membershipPlans`  | `GET /api/gyms/plans`                | `GymDomainService.getPlans`               |
| `payments`         | `GET /api/gyms/payments`             | `GymDomainService.getPayments`            |
| `expenses`         | `GET /api/gyms/expenses`             | `GymDomainService.getExpenses`            |
| `subscription`     | `GET /api/gym-subscriptions/current` | `GymSubscriptionHandler`                  |


---

## 4) Matriz de Mutacoes Criticas (Command + Idempotencia)


| Mutacao                    | Endpoint                                         | CommandType                        | Prioridade |
| -------------------------- | ------------------------------------------------ | ---------------------------------- | ---------- |
| Check-in                   | `POST /api/gyms/checkin`                         | `GYM_CHECKIN_CREATE`               | high       |
| Check-out                  | `POST /api/gyms/checkout`                        | `GYM_CHECKOUT_UPDATE`              | high       |
| Matricular aluno           | `POST /api/gyms/members`                         | `GYM_MEMBERSHIP_CREATE`            | high       |
| Atualizar status matricula | `PATCH /api/gyms/members/[membershipId]`         | `GYM_MEMBERSHIP_UPDATE_STATUS`     | high       |
| Criar equipamento          | `POST /api/gyms/equipment`                       | `GYM_EQUIPMENT_CREATE`             | normal     |
| Atualizar equipamento      | `PATCH /api/gyms/equipment/[equipId]`            | `GYM_EQUIPMENT_UPDATE`             | normal     |
| Registrar manutencao       | `POST /api/gyms/equipment/[equipId]/maintenance` | `GYM_EQUIPMENT_MAINTENANCE_CREATE` | normal     |
| Criar despesa              | `POST /api/gyms/expenses`                        | `GYM_EXPENSE_CREATE`               | normal     |
| Criar pagamento            | `POST /api/gyms/payments`                        | `GYM_PAYMENT_CREATE`               | high       |
| Atualizar status pagamento | `PATCH /api/gyms/payments/[paymentId]`           | `GYM_PAYMENT_STATUS_UPDATE`        | high       |
| Criar plano                | `POST /api/gyms/plans`                           | `GYM_PLAN_CREATE`                  | normal     |
| Atualizar plano            | `PATCH /api/gyms/plans/[planId]`                 | `GYM_PLAN_UPDATE`                  | normal     |
| Subscription create        | `POST /api/gym-subscriptions/create`             | `GYM_SUBSCRIPTION_CREATE`          | high       |
| Subscription cancel        | `POST /api/gym-subscriptions/cancel`             | `GYM_SUBSCRIPTION_CANCEL`          | high       |


---

## 5) Invariantes de Dominio (Obrigatorios)

- Uma matricula ativa por `studentId` em uma `gym` por vez.
- `GymProfile.activeStudents` deve refletir transicoes reais de status.
- Equipamento deve pertencer a `gymId` do contexto para toda mutacao.
- Atualizacao de pagamento deve respeitar ownership (`payment.gymId === gymId`).
- Rotas de assinatura devem operar somente no escopo da `gym` autenticada.
- Todas as mutacoes devem aceitar `X-Idempotency-Key` para replay seguro.

---

## 6) Criterios de Pronto de Convergencia

- 100% das rotas mutaveis de `gym` com comando + idempotencia.
- 100% das rotas `gym` com contrato Zod e resposta consistente.
- UI `app/gym` sem bootstrap server-heavy para todas as secoes.
- p95 de carga por contexto reduzido e sem explosao de requests duplicadas.
- Logs de sync/queue/comandos habilitados para troubleshooting.

