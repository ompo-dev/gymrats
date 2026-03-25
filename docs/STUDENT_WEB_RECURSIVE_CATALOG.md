# Student Web Recursive Catalog

## 0. Objetivo

Este documento cataloga a experiencia `student` do produto web GymRats de forma recursiva:

- layout e shell;
- navegacao;
- paginas;
- componentes dentro das paginas;
- componentes dentro desses componentes;
- estados vazios, loading, erro e sucesso;
- animacoes e comportamentos;
- contratos de dados;
- regras de negocio;
- detalhes de UX, UI, CX e DX.

O objetivo aqui nao e apenas "resumir a tela". A meta e registrar a superficie real do modulo `student` com granularidade suficiente para:

1. reconstruir o shell e as telas com alta fidelidade;
2. entender como os estados e fluxos se conectam;
3. servir como base para portar a experiencia web para mobile 1:1;
4. evitar interpretacoes livres do produto.

## 1. Fontes de verdade usadas

Hierarquia de confianca usada neste documento:

1. codigo executavel do `apps/web/app/student` e `apps/web/components`;
2. hooks, stores e actions usados pelas telas;
3. schemas e actions do onboarding;
4. blueprint mestre em `docs/GYMRATS_MASTER_BLUEPRINT_END_TO_END.md`;
5. README tecnicos locais.

Arquivos mais importantes lidos:

- `apps/web/app/student/layout.tsx`
- `apps/web/app/student/layout-content.tsx`
- `apps/web/app/student/page-content.tsx`
- `apps/web/components/templates/layouts/app-layout.tsx`
- `apps/web/components/organisms/navigation/app-header.tsx`
- `apps/web/components/organisms/navigation/app-bottom-nav.tsx`
- `apps/web/app/globals.css`
- `apps/web/app/student/_learn/learning-path.tsx`
- `apps/web/app/student/_diet/diet-page.tsx`
- `apps/web/app/student/_payments/student-payments-page.tsx`
- `apps/web/app/student/_profile/profile-content.tsx`
- `apps/web/app/student/_more/student-more-menu.tsx`
- `apps/web/app/student/_cardio/cardio-functional-page.tsx`
- `apps/web/app/student/_education/education-page.tsx`
- `apps/web/app/student/_education/educational-lessons.tsx`
- `apps/web/app/student/_education/muscle-explorer.tsx`
- `apps/web/app/student/_gyms/gym-profile-view.tsx`
- `apps/web/app/student/_personals/personal-profile-view.tsx`
- `apps/web/app/student/onboarding/page.tsx`

## 2. Visao geral do modulo `student`

### 2.1 Papel do modulo

O modulo `student` e a area autenticada do aluno e tambem serve como ponto de entrada secundario para `ADMIN` quando esse admin quer navegar a experiencia do aluno.

Ele mistura cinco naturezas de produto em um unico shell:

- app de progresso fitness;
- app de execucao de treino;
- app de nutricao;
- marketplace de academias e personais;
- centro de pagamento e assinatura.

### 2.2 Estrategia de arquitetura

O `student` atual segue uma arquitetura de shell persistente com:

- header fixo;
- conteudo central scrollavel;
- bottom nav fixa;
- estado de aba em query string;
- modais globais montados no layout;
- dados vindos de store unificado com bootstrap e carregamento priorizado;
- forte orientacao offline-first e reidratacao otimista.

### 2.3 Query params importantes do modulo

O shell do aluno usa os seguintes query params como parte estrutural da UX:

- `tab`: aba principal ativa.
- `subTab`: subtela interna, principalmente em pagamentos.
- `gymId`: detalhe da academia selecionada.
- `personalId`: detalhe do personal selecionado.
- `planId`: pre-selecao de plano.
- `couponId`: pre-selecao de cupom.
- `view`: subview em educacao.
- `muscle`: musculo selecionado.
- `exercise`: exercicio selecionado.
- `lesson`: licao selecionada.
- `modal`: modal global aberto.
- `workoutId`: treino em execucao.
- `exerciseIndex`: exercicio atual dentro do treino.
- `mealId`: refeicao selecionada no food search.

Esses params nao sao detalhe tecnico secundario: eles fazem parte do contrato de navegacao da aplicacao.

## 3. Shell, layout e navegacao

### 3.1 Arquitetura do shell

Arquivos centrais:

- `app/student/layout.tsx`
- `app/student/layout-content.tsx`
- `components/templates/layouts/app-layout.tsx`

Estrutura macro:

1. `layout.tsx` cria um `HydrationBoundary` e injeta dados iniciais de progresso/perfil.
2. `StudentLayoutContent` monta comportamento cliente, protege onboarding e registra tabs.
3. `AppLayout.Simple` aplica header, area de scroll, bottom nav e conteudo adicional.

### 3.2 Bootstrap inicial

O layout faz duas estrategias de bootstrap:

- preferencialmente `studentBootstrap` por secoes quando a feature flag `perfStudentBootstrapV2` esta ativa;
- fallback para `getStudentProfile()` e `getStudentProgress()`.

Os dados minimos usados para ligar o shell sao:

- `hasProfile`
- `currentStreak`
- `totalXP`

### 3.3 Regra de onboarding

Se `hasProfile` for falso:

- o shell espera o mount do cliente;
- se a rota nao for `/student/onboarding`;
- redireciona com `router.replace("/student/onboarding")`.

Enquanto redireciona, a tela mostra `LoadingScreen.Simple` com mensagem de redirecionamento.

### 3.4 Tabs principais

Tabs oficiais registradas em `StudentLayoutContent`:

- `home`
- `learn`
- `diet`
- `profile`
- `more`

