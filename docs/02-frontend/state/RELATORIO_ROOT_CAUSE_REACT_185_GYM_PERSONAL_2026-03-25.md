# Relatório de Root Cause do React #185 em `gym` e `personal`

Data: 2026-03-25

## Resumo executivo

O erro de produção reportado como `Minified React error #185` corresponde a `Maximum update depth exceeded`. Em termos práticos, isso significa que alguma combinação de `render -> effect -> setState/store update -> render` entrou em ciclo.

A análise do código e do build local mostra que o problema não nasce de um único componente visual, e sim de uma arquitetura com múltiplas fontes de escrita reativa em `gym` e `personal`:

1. Orquestração da rota principal com `initializer` + `prioritized loader` montados no mesmo `page-content`.
2. Fluxos de assinatura/PIX com polling, `focus` refetch, `loadSection(..., true)` e, no caso de `gym`, um segundo store de assinatura separado do store unificado.
3. Duplicação de implementações financeiras e alguns hooks/componentes que amplificam churn de render mesmo quando o leaf atual não contém o loop.

O padrão não se repete com a mesma agressividade em `student`, porque:

1. O readiness do carregamento priorizado é baseado em dados reais do store, não apenas em `metadata.resources`.
2. O fluxo de assinatura de `student` desabilita auto-load do hook compartilhado na tela de pagamentos e só refetch quando a aba de assinatura está ativa.
3. A rota principal de `student` não depende de hidratação SSR -> store para exibir a aba de pagamentos nem combina, no mesmo grau, polling + refetch + store unificado + store secundário.

## Fato confirmado sobre o erro

- `React #185` = `Maximum update depth exceeded`.
- O stack de produção informado para `/gym?tab=financial&subTab=coupons` cai na cadeia minificada que, no build local, corresponde a:
  - `FinancialCouponsTab`
  - container financeiro do `gym`
  - `GymHomeContent`
- Isso confirma que o problema está no fluxo financeiro do `gym`, mas não prova que `FinancialCouponsTab` seja a causa primária. O leaf aparece no topo da stack porque é o ramo montado quando o parent entra em loop.

## Escopo real da rota principal

Há duplicações de implementação financeira no repositório. Para o incidente reportado pelo usuário, a rota principal relevante é:

- `gym?tab=financial`:
  - `apps/web/app/gym/page-content.tsx`
  - `apps/web/components/organisms/gym/gym-financial.tsx`
- `personal?tab=financial`:
  - `apps/web/app/personal/page-content.tsx`
  - `apps/web/app/personal/_financial/page-content.tsx`

Fluxos paralelos que existem no código, mas não são a entrada principal via `?tab=financial`:

- `apps/web/app/gym/_financial/page-content.tsx`
- `apps/web/app/personal/_financial/page.tsx`
- `apps/web/app/personal/_financial/personal-financial-route-wrapper.tsx`
- `apps/web/components/organisms/personal/financial/personal-financial.tsx`

Essas duplicações não explicam sozinhas o incidente em `?tab=financial`, mas aumentam a complexidade de diagnóstico e introduzem mais superfícies com o mesmo tipo de risco.

## Matriz de evidências por rota/componente