Tabs auxiliares ativadas por query param na `page-content.tsx`:

- `cardio`
- `payments`
- `gyms`
- `personals`
- `education`

### 3.5 Component tree do shell

Arvore estrutural:

- `StudentLayout`
  - `Suspense`
    - `StudentLayoutWrapper`
      - `HydrationBoundary`
        - `StudentLayoutContent`
          - `AppLayout.Simple`
            - `AppHeader.Simple`
            - `main` scrollavel
              - pagina ativa (`StudentHomeContent`)
            - `AppBottomNav.Simple`
            - modais globais
              - `WorkoutModal.Simple`
              - `EditUnitModal`
              - `TrainingLibraryModal`
              - `NutritionLibraryModal`
              - `EditUnitModal` em modo semanal quando `edit-plan`

### 3.6 Header

Arquivo:

- `components/organisms/navigation/app-header.tsx`

Composicao:

- container sticky `top-0`
- logo textual `GymRats` para `student`
- botao de paleta para abrir `DuoColorPicker`
- pill de streak com icone `Flame`
- `StreakModal.Simple` para explicar streak

Detalhes visuais:

- fundo `bg-duo-bg-card`
- borda inferior `border-duo-border`
- altura total de header `70px`
- logo em texto bold, sem marca grafica separada
- pill de streak com borda laranja, fundo claro e hover suave

### 3.7 Bottom nav

Arquivo:

- `components/organisms/navigation/app-bottom-nav.tsx`

Composicao:

- nav fixa no rodape
- botoes `DuoButton` em variante `ghost`
- cada item mostra:
  - icone sempre
  - label apenas quando ativo

Tratamento visual:

- borda superior forte
- sombra superior
- fundo `bg-duo-bg-card`
- item ativo no student usa:
  - background azul suave
  - texto/icone azul

### 3.8 Area central scrollavel

O `main` do shell:

- ocupa `flex-1`
- esconde scrollbar
- adiciona `pb-20` para nao ser encoberto pela bottom nav
- reseta scroll ao trocar de tab com `useScrollReset`

### 3.9 Modais globais e profundidade de interacao

O shell do aluno nao e um conjunto simples de paginas isoladas. Ele e um container com modais persistentes, o que significa:

- executar treino nao exige sair da pagina;
- editar plano e biblioteca nao exige sair da tab;
- nutricao tambem usa modais controlados por query param;
- PIX e fluxo financeiro podem abrir por cima do shell.

## 4. UI system e linguagem visual do `student`

### 4.1 Tokens centrais

Tokens observados em `app/globals.css`:

- primario: `#58CC02`
- primario dark: `#46A302`
- secundario/azul: `#1CB0F6`
- accent/laranja: `#FF9600`
- warning/amarelo: `#FFC800`
- danger/vermelho: `#FF4B4B`
- background app: `#F5F7F6`
- card: `#FFFFFF`
- elevated: `#E8ECEA`
- foreground: `#131F24`
- foreground muted: `#5A6B63`
- border: `#D1D9D6`

### 4.2 Tipografia

Fonte base:

- `Nunito`

Caracteristicas recorrentes:

- titulos com `font-bold` ou `font-extrabold`
- forte uso de caixa alta em labels pequenas
- numeros grandes para streak, XP, peso e dinheiro
- copy curta e direta

### 4.3 Formas e raio

Padroes dominantes:

- `rounded-xl`
- `rounded-2xl`
- pills `rounded-full`
- cards com borda marcada e profundidade curta

### 4.4 Componentes base recorrentes

Componentes mais estruturantes do visual:

- `DuoCard`
- `DuoButton`
- `DuoStatCard`
- `DuoStatsGrid`
- `NavigationButtonCard`
- `UnitSectionCard`
- `WorkoutNode`
- `PixQrModal`

### 4.5 Motion language

O `student` nao e estatico. O modulo usa:

- `FadeIn`
- `SlideIn`
- `WhileInView`
- `StaggerContainer`
- `StaggerItem`
- `AnimatePresence`
- `motion.div` com entradas por `opacity`, `y`, `scale`

Animacoes observadas:

- cards entrando com atraso escalonado;
- workout nodes com progresso e anel visual;
- onboarding com transicao lateral e confete;
- empty states com subida leve;
- hover com `y: -4`, `scale`, `ring` e borda destacada.

### 4.6 Regras de UX visuais

O modulo `student` privilegia:

- uma unica CTA principal por bloco;
- indicadores curtos e numericos;
- clareza de proxima acao;
- estados vazios que ensinam o que fazer;
- badges pequenas para status;
- cores sem ambiguidade:
  - verde para progresso/acao principal;
  - azul para navegacao, info e aprendizado;
  - laranja para streak, urgencia leve e promocao;
  - vermelho para risco, cancelamento e erro.

## 5. Arvore de paginas do `student`

Superficie de pagina real montada pela `page-content.tsx`:

- `home`
- `learn`
- `diet`
- `cardio`
- `payments`
- `gyms`
  - mapa/lista
  - detalhe de academia
- `personals`
  - mapa/lista
  - detalhe de personal
- `education`
  - menu
  - musculos
  - exercicios
  - licoes
  - quiz
- `profile`
- `more`
- `onboarding`

## 6. Home

### 6.1 Papel da tela

A `home` e o painel de orientacao do aluno. Ela responde:

- como estou hoje;
- o que fazer agora;
- onde ha oportunidade comercial;
- como esta meu progresso.

### 6.2 Component tree da home

- titulo de saudacao
- `BoostCampaignCarousel`
- `LevelProgressCard.Simple`
- `DuoStatsGrid.Root`
  - `DuoStatCard.Simple` streak
  - `DuoStatCard.Simple` XP
  - `DuoStatCard.Simple` nivel
  - `DuoStatCard.Simple` treinos
- `WeightProgressCard.Simple`
- `ContinueWorkoutCard.Simple`
- `NutritionStatusCard.Simple`
- `RecentWorkoutsCard.Simple`

### 6.3 Header textual da home

Bloco:

- `h1` com nome do usuario ou fallback `Ola, Atleta!`
- subtitulo `Continue sua jornada fitness de hoje`

### 6.4 BoostCampaignCarousel

Arquivo:

- `components/organisms/home/home/boost-campaign-carousel.tsx`

Funcao:

- exibir campanhas patrocinadas de academias ou personais;
- trackear impressao;
- trackear clique;
- carregar campanhas por geolocalizacao.

Estrutura interna do card:

- avatar/logo redondo
- nome da marca
- selo pequeno `Patrocinado`
- titulo grande da campanha na cor primaria da campanha
- descricao curta
- rodape com CTA `Aproveitar Oferta`

Comportamentos:

- `IntersectionObserver` para impressao quando o card cruza 50%;
- hover sobe `y: -4`;
- clique pode abrir:
  - perfil de academia;
  - perfil de personal;
  - fluxo de plano/cupom pre-selecionado.

### 6.5 LevelProgressCard

Arquivo:

- `components/organisms/home/home/level-progress-card.tsx`

Conteudo:

- titulo `Seu Nivel`
- `Nivel X`
- XP total acumulado
- opcionalmente ranking global
- barra de progresso para o proximo nivel
- label de XP restantes

Regra de calculo:

- cada nivel consome 100 XP;
- progresso do nivel atual = `totalXP - ((currentLevel - 1) * 100)`.

### 6.6 DuoStatsGrid da home

Itens:

- streak atual com badge de recorde;
- XP ganho hoje com badge de total;
- nivel atual com badge de incentivo;
- treinos completos com badge de historico.

Visual:

- cards horizontais compactos;
- icone a esquerda;
- badge absoluta no canto;
- hover com borda verde e sombra leve.

### 6.7 WeightProgressCard

Arquivo:

- `components/organisms/home/home/weight-progress-card.tsx`

Conteudo:

- peso atual
- delta em kg
- icone de tendencia
- mini grafico de barras dos ultimos 7 registros

Regras:

- se o aluno tem meta de emagrecimento, perda e positiva;
- sem peso atual a card nao aparece;
- se `weightGain` for `null` ou `0`, usa estado neutro.

### 6.8 ContinueWorkoutCard

Arquivo:

- `components/organisms/home/home/continue-workout-card.tsx`

Logica:

1. tenta achar o proximo treino desbloqueado nas `units`;
2. se nao houver proximo treino, tenta achar ultimo treino concluido;
3. se nao houver nenhum, mostra empty state.

Estados:

- vazio:
  - icone halter;
  - copy de primeiro treino;
  - CTA `Ver Treinos`
- proximo treino:
  - mostra nome do treino;
  - mostra unidade/plano;
  - CTA `Continuar Treino`
- ultimo treino:
  - mostra ultimo treino concluido;
  - data amigavel;
  - CTA `Ver Proximo Treino`

### 6.9 NutritionStatusCard

Arquivo:

- `components/organisms/home/home/nutrition-status-card.tsx`

Funcao:

- resumir o dia de nutricao sem precisar abrir a tela de dieta.

Estados:

- sem `dailyNutrition`: empty state
- com `dailyNutrition`, mas sem refeicoes e sem agua: empty state
- com dados: resumo de refeicoes e hidratacao

Blocos quando preenchido:

- mini card de refeicoes:
  - refeicoes concluidas / total
  - percentual da meta calorica
- mini card de hidratacao:
  - ml atual
  - percentual da meta diaria
- CTA final:
  - premium: `IA de Nutricao`
  - nao premium: `Adicionar Refeicao ou Agua`

Regra de acesso:

- premium com `USE_AI_NUTRITION` abre `?tab=diet&modal=food-search`
- nao premium abre a tela de dieta normal

### 6.10 RecentWorkoutsCard

Arquivo:

- `components/organisms/home/home/recent-workouts-card.tsx`

Conteudo:

- lista os 3 treinos mais recentes;
- mostra nome, data amigavel, duracao, volume e feedback.

Feedback colorido:

- excelente -> verde
- bom -> azul
- regular -> amarelo
- ruim -> vermelho

Estado vazio:

- texto simples `Nenhum treino registrado ainda`

## 7. Learn

### 7.1 Papel da tela

A aba `learn` e a experiencia de treino principal. Ela representa o plano semanal do aluno como uma trilha gamificada.

### 7.2 Component tree da tela

- titulo vazio na pagina raiz; a tela usa o `UnitSectionCard` como hero principal
- `UnitSectionCard`
- `StaggerContainer`
  - 7x `WorkoutNode.Simple` ou descanso

### 7.3 UnitSectionCard

Arquivo:

- `components/ui/unit-section-card.tsx`

Composicao:

- bloco verde grande com sombra inferior
- `sectionLabel` pequeno em verde claro
- `title` grande em branco
- bloco lateral direito com botao branco circular

Uso no learn:

- `sectionLabel`: descricao do plano semanal
- `title`: nome do plano semanal
- botao lateral com icone de biblioteca
- abre `training-library`

### 7.4 LearningPath

Arquivo:

- `app/student/_learn/learning-path.tsx`

Regras:

- usa `useLoadPrioritized({ context: "learn" })`
- carrega `weeklyPlan` do store
- escuta evento global `workoutCompleted`
- recarrega plano semanal apos conclusao

Estado sem plano:

- titulo `Treinos`
- subtitulo `Crie seu plano semanal (7 dias)`
- card de empty state `Meu Plano Semanal`
- CTA `Criar Plano Semanal`

Quando o usuario clica nessa CTA:

1. executa `createWeeklyPlan()`;
2. abre modal `edit-plan`.

### 7.5 WorkoutNode

Arquivo:

- `components/organisms/workout/workout-node.tsx`

Variantes:

- `workout`
- `rest`

Posicionamento:

- `left`
- `center`
- `right`

Comportamentos relevantes:

- dias de descanso usam icone de lua;
- treinos podem ficar:
  - locked;
  - current;
  - in progress;
  - completed;
  - missed;
  - disabled;
- usa `ProgressRing` para progresso parcial;
- usa `WorkoutNodeButton` como botao visual central.

Detalhes importantes:

- o primeiro treino atual mostra baloon `START`;
- dias futuros podem ser bloqueados por `lockOverride`;
- o node sabe destravar otimistamente quando eventos globais de treino sao disparados;
- mostra titulo do treino e metadados de exercicios/minutos abaixo.

### 7.6 Regras de agenda semanal

Regras inferidas da implementacao:

- a semana e segunda a domingo;
- `todayIndex = (new Date().getDay() + 6) % 7`;
- dias passados nao concluidos podem virar `missed`;
- dias futuros sao bloqueados visualmente;
- slots podem ser:
  - `rest`
  - `workout`

## 8. Workout modal

### 8.1 Papel

O treino em execucao e um mini app dentro do app.

Arquivo:

- `components/organisms/workout/workout-modal.tsx`

### 8.2 Component tree do modal

- `WorkoutModal.Simple`
  - `WeightTrackerOverlay.Simple`
  - `CardioConfigModal.Simple`
  - `WorkoutHeader.Simple`
  - `ExerciseCardView.Simple`
  - `WorkoutFooter.Simple`
  - `ExerciseAlternativeSelector`
  - `WorkoutCompletionView.Simple`

### 8.3 Estados principais

- loading do treino
- treino sem exercicios
- treino em execucao
- tela final de conclusao

### 8.4 Empty state de treino vazio

Quando o workout existe, mas nao tem exercicios:

- card central modalizado;
- icone grande de halter;
- copy explicando que o dia ainda nao tem exercicios;
- CTA `Adicionar exercicios` que fecha o modal e abre `edit-plan`.

### 8.5 Responsabilidades do modal

- orquestrar exercicio atual;
- lidar com progresso do treino;
- registrar execucao por set;
- abrir seletor de alternativas;
- abrir configuracao cardio;
- navegar entre exercicios;
- finalizar treino;
- repetir treino ao final.

### 8.6 UX

Caracteristicas:

- fullscreen;
- forte foco no exercicio atual;
- overlays para tracking, nao inline na lista;
- fim de treino com resumo e celebracao.

## 9. Diet

### 9.1 Papel da tela

A tela de dieta e o cockpit diario de nutricao.

### 9.2 Component tree da tela

- titulo `Nutricao`
- subtitulo com refeicoes concluidas
- `DuoStatsGrid.Root`
  - refeicoes hoje
  - meta calorica
- `NutritionTracker.Simple`
- `AddMealModal.Simple`
- `FoodSearch.Simple`

### 9.3 Carregamento

Hooks e stores:

- `useLoadPrioritized({ context: "diet" })`
- `useNutritionHandlers()`
- `useStudent("foodDatabase")`
- `useStudentUnifiedStore.loadFoodDatabase()`

Regra:

- `foodDatabase` e carregado sob demanda, nao como parte obrigatoria do bootstrap.

### 9.4 NutritionTracker

Arquivo:

- `components/organisms/trackers/nutrition-tracker.tsx`

Composicao:

- grid de achievements/macros
  - calorias
  - proteinas
  - carboidratos
  - gorduras
- bloco de hidratacao
- bloco de refeicoes do dia

### 9.5 Hidratacao

Estados:

- `waterIntake === 0`
  - empty state com icone de gota
  - CTA `Registrar Copo`
- `waterIntake > 0`
  - `WaterIntakeCard.Simple`

### 9.6 Refeicoes do dia

Estados:

- zero refeicoes
  - empty state
  - CTA de biblioteca
  - CTA `Adicionar Refeicao`
- com refeicoes
  - lista de `MealCard.Simple`

Interacoes por refeicao:

- completar refeicao;
- expandir/colapsar;
- adicionar alimento;
- deletar refeicao;
- deletar alimento;
- expandir alimento.

### 9.7 Modais

- `AddMealModal.Simple`
- `FoodSearch.Simple`

O `FoodSearch` trabalha com `selectedMealId` e query param `mealId`.

## 10. Payments

### 10.1 Papel da tela

E o hub financeiro do aluno. Ele concentra:

- memberships com academias;
- historico de pagamentos;
- assinatura do app;
- referrals, saldo e saque.

### 10.2 Component tree da tela

- titulo e subtitulo
- `DuoStatsGrid.Root`
  - total mensal
  - pendentes
- `PaymentsTabSelector`
- aba ativa:
  - memberships
  - payments
  - subscription
  - referrals
- `SubscriptionCancelDialog.Simple`
- `PixQrModal` de membership/payment
- `PixQrModal` de subscription

### 10.3 Hook orquestrador

Arquivo:

- `app/student/_payments/hooks/use-payments-page.ts`

Responsabilidades:

- sincronizar `subTab` com estado local;
- carregar subscription, memberships, payments, paymentMethods;
- calcular pendencias e total mensal;
- controlar troca de plano;
- abrir PIX;
- aplicar referral;
- iniciar trial;
- cancelar assinatura.