| Cenário | Componente topo / componente montado | Wrapper / container acima | Escrita reativa encontrada | Classificação | Evidência principal |
| --- | --- | --- | --- | --- | --- |
| `/gym?tab=financial` | `GymFinancialPage` | `GymHomeContent` | `useGymInitializer()` + `useLoadPrioritizedGym({ onlyPriorities: true })` montados no root da área | Alto risco | `apps/web/app/gym/page-content.tsx:139-165` |
| `/gym?tab=financial&subTab=coupons` | `FinancialCouponsTab` | `GymFinancialPage` -> `GymHomeContent` | O leaf não tem `useEffect`; o loop vem do parent/orquestração | Confirmado no stack, baixo risco local | `apps/web/components/organisms/gym/financial/financial-coupons-tab.tsx:19-143`, `apps/web/components/organisms/gym/gym-financial.tsx:88-157` |
| `/gym?tab=financial&subTab=subscription` | `FinancialSubscriptionTab` | `GymFinancialPage` -> `GymHomeContent` | auto-load da assinatura, refetch por foco, polling do PIX, store secundário de assinatura | Confirmado | `apps/web/components/organisms/gym/financial/financial-subscription-tab.tsx:150-180`, `:241-277`, `:376-380`, `:418-465`, `apps/web/hooks/use-subscription-unified.ts:39-42` |
| `/personal?tab=financial` | `PersonalFinancialPageContent` | `PersonalHomeContent` | `usePersonalInitializer()` + `useLoadPrioritizedPersonal()` no root + `refreshFinancial()` com 7 `loadSection(..., true)` | Alto risco | `apps/web/app/personal/page-content.tsx:167-193`, `:228-229` |
| `/personal?tab=financial&subTab=subscription` | `PersonalFinancialSubscriptionTab` | `PersonalFinancialPageContent` -> `PersonalHomeContent` | `loadSection("subscription", true)` em `onPaymentSuccess`, `onSimulateSuccess`, `pollConfig.refetch` e `onPaymentConfirmed -> onRefresh` | Confirmado | `apps/web/components/organisms/personal/financial/personal-financial-subscription-tab.tsx:75-125`, `apps/web/app/personal/page-content.tsx:183-193` |
| `students` com `studentId` em `gym/personal` | `StudentDetailLoader` | `GymStudentsPage` | `loadStudentDetail(..., true)` + `loadStudentPayments(..., true)` no mount, sem escrita em URL | Baixo risco | `apps/web/components/organisms/gym/gym-students.tsx:25-75`, `:212-219` |
| `settings` em `gym` | `GymSettingsPage` | `GymHomeContent` | sync de props -> estado local com guardas por igualdade | Baixo risco | `apps/web/components/organisms/gym/gym-settings.tsx:97-134` |
| `settings` em `personal` | `PersonalSettingsPage` | `PersonalHomeContent` | sync de props -> estado local com guardas por igualdade | Baixo risco | `apps/web/components/organisms/personal/personal-settings.tsx:67-97` |
| Controle: `/student?tab=payments&subTab=subscription` | `StudentPaymentsPage` / `usePaymentsPage` | `StudentHomeContent` | hook de assinatura com `enabled: false`, refetch só quando a aba de assinatura abre | Baixo risco | `apps/web/app/student/_payments/hooks/use-payments-page.ts:34-64`, `:183-188`, `apps/web/hooks/use-subscription-unified.ts:39-42` |

## Causa raiz provável por prioridade

## P0. Fluxos de assinatura e PIX em `gym` e `personal` acumulam múltiplas escritas sobre o mesmo domínio

Esse é o achado mais forte para os cenários de assinatura e um dos principais amplificadores do incidente geral.

### `personal`: a aba de assinatura faz refetch no mesmo recurso por quatro caminhos diferentes

Na rota principal `?tab=financial`, `PersonalHomeContent` cria `refreshFinancial()` e, quando chamado, força recarga de:

- `subscription`
- `financialSummary`
- `expenses`
- `payments`
- `coupons`
- `campaigns`
- `membershipPlans`

Evidência: `apps/web/app/personal/page-content.tsx:183-193`.

Na aba de assinatura, `PersonalFinancialSubscriptionTab` ainda adiciona:

- `onPaymentSuccess={async () => loadSection("subscription", true)}`
- `onSimulateSuccess={() => loadSection("subscription", true)}`
- `pollConfig.refetch={() => loadSection("subscription", true)}`
- `onPaymentConfirmed={async () => { handlePixConfirmed(); await onRefresh?.(); }}`

Evidência: `apps/web/components/organisms/personal/financial/personal-financial-subscription-tab.tsx:75-125`.

Ou seja: o mesmo subdomínio `subscription` é reescrito por polling, simulação, confirmação e refresh completo da área financeira. Isso não é uma simples atualização pontual; é um fluxo onde o componente montado provoca recarga do próprio store do qual depende.

### `gym`: a aba de assinatura mistura store unificado com store de assinatura dedicado

`GymFinancialPage` recebe `subscription` do store unificado via `useGym(...)`:

- `apps/web/app/gym/page-content.tsx:64-98`

Mas `FinancialSubscriptionTab` também usa `useGymSubscription()`, que por sua vez chama `useSubscriptionUnified()` e dispara `loadSubscription(userType)` automaticamente no mount:

- `apps/web/hooks/use-subscription-unified.ts:39-42`
- `apps/web/components/organisms/gym/financial/financial-subscription-tab.tsx:124-157`

O componente escolhe a assinatura final mesclando:

- `initialSubscription` vindo do store unificado
- `storeSubscription` do `subscription-store`
- `subscriptionData` do hook

Evidência: `apps/web/components/organisms/gym/financial/financial-subscription-tab.tsx:143-157`.

Depois disso, a mesma aba ainda adiciona:

- restauração de PIX pendente baseada em status da assinatura
- refetch no `focus`
- refetch logo após criação da assinatura
- `SubscriptionSection.Simple` com `onPaymentSuccess`
- `PixQrModal` com polling a cada 3s que faz `await refetchSubscription(); return gymActions.checkCurrentSubscriptionActive();`

Evidência:

- `apps/web/components/organisms/gym/financial/financial-subscription-tab.tsx:159-180`
- `apps/web/components/organisms/gym/financial/financial-subscription-tab.tsx:241-277`
- `apps/web/components/organisms/gym/financial/financial-subscription-tab.tsx:376-380`
- `apps/web/components/organisms/gym/financial/financial-subscription-tab.tsx:418-465`

Conclusão: em `gym`, a assinatura não tem apenas polling; ela tem polling sobre um valor derivado de duas camadas de store. Isso aumenta muito a chance de cascata de render/reconciliação quando a aba de assinatura está ativa.

## P0.1. `SubscriptionSection.Simple` reinicializa e pode reexecutar fluxos de confirmação quando as props mudam

O componente compartilhado `SubscriptionSection.Simple` contém:

- um `useEffect` que, quando `success=true`, faz até 10 iterações de `onPaymentSuccess()` para `gym`
- outro `useEffect` que reinicializa `useSubscriptionUIStore` quando muda o triplo `subscription.id/plan/billingPeriod`

Evidência: `apps/web/components/organisms/sections/subscription-section.tsx:127-190` e `:195-221`.

Isso sozinho não explica o incidente de `coupons`, mas explica por que os fluxos de retorno de pagamento são especialmente sensíveis em `gym/personal`.

## P1. O loader priorizado de `gym/personal` usa `metadata.resources` como critério de pronto, mas esse mesmo loader reescreve `metadata.resources`

### Estrutura observada

`useLoadPrioritizedGym()` e `useLoadPrioritizedPersonal()`:

- leem `state.data.metadata.resources`
- transformam isso em `getStoreSnapshot`
- passam `hasSectionData(section, resources) => resources[section]?.status === "ready"`

Evidência:

- `apps/web/hooks/use-load-prioritized-gym.ts:71-95`
- `apps/web/hooks/use-load-prioritized-personal.ts:70-94`

O `usePrioritizedResourceLoader()` depende de `getStoreSnapshot` no array de dependências do `useEffect`:

- `apps/web/hooks/shared/use-prioritized-resource-loader.ts:53-118`
- `apps/web/hooks/shared/use-prioritized-resource-loader.ts:118-132`

As stores de `gym` e `personal` reescrevem `metadata.resources` em todos os caminhos de carga:

- `setSectionLoading()`
- `setSectionsReady()`
- `hydrateInitial()`

Evidência:

- `apps/web/stores/gym-unified-store.ts:221-299`
- `apps/web/stores/personal-unified-store.ts:166-244`

### Leitura correta desse achado

Esse bloco, sozinho, não é o smoking gun mais forte para um loop infinito imediato, porque o loader usa guardas como:

- `hasCalledRef`
- `isLoadingRef`
- `minTimeBetweenLoadsMs`

Evidência: `apps/web/hooks/shared/use-prioritized-resource-loader.ts:47-117`.

Mas ele continua sendo um problema estrutural importante por dois motivos:

1. O loader decide se precisa carregar olhando para um objeto que ele próprio altera.
2. Em `gym/personal`, esse loader é montado no mesmo root que troca tabs e monta subárvores financeiras.

Resultado: ele amplia tráfego de render, aumenta a sensibilidade a qualquer outro efeito que também escreva em store e faz com que o leaf atual da rota apareça no topo da stack mesmo quando a origem do ciclo é a orquestração.

## P1.1. A rota principal de `gym/personal` monta orquestração e conteúdo no mesmo componente

`GymHomeContent`:

- `useGymInitializer()`
- `useLoadPrioritizedGym({ onlyPriorities: true })`
- switch de tabs no mesmo componente

Evidência: `apps/web/app/gym/page-content.tsx:139-165`.

`PersonalHomeContent`:

- `usePersonalInitializer()`
- `useLoadPrioritizedPersonal({ onlyPriorities: true })`
- `refreshFinancial()` e `refreshSettings()` no mesmo root
- switch de tabs no mesmo componente

Evidência: `apps/web/app/personal/page-content.tsx:167-233`.

Quando uma área financeira monta um subtree que também faz polling/refetch, o root da rota e o subtree passam a escrever sobre o mesmo store no mesmo frame de navegação.

## P1.2. O incident path de `coupons` aponta para o parent, não para o leaf

`FinancialCouponsTab` não tem `useEffect`, nem sincronização com URL, nem polling. Ele usa:

- estado local de modal/formulário
- create/delete de cupom por evento do usuário

Evidência: `apps/web/components/organisms/gym/financial/financial-coupons-tab.tsx:19-143`.

Portanto:

- `FinancialCouponsTab` explica por que o stack mostra `I` no topo
- não explica sozinho um `Maximum update depth exceeded`

O componente é superfície do incidente, não a origem primária.

## P2. Alguns componentes suspeitos têm guardas adequadas e não aparecem como causa principal

### `DuoSelect.Simple`

O select compartilhado usa `useLayoutEffect` e `useEffect`, mas só para:

- posicionar dropdown
- ouvir `scroll/resize`
- fechar ao clicar fora

Ele não escreve em URL nem em store global por conta própria.

Evidência: `apps/web/components/duo/molecules/duo-select.tsx:71-126`.

### `GymSettingsPage` e `PersonalSettingsPage`

Ambos sincronizam props para estado local com comparação antes de chamar `setState`.

Evidência:

- `apps/web/components/organisms/gym/gym-settings.tsx:97-134`
- `apps/web/components/organisms/personal/personal-settings.tsx:67-97`

### `StudentDetailLoader` e hooks de student detail

`StudentDetailLoader` dispara carga forçada no mount, mas:

- não toca URL
- não reexecuta por dependência autoalimentada
- só aciona detail/payments uma vez por `studentId`

Evidência: `apps/web/components/organisms/gym/gym-students.tsx:25-75`.

Os hooks de detail em `gym` e `personal` só recarregam treino/dieta quando a aba muda.

Evidência:

- `apps/web/components/organisms/gym/gym-student-detail/hooks/use-gym-student-detail.ts:357-367`
- `apps/web/components/organisms/personal/personal-student-detail/hooks/use-personal-student-detail.ts:336-344`

Conclusão: esses blocos merecem monitoramento, mas não são a causa principal do erro #185 reportado.