### 10.4 PaymentsTabSelector

Arquivo:

- `app/student/_payments/components/payments-tab-selector.tsx`

Usa `DuoSelect` com 4 opcoes:

- academias
- historico
- assinatura
- indicacoes

### 10.5 Memberships

Agrupamento:

- memberships sao agrupados por academia.

Arvore visual:

- card da academia colapsavel
  - botao header com nome + contador de planos
  - ao expandir:
    - lista de `MembershipCard`

#### MembershipCard

Arquivo:

- `app/student/_payments/components/membership-card.tsx`

Conteudo:

- endereco da academia
- badge de status:
  - ativo
  - suspenso
  - cancelado
  - pendente
- badge de renovacao automatica
- bloco de plano e preco
- proxima cobranca
- opcionalmente payment method

Expansao do card ativo:

- `Trocar plano`
- `Cancelar plano`

Troca de plano:

- carrega outros planos da academia;
- mostra cards menores com nome e preco;
- ao selecionar, gera PIX.

### 10.6 Payments history

Agrupamento:

- por academia.

Dentro do grupo:

- lista de `PaymentCard`.

#### PaymentCard

Arquivo:

- `app/student/_payments/components/payment-card.tsx`

Conteudo:

- nome do plano
- badge de status:
  - pago
  - sacado
  - pendente
  - atrasado
  - cancelado
- vencimento
- valor
- CTA `Pagar agora` quando pendente/overdue

### 10.7 Subscription

A subaba `subscription` usa `SubscriptionSection.Simple`.

Estados possiveis:

- sem assinatura
- trialing
- active
- cancelada
- herdada por academia enterprise

Accoes:

- iniciar trial
- assinar premium/pro
- cancelar assinatura

Detalhes importantes:

- o hook trabalha com `includeDaysRemaining` e `includeTrialInfo`;
- o status real e rechecado quando a aba `subscription` abre;
- pode haver `source = GYM_ENTERPRISE`.

### 10.8 Referrals

Arquivo:

- `app/student/_payments/components/student-referral-tab.tsx`

Component tree:

- `ReferralCodeSection`
- `ReferralStatsSection`
- `PixKeyConfigSection`
- `WithdrawSection`
- `WithdrawHistorySection`

Funcionalidades:

- copiar codigo de referral;
- mostrar saldo disponivel;
- mostrar ganho total;
- cadastrar chave PIX;
- escolher tipo da chave;
- solicitar saque;
- ver historico de saques.

Regras observadas na UI:

- copy explica 50% de comissao no primeiro pagamento;
- copy explica 5% de desconto para quem usar o codigo;
- saque minimo visivel: `R$ 3,50`;
- existe taxa fixa de `R$ 0,80`.

### 10.9 PIX modal

Arquivo:

- `components/organisms/modals/pix-qr-modal.tsx`

Responsabilidades:

- mostrar QR;
- mostrar copia e cola do BR code;
- mostrar countdown de expiracao;
- simular pagamento em ambiente de teste;
- fazer polling de confirmacao;
- aceitar referral inline quando configurado.

Uso dentro do student:

- membership
- troca de plano
- assinatura do app
- personal payment

## 11. Discovery de academias

### 11.1 Papel

Combina mapa, lista, promo e contratacao.

### 11.2 Component tree

- titulo e subtitulo
- card de filtros
- card de mapa
- card de lista de academias
  - campanhas patrocinadas
  - lista normal de academias

Arquivo:

- `components/organisms/sections/gym-map-with-leaflet/index.tsx`

### 11.3 Filtros

Opcoes:

- todas
- onde estou inscrito
- proximas
- abertas

### 11.4 Mapa

Caracteristicas:

- Leaflet dinamico, sem SSR
- centro inicial com geolocalizacao
- mostra usuario e academias
- permite selecionar academia pelo marcador

### 11.5 Lista normal de academias

Cada academia usa `AcademyListItemCard` e pode expandir.

Quando expandida, a academia pode mostrar:

- horario de funcionamento;
- comodidades;
- planos disponiveis;
- ligacao telefonica;
- ver perfil;
- comprar diaria;
- assinar plano;
- trocar de plano.

### 11.6 Campanhas patrocinadas na tela de academias

Se a academia tiver `activeCampaigns`, a tela renderiza um card promocional acima da lista normal com:

- selo `Patrocinado`;
- nome da academia;
- titulo/descritivo da campanha;
- CTA `Assinar Agora`.

### 11.7 Regras de plano na lista

Quando ha `membershipPlans` estruturados:

- o aluno pode assinar o primeiro plano rapidamente;
- ou expandir um plano especifico;
- se ja tiver membership ativa, pode trocar para outro plano;
- se o plano for o atual, a UI rotula `Plano ativo`;
- se a matricula estiver pendente, rotula `Matricula pendente`.

## 12. Perfil de academia

### 12.1 Papel

O detalhe de academia aprofunda discovery e contratacao.

Arquivo:

- `app/student/_gyms/gym-profile-view.tsx`

### 12.2 Component tree

- botao `Voltar`
- card hero da academia
- mini stats grid
- card de comodidades
- card de equipamentos
- card de personais
- card de minha matricula
- card de planos disponiveis

### 12.3 Hero da academia

Conteudo:

- nome
- logo/foto principal
- mini galeria de fotos
- rating e reviews
- endereco
- telefone
- horario

### 12.4 Stats rapidas

- alunos ativos
- quantidade de equipamentos

### 12.5 Cards de catalogo

Possiveis secoes:

- comodidades em pills
- equipamentos em chips com status
- personais associados

### 12.6 Minha matricula

Aparece quando ha membership ativa ou pendente:

- mostra estado da matricula;
- permite `Cancelar assinatura`.

### 12.7 Planos disponiveis

Cada plano mostra:

- nome
- duracao
- tipo
- preco
- estado:
  - plano ativo
  - mensalidade pendente
  - contratar
  - trocar de plano

Auto-start de conversao:

- se a tela abrir com `preSelectedPlan` e o aluno ainda nao tiver membership, o fluxo pode auto-iniciar a contratacao.

## 13. Discovery de personais

### 13.1 Tela mapa/lista

Arquivo:

- `components/organisms/sections/personal-map-with-leaflet/index.tsx`

Estrutura:

- titulo e subtitulo
- card de filtros
- card de mapa
- card de lista de personais

Filtros:

- todos
- onde estou inscrito
- proximos
- atendimento remoto

Lista:

- avatar
- nome
- badge `Inscrito`
- presencial/remoto
- distancia
- academias relacionadas

### 13.2 Lista alternativa filtrada

Arquivo:

- `app/student/_personals/personal-list-with-filters.tsx`

Essa versao usa `DuoSelect` e cards clicaveis sem mapa como foco principal.

### 13.3 Perfil do personal

Arquivo:

- `app/student/_personals/personal-profile-view.tsx`

Component tree:

- botao `Voltar`
- hero do personal
- mini stats grid
- card de academias
- card de vinculo atual
- card de planos

Hero:

- avatar circular
- nome
- badges:
  - presencial
  - remoto
  - inscrito
- bio

Stats:

- quantidade de alunos
- quantidade de academias

Academias:

- lista de academias em `AcademyListItemCard`

Vinculo atual:

- aparece se o aluno estiver vinculado;
- mostra plano ativo;
- permite `Desvincular`.

Planos:

- nome
- duracao
- tipo
- preco
- CTA `Assinar`

Fluxo financeiro:

- `handleSubscribe` chama `subscribeToPersonal`;
- recebe payload PIX;
- sobe para o shell abrir `PixQrModal`.

## 14. Education

### 14.1 Papel

A educacao e um subproduto dentro do student. Ela tem tres niveis:

- menu;
- exploracao anatomica;
- licoes com quiz.

### 14.2 Tela menu

Arquivo:

- `app/student/_education/education-page.tsx`

Cards:

- `Anatomia e Exercicios`
- `Licoes de Ciencia`

Cada card:

- icone emoji grande em caixa colorida
- titulo
- descricao curta
- hover de borda

### 14.3 MuscleExplorer

Arquivo:

- `app/student/_education/muscle-explorer.tsx`

Component tree:

- titulo
- `DuoSelect` de categoria
- `SearchBar`
- view `muscles` ou `exercises`
  - `MuscleList`
  - `ExerciseList`
  - `MuscleDetail`
  - `ExerciseDetail`

Filtros:

- busca textual
- alternancia musculos/exercicios

Agrupamentos:

- musculos por grupo
- exercicios por musculo primario

### 14.4 EducationalLessons

Arquivo:

- `app/student/_education/educational-lessons.tsx`

Component tree:

- titulo
- `LessonFilters.Simple`
- `LessonList.Simple`
- `LessonDetail.Simple`
- `LessonQuiz.Simple`

Estados:

- lista de licoes
- detalhe de licao
- quiz

Categorias coloridas:

- training-science -> azul
- nutrition -> verde
- recovery -> roxo
- form -> laranja
- anatomy -> amarelo

## 15. Cardio e functional

### 15.1 Papel

Abrir dois produtos relacionados:

- cardio tracker
- functional workout

Arquivo:

- `app/student/_cardio/cardio-functional-page.tsx`

### 15.2 Tela menu

Blocos:

- titulo e subtitulo
- mini stats grid
- card `Treino Cardio`
- card `Treino Funcional`
- card informativo amarelo `Calculo Personalizado`

### 15.3 Tela cardio

Quando `view === cardio`:

- renderiza `BackButton`
- renderiza `CardioTracker.Simple`

### 15.4 Tela functional

Quando `view === functional`:

- renderiza `BackButton`
- renderiza `FunctionalWorkout.Simple`

## 16. Profile

### 16.1 Papel

O profile do aluno e ao mesmo tempo:

- identidade;
- progresso;
- historico;
- relacionamento com academias/personais;
- configuracao de conta.

### 16.2 Component tree da tela

- `ProfileHeader`
- `DuoStatsGrid.Root`
- `WeightEvolutionCard`
- grid 2 colunas:
  - `RecentHistoryCard`
  - `PersonalRecordsCard`
- grid 2 colunas:
  - `MyAcademiasCard`
  - `MyPersonalsCard`
- `AccountSection`
- `WeightModal`

### 16.3 Hook orquestrador

Arquivo:

- `app/student/_profile/hooks/use-profile-page.ts`

Responsabilidades:

- carregar peso, perfil, progresso e usuario;
- escutar `workoutCompleted`;
- montar `displayProgress`;
- derivar `currentWeight`, `weightGain`, `weeklyWorkouts`;
- localizar `firstWorkoutUrl`;
- construir `recentWorkoutHistory`, inclusive treino em progresso;
- abrir/salvar peso;
- logout;
- switch para `/gym` quando admin.

### 16.4 ProfileHeader

Arquivo:

- `components/ui/profile-header.tsx`

Composicao:

- avatar circular com gradiente
- nome
- `@username`
- texto `Membro desde`
- contadores:
  - treinos
  - streak
- grid inferior com quick stats
- slot para botoes de quick stat

Uso real no profile:

- quick stat do delta de peso;
- botao grande verde para editar peso atual.

### 16.5 Stats grid do profile

Itens:

- dias seguidos
- XP total
- nivel atual
- treinos

### 16.6 WeightEvolutionCard

Arquivo:

- `app/student/_profile/components/weight-evolution-card.tsx`

Conteudo:

- titulo
- delta mensal em kg
- historico de registros com mini barras horizontais

Estado vazio:

- icone `Target`
- CTA `Registrar Peso Inicial`

### 16.7 RecentHistoryCard

Arquivo:

- `app/student/_profile/components/recent-history-card.tsx`

Conteudo:

- lista de `HistoryCard.Simple`
- pode mostrar exercicios internos quando ha `lastInProgressWorkout`

Estado vazio:

- CTA `Primeiro Treino`

### 16.8 PersonalRecordsCard

Arquivo:

- `app/student/_profile/components/personal-records-card.tsx`

Conteudo:

- lista de `RecordCard.Simple`
- tipo de unidade:
  - kg para `max-weight`
  - reps para outros

Estado vazio:

- CTA `Primeiro Treino`

### 16.9 MyAcademiasCard

Arquivo:

- `app/student/_profile/components/my-academias-card.tsx`

Comportamento:

- carrega memberships sob demanda;
- deduplica por `gymId`;
- mostra cards resumidos via `AcademyListItemCard`;
- CTA `Ver mais` ou `Encontrar academias`.

### 16.10 MyPersonalsCard

Arquivo:

- `app/student/_profile/components/my-personals-card.tsx`

Comportamento:

- carrega `assignedPersonals` do discovery store;
- mostra `PersonalListItemCard`;
- CTA `Encontrar personais` ou `Personais`.

### 16.11 AccountSection

Arquivo:

- `app/student/_profile/components/account-section.tsx`

Conteudo:

- para admin:
  - `Trocar para Perfil de Academia`
- para qualquer usuario:
  - `Sair`

Visual:

- card azul
- subcards internos clicaveis
- logout com acento vermelho.

## 17. More

### 17.1 Papel

A tela `more` concentra atalhos para funcoes que nao cabem na bottom nav.

### 17.2 Component tree

- titulo e subtitulo
- grid vertical de `NavigationButtonCard`

### 17.3 Itens padrao

Itens visiveis para qualquer aluno:

- academias
- personais
- pagamentos
- assinatura premium

Itens admin only:

- estatisticas
- configuracoes
- aprender
- teste de tema

### 17.4 NavigationButtonCard

Arquivo:

- `components/ui/navigation-button-card.tsx`

Composicao:

- `DuoCard.Root`
- bloco de icone colorido
- titulo
- descricao

Caracteristicas:

- card inteiro clicavel;
- cor do card varia pelo dominio;
- usa sombra inferior especifica por cor;
- algumas variantes sao `highlighted`, `blue`, `yellow`, `orange`.

## 18. Onboarding

### 18.1 Papel

O onboarding do aluno nao e apenas cadastro; ele define:

- perfil corporal;
- objetivo;
- acesso a equipamento;
- atividade;
- parametros metabolicos;
- preferencias de treino;
- restricoes fisicas e medicas.

### 18.2 Estrutura

Arquivo:

- `app/student/onboarding/page.tsx`

Wizard consolidado em 3 passos:

- `ConsolidatedStep1`
- `ConsolidatedStep2`
- `ConsolidatedStep3`

### 18.3 Estrutura fixa da tela

Blocos persistentes:

- background com particulas animadas;
- contador `step de 3`;
- card central grande;
- barra fixa inferior com botoes;
- confete em avancos e submit.

### 18.4 Step 1 - identidade, objetivo e contexto

Arquivo:

- `onboarding/steps/consolidated-step1.tsx`

Secoes:

- Informacoes pessoais
  - idade
  - altura
  - peso
  - genero
  - trans/hormonios
  - meses de tratamento hormonal
  - nivel de experiencia
- Objetivo principal
  - perder peso
  - ganhar massa
  - definir/manter
  - treinos por semana
  - duracao por treino
- Equipamentos
  - academia completa
  - academia basica
  - home gym
  - so peso corporal
- Nivel de atividade 1-10

UX:

- validacao progressiva com `touched`;
- sliders para duracao e atividade;
- cards/botoes de genero;
- painel explicativo do nivel de atividade.

### 18.5 Step 2 - valores metabolicos

Arquivo:

- `onboarding/steps/consolidated-step2.tsx`

Implementacao:

- reutiliza `Step5`;
- nao coleta input livre principal;
- exibe valores metabolicos calculados automaticamente.

Parametros persistidos:

- BMR
- TDEE
- targetCalories
- targetProtein
- targetCarbs
- targetFats

### 18.6 Step 3 - preferencias e limitacoes

Arquivo:

- `onboarding/steps/consolidated-step3.tsx`

Secoes:

- Preferencias de treino
  - numero de series
  - faixa de repeticoes
  - descanso
- Limitacoes e consideracoes
  - limitacoes fisicas
  - limitacoes motoras
  - condicoes medicas

Componentes:

- `DuoSelect.Simple`
- `LimitationSelector.Simple`

Detalhamento configuravel:

- pernas -> joelhos/quadris/tornozelos/geral
- bracos -> ombros/cotovelos/pulsos/geral
- diabetes -> tipo
- problemas cardiacos -> tipo
- campos `outras-*` com input textual

### 18.7 Validacao e submit

Arquivos:

- `onboarding/schemas.ts`
- `onboarding/actions.ts`

Validacoes importantes:

- idade: 13 a 120
- altura: 100 a 250 cm
- peso: 30 a 300 kg
- treino/atividade com limites definidos
- calorias: 800 a 10000
- proteina, carbos e gorduras com faixas min/max