## Achado adicional: existem seletores multi-store que amplificam rerender

`useGym()` e `usePersonal()` constroem `actions` e `loaders` dentro do selector.

Evidência:

- `apps/web/hooks/use-gym.ts:36-109`
- `apps/web/hooks/use-personal.ts:38-103`

Quando o hook é chamado em modo multi-selector com algo como:

- `usePersonal("subscription", "students", "affiliations", "actions", "loaders")`
- `useGym("coupons", "actions")`

o objeto retornado contém `actions` ou `loaders` como props aninhadas recriadas a cada avaliação do selector. Isso não prova o loop por si só, mas aumenta churn de render e torna callbacks derivados menos estáveis do que parecem.

Exemplos:

- `apps/web/hooks/use-personal-financial.ts:8-15`
- `apps/web/components/organisms/gym/financial/financial-coupons-tab.tsx:24-28`

Classificação: amplificador, não causa raiz isolada.

## Fluxo duplicado adicional de alto risco: `personal/_financial` com hidratação por efeito

Esse fluxo não é a rota principal do incidente por query param, mas continua sendo um ponto de atenção sério.

`PersonalFinancialRouteWrapper`:

- recebe `subscription`, `students` e `affiliations` do server
- calcula `hydrationKey`
- mas o `useEffect` depende de `subscription`, `students` e `affiliations` por identidade, não só do `hydrationKey`
- dentro do efeito faz `hydrateInitial(...)`

Evidência: `apps/web/app/personal/_financial/personal-financial-route-wrapper.tsx:35-48`.

Se essa rota dedicada for usada junto com `router.refresh()` ou nova resposta SSR com arrays/objetos recriados, o store é reidratado de novo mesmo quando o conteúdo lógico não mudou. Isso reproduz a mesma classe de risco observada no incidente principal, só que por outro caminho.

## Por que `student` não sofre o mesmo padrão

## 1. O readiness do loader priorizado usa dados reais, não `metadata.resources`

`useLoadPrioritized()` em `student` monta um snapshot de dados concretos:

- `user`
- `student`
- `progress`
- `profile`
- `weeklyPlan`
- `subscription`
- `payments`
- etc.

Evidência:

- `apps/web/hooks/use-load-prioritized.ts:244-333`
- `apps/web/hooks/use-load-prioritized.ts:335-347`

O `hasSectionData()` de `student` pergunta se a seção tem dado real disponível, não só se alguma flag de resource foi marcada como `ready`.

Evidência: `apps/web/hooks/use-load-prioritized.ts:138-197`.

Isso reduz bastante a chance de autoalimentação entre loader e metadado.

## 2. A tela de pagamentos do `student` desabilita auto-load do hook de assinatura

Em `usePaymentsPage()`:

- `useSubscription({ ..., enabled: false })`
- refetch explícito só quando `activeTab === "subscription"`

Evidência:

- `apps/web/app/student/_payments/hooks/use-payments-page.ts:50-64`
- `apps/web/app/student/_payments/hooks/use-payments-page.ts:183-188`

Já `useSubscriptionUnified()` faz auto-load no mount quando `enabled !== false`:

- `apps/web/hooks/use-subscription-unified.ts:39-42`

Ou seja: `student` usa o mesmo hook base, mas de forma muito mais conservadora.

## 3. A rota principal do `student` não depende do mesmo acoplamento entre rota, polling e stores duplicados

O comentário do próprio arquivo já descreve a intenção do `student`:

- usa dados do store unificado
- não depende de props SSR para a tela principal

Evidência: `apps/web/app/student/page-content.tsx:70-79`.

Isso não torna `student` imune a bugs, mas explica por que ele não apresenta o mesmo padrão de erro sistêmico.

## Cadeias causais mais prováveis

## Cadeia A. `/gym?tab=financial&subTab=coupons`