Submit:

- normaliza defaults de treino;
- valida payload inteiro com Zod;
- envia para `/api/students/onboarding`;
- ao concluir:
  - se existir referral cookie -> `/student?tab=payments&subTab=subscription`
  - senao -> `/student`

## 19. Estados, mensagens e padroes de UX

### 19.1 Empty states

Padrao dominante:

- icone grande;
- titulo curto;
- texto explicando o valor da feature;
- CTA primaria unica.

Esse padrao aparece em:

- home/continue workout;
- home/nutrition;
- diet/hidratacao;
- diet/refeicoes;
- learn/sem plano;
- profile/peso;
- profile/historico;
- profile/recordes;
- my academias;
- my personals;
- payments/historico vazio;
- referrals/historico vazio.

### 19.2 Feedback de sucesso

Principais formas:

- toast;
- badge de estado;
- atualizacao otimista;
- confete no onboarding;
- tela de conclusao do treino;
- modal PIX fechando apos confirmacao.

### 19.3 Feedback de loading

Formas mais comuns:

- loading screen no layout;
- texto `Carregando...`;
- map placeholder;
- spinner no onboarding submit;
- spinner em QR/PIX quando necessario.

## 20. Data flow e stores

### 20.1 Store unificado

O `student` depende fortemente de `useStudent()` para ler:

- progress
- user
- profile
- workoutHistory
- weightHistory
- weightGain
- personalRecords
- weeklyPlan
- units
- dailyNutrition
- memberships
- payments
- subscription
- gymLocations
- dayPasses

### 20.2 Loaders usados ao longo do modulo

Exemplos encontrados:

- `loadWeeklyPlan`
- `loadMemberships`
- `loadPayments`
- `loadReferral`
- `loadProfile`
- `loadProgress`
- `loadWeightHistory`
- `loadUser`
- `loadGymLocationsWithPosition`

### 20.3 Acoes do modulo

Exemplos usados diretamente pelas telas:

- `joinGym`
- `changeMembershipPlan`
- `cancelMembership`
- `cancelPersonalAssignment`
- `subscribeToPersonal`
- `addDayPass`
- `addWeight`
- `cancelStudentPayment`
- `getStudentPaymentStatus`
- `getPersonalPaymentStatus`
- `createWeeklyPlan`

### 20.4 Eventos globais observados

Eventos importantes:

- `workoutCompleted`
- `workoutProgressUpdate`

Esses eventos influenciam:

- destravamento de `WorkoutNode`;
- reload do plano semanal;
- atualizacao do profile/progresso.

## 21. Regras de negocio relevantes no `student`

### 21.1 Membership de academia

- aluno pode entrar em academia e gerar PIX;
- membership pode ficar `pending`, `active`, `canceled`, `suspended`;
- troca de plano gera novo PIX;
- cancelamento de matricula existe no profile e no payments.

### 21.2 Personal subscription

- assinatura de personal gera PIX;
- so apos pagamento confirmado o vinculo fica efetivo;
- pode haver pre-selecao de plano e cupom.

### 21.3 Referral

- aluno tem codigo proprio;
- referral aplicado na assinatura do app pode reemitir PIX com desconto;
- tab de referrals controla saque e chave PIX.

### 21.4 Enterprise gym benefit

Mesmo quando a tela nao expande isso visualmente, a area de subscription do aluno precisa considerar o caso em que a assinatura premium vem herdada de academia enterprise.

### 21.5 Onboarding bloqueia entrada plena

Sem perfil:

- o aluno nao usa o shell principal;
- vai obrigatoriamente para onboarding.

## 22. Checklist de fidelidade para reimplementacao 1:1

### 22.1 Shell

- header fixo com logo, paleta e pill de streak;
- bottom nav com label apenas no item ativo;
- area central com scroll escondido;
- tabs controladas por query param;
- modais globais montados no layout.

### 22.2 Visual

- Nunito como fonte principal;
- cards brancos em fundo cinza claro;
- borda cinza clara sempre presente;
- verde como CTA dominante;
- azul como secundaria/informacional;
- orange para streak e campanhas;
- numericos grandes, copy curta.

### 22.3 Motion

- fade/slide/stagger em listas;
- cards com hover/press;
- confete no onboarding;
- progresso visual em nodes de treino;
- modal de treino fullscreen com transicao suave.

### 22.4 Estados

- empty states com CTA clara;
- loading states curtos e focados;
- toasts para operacoes;
- badges para status financeiro.

### 22.5 Navegacao

- preservar `tab`, `subTab`, `gymId`, `personalId`, `view`, `lesson`, `muscle`, `exercise`, `modal`, `workoutId`, `exerciseIndex`, `mealId`;
- preservar fluxos inline, sem virar tela separada desnecessariamente;
- preservar detalhes dentro do mesmo shell quando o web faz isso.

## 23. Resumo executivo

O `student` web do GymRats nao e uma unica tela com tabs simples. Ele e um shell app-like com varios mini-produtos integrados:

- home gamificada;
- trilha semanal de treino;
- runtime de treino fullscreen;
- cockpit de nutricao;
- marketplace geolocalizado de academias;
- marketplace de personais;
- centro financeiro completo com PIX;
- centro educacional;
- profile rico em progresso e relacionamentos;
- onboarding metabolico e clinico relativamente profundo.

Qualquer tentativa de recriar esse modulo com fidelidade precisa respeitar simultaneamente:

- a hierarquia do shell;
- o sistema visual Duo;
- a navegacao por query state;
- os modais persistentes;
- os estados vazios e de sucesso;
- a logica de bootstrap/store;
- as regras de negocio de pagamento, membership, referral e onboarding.