1. `GymHomeContent` monta `useGymInitializer()` e `useLoadPrioritizedGym()` no root da área.
2. `tab=financial` monta `GymFinancialTab`, que lê vários slices do store unificado.
3. `subTab=coupons` faz o ramo montado ser `FinancialCouponsTab`.
4. O leaf atual aparece no topo da stack quando algum parent do mesmo subtree entra em churn de atualização.
5. Como `FinancialCouponsTab` não contém efeito autoalimentado, o mais provável é que a origem esteja na combinação:
   - root loader/initializer da rota,
   - stores financeiros sendo atualizados,
   - subtree financeiro montado naquele momento.

Conclusão: incidente confirmado no cenário, mas a causa primária não está no código local do componente de cupons.

## Cadeia B. `/gym?tab=financial&subTab=subscription`

1. `GymFinancialPage` entrega `subscription` do store unificado.
2. `FinancialSubscriptionTab` monta `useGymSubscription()`, que auto-carrega assinatura no store secundário.
3. O componente mescla `initialSubscription`, `storeSubscription` e `subscriptionData`.
4. Em paralelo:
   - refetch no `focus`
   - refetch após criar assinatura
   - `onPaymentSuccess`
   - `PixQrModal` com polling de 3s
5. Cada atualização pode trocar status e origem da assinatura derivada e retriggerar render do subtree.

Conclusão: cadeia confirmada e de maior risco na aba de assinatura do `gym`.

## Cadeia C. `/personal?tab=financial&subTab=subscription`

1. `PersonalHomeContent` monta loader/initializer no root e expõe `refreshFinancial()` com 7 cargas forçadas.
2. `PersonalFinancialSubscriptionTab` usa o mesmo store unificado que alimenta a própria tela.
3. O componente dispara:
   - `loadSection("subscription", true)` via `onPaymentSuccess`
   - `loadSection("subscription", true)` via `onSimulateSuccess`
   - `loadSection("subscription", true)` via `pollConfig.refetch`
   - `refreshFinancial()` via `onPaymentConfirmed`
4. Isso produz recargas do mesmo domínio durante o tempo em que o subtree de assinatura está montado.

Conclusão: cadeia confirmada e a explicação mais forte para o `personal` na rota principal.

## Direção de correção recomendada

Este documento não faz alteração de código, mas a direção técnica correta é:

1. Reduzir para uma única fonte de verdade de assinatura por domínio.
   - Em `gym`, evitar coexistência ativa entre store unificado e `subscription-store` no mesmo subtree.
2. Remover polling/refetch redundante.
   - Escolher um único mecanismo entre `focus`, `pollConfig`, `onPaymentSuccess` e refresh completo da aba.
3. Parar de usar `metadata.resources` como única prova de prontidão funcional.
   - O loader priorizado deve decidir por dados reais, como já acontece em `student`.
4. Evitar que o root da rota monte carregadores e subtree altamente reativos no mesmo componente sem isolamento.
   - Idealmente separar bootstrap/root loader de tabs de alta mutação.
5. Eliminar implementações financeiras duplicadas ou deixá-las explicitamente fora do runtime principal.
   - Hoje há mais de uma entrada para o mesmo domínio, o que dificulta garantir consistência.
6. Revisar hooks multi-selector que retornam `actions/loaders` aninhados.
   - Isso não é a causa principal, mas aumenta ruído de render.

## Conclusão final

O erro `React #185` em `gym` e `personal` não aponta para um único “componente quebrado”. O que existe é uma combinação de:

- montagem da rota principal com bootstrap e loader priorizado,
- múltiplas escritas concorrentes no domínio financeiro,
- polling/refetch agressivo na assinatura,
- e, no caso de `gym`, duas fontes de verdade para subscription.

`FinancialCouponsTab`, `DuoSelect`, `settings` e `student detail` aparecem ou como superfície do incidente, ou como áreas de baixo risco. O núcleo do problema está na orquestração reativa de `gym/personal`, especialmente no financeiro, enquanto `student` segue um desenho mais contido e menos autoalimentado.
