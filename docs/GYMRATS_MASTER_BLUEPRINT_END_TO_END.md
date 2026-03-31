# GymRats Master Blueprint End-to-End

## 0. Objetivo deste documento

Este arquivo e o blueprint mestre da aplicacao GymRats. A meta aqui nao e apenas "descrever o produto", mas registrar produto, UX, UI, arquitetura, dados, pagamentos, regras de negocio e fluxos de ponta a ponta com nivel suficiente para:

1. um time humano entender o sistema inteiro sem navegar em dezenas de arquivos;
2. uma IA conseguir reconstruir o projeto com comportamento funcional muito proximo do atual;
3. servir como referencia unica para design, engenharia, growth e operacao.

## 1. Como interpretar este blueprint

### 1.1 Hierarquia de verdade

Quando houver divergencia entre materiais, a ordem de confianca usada neste documento e:

1. codigo executavel atual;
2. schema Prisma;
3. rotas, handlers, services e stores;
4. documentos tecnicos existentes no repo;
5. copies e pistas da interface.

### 1.2 Escopo coberto

Este documento cobre:

- superficie web publica e autenticada;
- experiencias de `student`, `gym`, `personal` e `admin`;
- sistema visual, navegacao, componentes e padroes de interacao;
- backend, filas, webhook, cron e integracoes;
- banco de dados e modelos de dominio;
- monetizacao, billing, referral, boosts e saque;
- regras de negocio e edge cases;
- lacunas reais entre visao de produto e implementacao atual.

### 1.3 Importante

O repo possui muita documentacao antiga e complementar. Este arquivo consolida o estado mais fiel encontrado no codigo atual. Onde havia contradicao, a implementacao atual venceu.

## 2. Definicao do produto

GymRats e uma plataforma fitness multi-face e multi-tenant com tres motores de negocio integrados:

- B2C para aluno (`student`): treino, dieta, progresso, educacao, assinatura premium, descoberta de academias e personais.
- B2B2C para academia (`gym`): operacao da academia, alunos, equipamentos, check-ins, planos, cobrancas, impulsionamento e assinatura da propria academia.
- B2B/B2C para personal (`personal`): perfil profissional, afiliacao com academias, alunos independentes ou via academia, planos proprios, assinatura e financeiro.

O produto tenta juntar:

- app de progresso/gamificacao de treino;
- app de IA para treino e nutricao;
- marketplace local de academias e personais;
- sistema de gestao operacional para academia;
- sistema de monetizacao recorrente com referrals e boosts.

## 3. Estrutura do monorepo e runtimes

### 3.1 Apps

- `apps/web`: aplicacao Next.js principal, com landing, auth, app do aluno, app da academia, app do personal e area admin de observabilidade.
- `apps/api`: backend HTTP, organizado por rotas em dominios (`students`, `gyms`, `personals`, `subscriptions`, `workouts`, `nutrition`, etc.), com Prisma e regras de negocio.
- `apps/worker`: workers BullMQ para email, processamentos de plano e webhooks.
- `apps/cron`: rotina agendada para reset semanal.
- `apps/mobile`: pasta presente, mas atualmente sem superficie funcional relevante.

### 3.2 Packages compartilhados

- `packages/db`: schema Prisma e modelos centrais.
- `packages/access-control`: configuracao de planos, features e politicas de acesso.
- `packages/api`: camada compartilhada de API/OpenAPI/swagger.
- `packages/types`: tipos compartilhados.
- `packages/cache`: Redis/BullMQ.
- `packages/workflows`: rotinas orquestradas usadas pelo cron.

### 3.3 Stack tecnico principal

- frontend: Next.js 16, React 19, Tailwind CSS 4;
- animacao: `motion/react`;
- mapas: Leaflet;
- estado: Zustand;
- query string state: `nuqs`;
- auth: Google + sessao/token sincronizados no cliente;
- backend/data: Prisma + Postgres;
- pagamentos: AbacatePay, com foco atual em PIX;
- filas: BullMQ + Redis;
- charts e UI auxiliar: Recharts, Radix e componentes internos.

## 4. Modelo de atores e tenancy

### 4.1 Roles de usuario

- `PENDING`: usuario autenticado que ainda nao escolheu papel.
- `STUDENT`: aluno final.
- `GYM`: operador ou dono de academia.
- `PERSONAL`: personal trainer.
- `ADMIN`: superusuario com bypass de acesso e entradas auxiliares.

### 4.2 Entidades de dominio ligadas ao usuario

- um `User` pode ter `Student`;
- um `User` pode ter uma ou mais `Gym`;
- um `User` pode ter `Personal`;
- `ADMIN` tambem pode ganhar perfil de `Student` automaticamente em certos fluxos.

### 4.3 Multi-tenancy e isolamento

- `student` e uma entidade individual;
- `gym` e uma entidade por academia/unidade;
- um mesmo usuario pode ter varias academias;
- personal e entidade propria, podendo atuar de forma independente ou afiliada a academias;
- um aluno pode estar ligado a varias academias e varios personais, com contexto por academia quando aplicavel.

## 5. Planos, permissoes e acesso

### 5.1 Features canonicas

O pacote `packages/access-control` define seis chaves principais:

- `use_ai_workout`
- `use_ai_nutrition`
- `assign_personal`
- `boost_placement`
- `advanced_reports`
- `network_access`

### 5.2 Planos do aluno

- `FREE`
  - sem features pagas.
- `PREMIUM`
  - `use_ai_workout`
  - `use_ai_nutrition`
  - preco: R$ 6,00 mensal / R$ 60,00 anual
- `PRO`
  - tudo do `PREMIUM`
  - `network_access`
  - preco: R$ 150,00 mensal / R$ 1.500,00 anual

### 5.3 Planos da academia

- `BASIC`
  - gestao de alunos e check-ins
  - cobranca e planos de academia
  - dashboard basico
  - `use_ai_workout`
  - `use_ai_nutrition`
  - preco base: R$ 300,00 mensal / R$ 3.000,00 anual
  - preco por aluno no mensal: R$ 1,50
  - preco por personal afiliado no mensal: R$ 150,00
- `PREMIUM`
  - tudo do Basic
  - multiplas academias/unidades
  - `advanced_reports`
  - `use_ai_workout`
  - `use_ai_nutrition`
  - preco base: R$ 500,00 mensal / R$ 5.000,00 anual
  - preco por aluno no mensal: R$ 1,00
  - preco por personal afiliado no mensal: R$ 100,00
- `ENTERPRISE`
  - tudo do Premium
  - `assign_personal`
  - heranca de beneficio premium para alunos da academia
  - preco base: R$ 700,00 mensal / R$ 7.000,00 anual
  - preco por aluno no mensal: R$ 0,50
  - preco por personal afiliado no mensal: R$ 50,00

### 5.4 Planos do personal

- `STANDARD`
  - perfil profissional
  - gestao de alunos
  - vinculo com academias
  - `use_ai_workout`
  - preco: R$ 300,00 mensal / R$ 3.000,00 anual
- `PRO_AI`
  - tudo do Standard
  - `use_ai_workout`
  - `use_ai_nutrition`
  - preco: R$ 450,00 mensal / R$ 4.500,00 anual

### 5.5 Herancas e efeitos cruzados

- `ADMIN` tem bypass.
- aluno com membership ativo em academia `ENTERPRISE` recebe acesso de assinatura tipo premium.
- esse acesso e persistido em `Subscription.source = GYM_ENTERPRISE`.
- se o aluno ja tinha premium proprio, o sistema guarda `ownPeriodEndBackup` para restaurar depois.
- personal recebe desconto de 50% na propria assinatura quando possui afiliacao ativa com academia `PREMIUM` ou `ENTERPRISE`.
- aluno `PRO` pode fazer check-in em academia `ENTERPRISE` mesmo sem membership ativo, registrando `ProGymAccess`.

### 5.6 Divergencias importantes entre visao e codigo

- alguns docs antigos sugerem desconto do personal apenas com academia `ENTERPRISE`; o codigo atual concede desconto tambem para academia `PREMIUM`.
- alguns docs antigos sugerem cobranca por personal apenas em `ENTERPRISE`; o codigo atual cobra por personal afiliado em todos os planos mensais de academia, com valor variando por plano.
- referrals para `PERSONAL` aparecem na visao de negocio antiga, mas nao estao implementados de forma completa no codigo atual.

## 6. Monetizacao e dinheiro

### 6.1 Fontes de receita

- assinatura do aluno no app;
- assinatura da academia;
- assinatura do personal;
- pagamentos de membership do aluno para academia;
- pagamentos de plano do aluno para personal;
- impulsionamento/boost campaigns;
- referrals;
- saques via PIX.

### 6.2 Gateway e forma de pagamento

No estado atual, o fluxo dominante e PIX via AbacatePay.

O sistema cria:

- `pixQrCode` para assinaturas e pagamentos de planos;
- webhooks `billing.paid`;
- saque PIX para academia e aluno em contexto de saldo.

### 6.3 Referrals

Regras atuais confirmadas no codigo:

- codigo do aluno e gerado a partir do prefixo do email, no formato `@nome`;
- quem usa indicacao ganha 5% de desconto no PIX da assinatura do aluno ou da academia;
- quem indicou recebe 50% do valor do primeiro pagamento confirmado;
- o codigo impede self-referral;
- a comissao e registrada em `Referral`;
- o saldo do aluno pode ser sacado via PIX.

Cobertura implementada hoje:

- referral de aluno para assinatura do proprio aluno: implementado;
- referral de aluno para assinatura da academia: implementado;
- referral para personal: nao aparece implementado de ponta a ponta no codigo atual.

### 6.4 Saques

Regras confirmadas:

- valor minimo: R$ 3,50;
- taxa fixa considerada: R$ 0,80;
- aluno saca saldo de referrals;
- academia saca saldo liquido de pagamentos recebidos menos taxas e saques anteriores;
- em ambiente nao-producao existe modo `fake` para concluir saque sem gateway real.

## 7. Sistema de UX, UI, CX e DX

### 7.1 Direcao visual

O produto usa um design system proprio chamado informalmente de "Duo", inspirado em:

- interface gamificada;
- cores vibrantes;
- cards amigaveis;
- reforco visual por progresso;
- forte vocacao mobile-first.

Tokens centrais vistos em `apps/web/app/globals.css`:

- verde principal (`--duo-primary`);
- azul secundario (`--duo-secondary`);
- laranja/accent (`--duo-accent`);
- amarelo de aviso;
- vermelho de erro;
- fonte principal `Nunito`.

### 7.2 Principios de experiencia

Principios materializados no codigo e nos docs:

- clareza imediata;
- estado explicito;
- feedback rapido;
- consistencia visual;
- gamificacao saudavel;
- mobile-first;
- navegacao por tabs de baixo atrito;
- foco em progresso, streak, nivel e acao seguinte.

### 7.3 Padrao de layout

O shell principal usa `AppLayout.Simple`:

- header com metricas e logo/contexto;
- area central scrollavel;
- bottom navigation fixa;
- estado de aba controlado por query param `tab`;
- reset de scroll ao trocar aba.

Este padrao se repete em:

- `student`
- `gym`
- `personal`

### 7.4 Padrao de navegacao

- navegacao principal por tabs;
- subnavegacao por query params (`subTab`, `view`, `gymId`, `personalId`, `lesson`, `muscle`, `exercise`);
- detalhes podem abrir inline sem sair do shell principal;
- existem tambem wrappers/rotas paralelas para deep-link e uso direto.

### 7.5 Microinteracoes e motion

O produto usa bastante motion para:

- fade/slide/stagger de cards;
- onboarding;
- feedback de selecao;
- modal workout em tela cheia;
- experiencia mais "app" do que "painel web".

### 7.6 CX

Aspectos fortes de CX:

- progresso sempre visivel;
- aluno quase sempre sabe "o que fazer agora";
- discovery local de academias e personais com mapa e lista;
- fluxo de pagamento com PIX modal e polling;
- onboarding orientado por objetivo e limitacoes;
- bibliotecas reaproveitaveis de treino e nutricao;
- linguagem de UI simples e visualmente amigavel.

### 7.7 DX

Aspectos fortes de DX:

- monorepo;
- Prisma central;
- pacote de access-control separado;
- swagger/openapi gerado;
- workers e cron isolados;
- rotas por dominio;
- varios docs tecnicos no repo.

Custos atuais de DX:

- duplicidade entre implementacoes antigas e novas em algumas areas;
- parte da documentacao descreve estado alvo, nao necessariamente o runtime atual;
- existem componentes paralelos com sobreposicao de responsabilidade;
- alguns fluxos parecem parcialmente migrados entre docs, stores e novas use-cases.

## 8. Sistema de componentes

### 8.1 Organizacao

A pasta `apps/web/components` segue uma mistura de Atomic Design e design system proprio:

- `atoms`
- `molecules`
- `organisms`
- `templates`
- `ui`
- `duo`
- `animations`
- `providers`
- `marketing`

### 8.2 Camada Duo

Principais blocos reutilizados:

- `DuoButton`
- `DuoCard`
- `DuoInput`
- `DuoSelect`
- `DuoModal`
- `DuoStatCard`
- `DuoStatsGrid`
- `DuoAchievementCard`
- `DuoBadge`
- `DuoProgress`

### 8.3 Componentes estruturais recorrentes

- `AppHeader`
- `AppBottomNav`
- `PixQrModal`
- `SubscriptionSection`
- `SubscriptionCancelDialog`
- `WorkoutModal`
- `TrainingLibraryModal`
- `NutritionLibraryModal`
- `GymMapWithLeaflet`
- `PersonalMapWithLeaflet`
- `GymStudentsPage`
- `GymStudentDetail`
- `PersonalStudentDetail`
- `EducationPage`, `MuscleExplorer`, `EducationalLessons`

### 8.4 Componentes de negocio importantes

- cards de home do aluno para streak, XP, peso, treino, nutricao;
- list item cards de academia/personal;
- tabs financeiras;
- cards de membership e payment;
- cards de refeicao e hidratacao;
- cards de equipamento, manutencao e check-in;
- cards de ranking e conquistas da academia.

## 9. Superficie de paginas e rotas web

### 9.1 Publico e auth

- `/`
  - landing page publica, com toggle de visao aluno/academia;
  - se usuario autenticado, redireciona para a area autenticada.
- `/welcome`
  - pagina de boas-vindas/login, com CTA de Google login.
- `/auth/callback`
  - processa retorno do login e redireciona por role.
- `/auth/login`
  - redireciona para `/welcome`.
- `/auth/register/user-type`
  - escolha de papel inicial (`student`, `gym`, `personal`).
- `/api-docs`
- `/swagger`

### 9.2 Student

- `/student`
- `/student/onboarding`
- `/student/_theme-test`

### 9.3 Gym

- `/gym`
- `/gym/onboarding`
- `/gym/_financial`
- `/gym/_students`
- `/gym/_students/[id]`
- `/gym/_equipment`
- `/gym/_equipment/[id]`
- `/gym/_stats`
- `/gym/_settings`
- `/gym/_academias`
- `/gym/_gamification`
- `/gym/_theme-test`

### 9.4 Personal

- `/personal`
- `/personal/onboarding`
- `/personal/_students`
- `/personal/_students/[id]`
- `/personal/_financial`
- `/personal/_stats`
- rotas auxiliares de dashboard/settings/gyms

### 9.5 Admin

- `/admin/observability`

## 10. Jornada publica e autenticacao

### 10.1 Landing (`/`)

Funcao:

- pagina publica de marketing;
- alterna visao de valor para aluno e academia;
- se sessao existe, nao mostra marketing: redireciona para a area autenticada.

### 10.2 Welcome (`/welcome`)

Funcao:

- tela de login dedicada;
- card central com logo, 4 pilares do produto e CTA de Google login;
- tratamento de erro de callback.

### 10.3 Callback auth

Fluxo:

1. recebe `token` ou `oneTimeToken`;
2. troca token por sessao ou busca sessao;
3. sincroniza store de auth;
4. decide redirect:
   - `PENDING` -> `/auth/register/user-type`
   - `GYM` -> `/gym`
   - `PERSONAL` -> `/personal`
   - `STUDENT` e `ADMIN` -> `/student`
5. se houver cookie de referral, desvia para area de assinatura.

### 10.4 Escolha de papel

Tela mostra:

- card para aluno;
- card para academia;
- card para personal;
- bullets de valor por papel;
- grava intencao e envia para onboarding correspondente.

## 11. Experiencia do aluno (`student`)

### 11.1 Shell principal

Tabs principais no bottom nav:

- `home`
- `learn`
- `diet`
- `profile`
- `more`

Tabs e views adicionais acessiveis por query:

- `cardio`
- `payments`
- `personals`
- `gyms`
- `education`

Componentes globais carregados no layout:

- `WorkoutModal.Simple`
- `EditUnitModal`
- `TrainingLibraryModal`
- `NutritionLibraryModal`

Comportamento estrutural:

- usa `useStudentInitializer({ autoLoad: true })`;
- se perfil nao existe, redireciona para onboarding;
- carrega dados do store unificado;
- ha fortes sinais de arquitetura offline-first e bootstrap por secoes.

### 11.2 Onboarding do aluno

Wizard consolidado em 3 etapas.

#### Etapa 1: perfil fisico e objetivo

Coleta:

- idade
- altura
- peso
- genero
- se e trans
- uso de hormonio
- tipo de hormonio
- duracao de tratamento hormonal
- nivel de experiencia
- objetivo principal
- frequencia semanal de treino
- duracao de treino
- tipo de academia / acesso a equipamentos
- nivel de atividade de 1 a 10

#### Etapa 2: calorias e macros

Calcula e persiste:

- BMR
- TDEE
- calorias alvo
- proteina alvo
- carboidrato alvo
- gordura alvo
- modo de objetivo: cutting / bulking / manutencao

#### Etapa 3: preferencias e restricoes

Coleta:

- preferencia de series
- faixa de repeticoes
- tempo de descanso
- limitacoes fisicas
- limitacoes motoras
- condicoes medicas
- detalhes estruturados de cada uma

Observacoes de UX:

- progresso visual;
- celebracao/confete;
- os botoes "Pular" e "Completar" convergem para o mesmo submit;
- se existir cookie de referral, o redirect final vai para assinatura premium.

### 11.3 Home

Objetivo:

- mostrar panorama do dia e proxima melhor acao.

Blocos:

- saudacao com nome;
- `BoostCampaignCarousel`;
- card de progresso de nivel;
- grid com streak, XP do dia, nivel e treinos completos;
- evolucao de peso;
- continuar treino;
- status de nutricao;
- historico recente.

Acoes:

- abrir perfil de academia a partir de boost;
- abrir perfil de personal a partir de boost;
- continuar treino;
- navegar para tabs especificas.

### 11.4 Learn / Learning Path

Objetivo:

- representar o plano semanal em formato gamificado.

Caracteristicas:

- trilha estilo Duolingo;
- 7 dias;
- slots de treino ou descanso;
- cada node e um `WorkoutNode`;
- pode criar plano semanal caso nao exista;
- abre treino via query/modal;
- respeita dias de descanso.

### 11.5 Workout modal global

Fluxo funcional:

- tela cheia;
- header com progresso do treino;
- card do exercicio atual;
- overlay de tracking de carga e repeticoes;
- configuracao de cardio;
- seletor de exercicio alternativo;
- controle de pular, voltar, concluir e finalizar;
- tela final com resumo do treino, XP e volume total.

Capacidades:

- acompanhar execucao por exercicio;
- registrar sets, reps e peso;
- detectar conclusao;
- trocar por exercicio alternativo;
- acessar educacao do exercicio;
- suportar cardio e treino de forca;
- repetir treino ao concluir.

### 11.6 Biblioteca de treinos

Funcao:

- salvar planos semanais reutilizaveis;
- criar plano em branco;
- editar plano;
- excluir;
- ativar como plano semanal atual;
- marcar visualmente o plano em uso.

Origem dos planos:

- do proprio aluno;
- da academia;
- do personal.

### 11.7 Cardio / Functional

Tela de entrada para:

- cardio tracker;
- treino funcional.

Mostra:

- resumo estatico;
- explicacao sobre calculo personalizado de calorias.

### 11.8 Diet

Objetivo:

- gerenciar nutricao do dia.

Blocos:

- macro cards;
- hidratacao;
- refeicoes do dia;
- modais de adicionar refeicao e alimento;
- biblioteca de alimentacao.

Acoes:

- marcar refeicao como completa;
- adicionar refeicao;
- adicionar alimento em refeicao;
- remover refeicao;
- remover alimento;
- alternar copos de agua;
- abrir biblioteca;
- carregar base de alimentos sob demanda.

### 11.9 Biblioteca de alimentacao

Permite:

- criar plano alimentar;
- editar;
- excluir;
- ativar plano;
- usar planos de origem `STUDENT`, `GYM` ou `PERSONAL`.

Tambem existe versao escopada para o aluno em contexto de academia/personal.

### 11.10 Payments

Subtabs:

- `memberships`
- `payments`
- `subscription`
- `referrals`

#### Memberships

- agrupa memberships por academia;
- expande por academia;
- mostra plano, valor, status e proximos vencimentos;
- permite trocar plano;
- permite cancelar membership;
- CTA para adicionar nova academia.

#### Payments

- agrupa historico por academia;
- mostra total pago por academia;
- expande e lista pagamentos individuais;
- `pay now` gera novo PIX quando necessario.

#### Subscription

- mostra assinatura do app;
- trial, ativa, cancelada, herdada por academia enterprise;
- iniciar trial;
- assinar Premium/Pro;
- cancelar assinatura;
- aplicar referral no modal PIX quando elegivel.

#### Referrals

- mostra codigo `@handle`;
- copiar codigo;
- saldo disponivel;
- ganho total;
- configurar chave PIX;
- solicitar saque;
- historico de saques.

### 11.11 Descoberta de academias

Tela base:

- `GymMapWithLeaflet`
- filtros `all`, `subscribed`, `near`, `open`
- mapa + lista
- geolocalizacao
- reload com posicao do usuario

Cards de academia mostram:

- logo/foto;
- aberta ou nao;
- rating, reviews, distancia;
- endereco;
- horario;
- amenities;
- planos;
- telefone;
- CTA de ver perfil;
- CTA de assinar plano ou diaria.

Boosts:

- campanhas patrocinadas aparecem acima da lista organica;
- podem linkar para plano especifico e cupom.

Importante sobre day pass:

- existe modelo `DayPass` no banco e endpoint de leitura;
- no shell web atual, a compra de diaria esta implementada de forma otimista/local, gerando pass e QR placeholder no store;
- nao foi encontrada a cobranca real de diaria ponta a ponta no front atual.

### 11.12 Perfil da academia (vista do aluno)

Mostra:

- header com fotos/logo;
- nota e reviews;
- endereco e telefone;
- horario;
- stats de alunos e equipamentos;
- amenities;
- chips de equipamentos;
- personais vinculados;
- membership atual do aluno;
- lista de planos e CTAs de aderir ou trocar.

Comportamentos:

- suporta pre-selecao de `planId` e `couponId`;
- pode abrir fluxo PIX direto;
- pode cancelar membership atual;
- pode navegar para perfil de personal da academia.

### 11.13 Descoberta de personais

Tela base:

- `PersonalMapWithLeaflet`
- filtros `all`, `subscribed`, `near`, `remote`
- mapa + lista;
- geolocalizacao.

### 11.14 Perfil do personal (vista do aluno)

Mostra:

- avatar;
- bio;
- badges presencial/remoto;
- status de inscricao;
- numero de alunos e academias;
- academias ligadas;
- inscricao atual do aluno;
- lista de planos do personal.

Acoes:

- assinar plano do personal via PIX;
- aplicar cupom;
- cancelar vinculo;
- navegar para academia do personal.

### 11.15 Education

Menu de entrada:

- anatomia e exercicios;
- aulas e ciencia.

Subfluxos:

- `MuscleExplorer`
  - pesquisa de musculo;
  - lista de exercicios por musculo;
  - detalhe do exercicio.
- `EducationalLessons`
  - lista de licoes;
  - filtros;
  - renderer markdown;
  - quiz.

### 11.16 Profile

Mostra:

- header e quick stats;
- cards de streak, XP, nivel e treinos;
- evolucao de peso;
- historico recente;
- recordes pessoais;
- minhas academias;
- meus personais;
- secao de conta.

Acoes:

- editar peso;
- logout;
- switch de contexto quando admin.

### 11.17 More

Atalhos comuns:

- academias;
- personais;
- pagamentos;
- assinatura premium.

Itens extras para admin:

- estatisticas;
- configuracoes;
- aprender;
- theme-test.

## 12. Experiencia da academia (`gym`)

### 12.1 Gating e shell

Tabs do shell:

- `dashboard`
- `students`
- `equipment`
- `financial`
- `more`

Tabs adicionais via query:

- `stats`
- `settings`
- `gamification` (admin only)

Controle:

- somente `GYM` ou `ADMIN`;
- `PENDING` cai em escolha/onboarding.

### 12.2 Onboarding da academia

Wizard em 4 etapas. Tambem suporta `?mode=new` para criar unidade adicional.

#### Etapa 1

- nome
- telefone
- email

#### Etapa 2

- CEP com lookup ViaCEP
- endereco
- numero
- complemento
- cidade
- estado

#### Etapa 3

- CNPJ opcional

#### Etapa 4

- selecao de equipamentos com quantidade

Redirect:

- dashboard normal;
- ou assinatura se houver referral.

### 12.3 Dashboard

Blocos:

- alerta de `past_due`;
- CTA de check-in;
- cards de check-ins hoje, alunos ativos, equipamentos em uso e novos alunos;
- lista de check-ins recentes;
- uso/manutencao de equipamentos;
- top alunos do mes;
- widgets semanais.

### 12.4 Students list

Funcao:

- CRM operacional da academia.

Blocos e acoes:

- busca;
- filtro;
- grid de alunos;
- avatar, nome, email, status;
- streak;
- taxa de frequencia;
- total de visitas;
- peso atual;
- personal atribuido;
- abertura do detalhe do aluno;
- CTA de adicionar aluno.

### 12.5 Add student modal

Fluxo:

- busca aluno por identificador;
- verifica se ja e membro e status atual;
- escolhe plano de membership ou valor manual;
- cria matricula e pagamento pendente;
- orienta aluno a pagar em Profile > Payments para ativar acesso.

### 12.6 Student detail

Tabs:

- `overview`
- `workouts`
- `diet`
- `progress`
- `records`
- `payments`

Capacidades:

- atualizar status de membership;
- atribuir personal;
- abrir editor de treino;
- criar ou editar weekly plan;
- abrir biblioteca de nutricao;
- aplicar plano alimentar;
- marcar refeicoes, agua e alimentos;
- alternar status de pagamento;
- ver progresso e recordes.

Regra importante:

- atribuir personal pela academia exige que o personal esteja afiliado a essa academia.

### 12.7 Equipment

Lista mostra:

- total;
- disponiveis;
- em uso;
- em manutencao;
- busca por nome/tipo/status;
- cards com marca, modelo, serial, status, usuario atual, total de usos, tempo medio, proxima manutencao.

Acoes:

- cadastrar equipamento;
- abrir detalhe.

### 12.8 Equipment detail

Secoes:

- `usage`
- `maintenance`
- `info`

Mostra:

- status atual;
- marca/modelo/serial/tipo;
- editar equipamento;
- abrir manutencao;
- usuario atual e duracao se em uso;
- total de usos;
- media de uso;
- ultima e proxima manutencao;
- historico de manutencao.

### 12.9 Financial

Subtabs principais:

- `overview`
- `payments`
- `coupons`
- `expenses`
- `subscription`
- `ads`

#### Overview

- resumo financeiro;
- receitas;
- despesas;
- lucro;
- mensal recorrente;
- pendencias;
- saques e saldo.

#### Payments

- pagamentos de alunos;
- status `paid`, `pending`, `overdue`, `canceled`, `withdrawn`.

#### Coupons

- CRUD de cupons;
- percentual ou valor fixo;
- max uses;
- expiracao;
- inativacao automatica ao expirar ou atingir limite.

#### Expenses

- despesas operacionais;
- manutencao, equipamento, equipe, aluguel, utilidades e outros.

#### Subscription

- assinatura da academia;
- trial;
- periodo;
- base, preco por aluno e preco por personal;
- total calculado;
- referral em primeira assinatura/trial ativo.

#### Ads

- boost campaigns;
- titulo, descricao, cor primaria, duracao, alcance, cupom/plano vinculado;
- pagamento e status de campanha.

### 12.10 Settings

Blocos:

- perfil e dados da academia;
- endereco;
- telefone;
- email readonly;
- CNPJ;
- chave PIX tipo/valor;
- horarios por dia da semana;
- pagina de planos da academia;
- cartao de equipe;
- conta e logout;
- switch para student quando admin.

### 12.11 Stats

Mostra:

- check-ins por dia;
- horarios populares;
- top equipamentos por uso;
- cards resumidos de performance.

### 12.12 More

Atalhos:

- stats;
- settings;
- assinatura;
- theme-test para admin.

### 12.13 Multiplas academias / unidades

Pagina `Minhas Academias`:

- lista todas as academias do usuario;
- mostra qual esta ativa;
- permite selecionar academia ativa;
- mostra bloqueio de multi-academia quando plano nao permite;
- CTA de criar nova academia quando elegivel.

Regra tecnica atual:

- a academia principal e a mais antiga;
- se a principal tem plano qualificado (`premium` ou `enterprise`), as demais podem ficar ativas;
- se a principal cai para `basic` ou perde assinatura, as outras podem ser suspensas;
- o sistema consegue restaurar assinaturas suspensas caso a principal volte a assinar dentro do periodo.

### 12.14 Gamification

Area admin/gym com:

- nivel e progresso da academia;
- XP;
- streak;
- ranking regional;
- meta mensal de alunos;
- utilizacao de equipamentos;
- conquistas desbloqueadas;
- barra de progresso para proximo nivel.

## 13. Experiencia do personal (`personal`)

### 13.1 Shell

Tabs:

- `dashboard`
- `students`
- `gyms`
- `financial`
- `more`

Tabs extras:

- `settings`
- `stats`

### 13.2 Onboarding

Wizard de 2 etapas:

- etapa 1: nome e telefone;
- etapa 2: bio e flags de atendimento presencial/remoto.

### 13.3 Dashboard

Mostra:

- alertas de `past_due` e `trialing`;
- numero de academias;
- numero de alunos;
- alunos via academia;
- alunos independentes;
- resumo financeiro mensal;
- alunos recentes;
- academias vinculadas.

### 13.4 Students list

Usa variante do `GymStudentsPage`.

Capacidades:

- busca;
- filtro `all`, `independent`, `via gym`;
- filtro por academia;
- cards com contexto;
- CTA de atribuir aluno;
- abrir detalhe do aluno;
- remover vinculacao.

### 13.5 Add personal student modal

Fluxo:

- busca aluno por `@`/email;
- define contexto:
  - independente
  - via academia afiliada
- impede duplicar atribuicao no mesmo contexto;
- cria ou reativa `StudentPersonalAssignment`.

### 13.6 Student detail do personal

Tabs:

- `overview`
- `workouts`
- `diet`
- `progress`
- `records`

Capacidades:

- atribuir treino;
- atribuir dieta;
- remover atribuicao;
- ver overview de perfil;
- acessar weekly plan;
- gerenciar nutricao do aluno;
- abrir biblioteca de alimentacao;
- acompanhar progresso e recordes.

Observacao:

- streak e frequencia aparecem como placeholder `—` nessa tela, mesmo com outras metricas presentes.

### 13.7 Gyms

Funcao:

- vincular personal a academias;
- abrir perfil da academia a partir do contexto do personal.

UI:

- input para vincular academia por `@handle`;
- lista de academias ligadas;
- unlink;
- detail de academia reutilizando `GymProfileView` em variante personal.

### 13.8 Financial

A implementacao ativa do shell do personal usa uma pagina financeira mais completa, com subtabs:

- `overview`
- `payments`
- `coupons`
- `expenses`
- `subscription`
- `ads`

Apesar disso, tambem existe no repo uma implementacao mais simples de componente financeiro do personal. A shell principal atualmente usa a versao completa do app-level wrapper.

Conteudo:

- resumo financeiro;
- pagamentos;
- cupons proprios;
- despesas;
- assinatura do personal;
- impulsionamento.

### 13.9 Settings

Campos principais:

- nome;
- email readonly;
- CREF;
- telefone;
- bio;
- endereco;
- chave PIX;
- flags presencial/remoto;
- CRUD de planos do personal;
- conta e logout.

### 13.10 Personal membership plans

CRUD de planos proprios com:

- nome;
- tipo (`monthly`, `quarterly`, `semi-annual`, `annual`, `trial`);
- preco;
- duracao em dias;
- beneficios.

Regra de UX:

- excluir plano nao remove inscritos atuais; apenas impede novas assinaturas.

### 13.11 Stats

Mostra:

- numero de academias;
- numero total de alunos;
- alunos via academia;
- alunos independentes;
- proporcoes resumidas.

### 13.12 More

Atalhos:

- stats;
- settings;
- assinatura.

## 14. Admin e operacao

### 14.1 Observability dashboard

Guardas:

- depende de feature flag;
- acesso apenas admin.

Dados:

- requests API;
- latencia p50/p95;
- eventos de frontend;
- business events;
- dominios;
- recentes;
- top slow routes;
- top errors.

Endpoints consumidos:

- `/api/admin/observability/summary`
- `/api/admin/observability/routes`
- `/api/admin/observability/errors`

## 15. Backend: visao arquitetural

### 15.1 Padrao geral

O backend mistura:

- rotas organizadas por dominio em `apps/api/src/routes`;
- handlers centrais;
- services de dominio;
- Prisma como camada de persistencia;
- use-cases em partes mais novas;
- webhooks processados em worker;
- caches de curta duracao para listagens e dashboards.

### 15.2 Bootstrap e stores

O frontend usa bootstraps e stores unificados por papel:

- `students/bootstrap`
- `gyms/bootstrap`
- `personals/bootstrap`

O bootstrap retorna payloads compostos por secao e metadados de timing. O frontend usa isso para:

- priorizar carregamento;
- hidratar Zustand;
- evitar round-trips fragmentados.

### 15.3 Workers

`apps/worker` possui:

- `email.worker`
  - welcome email
  - reset password
- `plan-operations.worker`
  - ativacao de treino da biblioteca
  - ativacao de nutricao da biblioteca
- `webhook.worker`
  - processa evento de pagamento via AbacatePay

### 15.4 Cron

`apps/cron` executa `resetStudentWeeklyOverride()` para reset semanal.

### 15.5 Webhook de pagamento

Servico central: `WebhookService.processAbacatePayEvent`.

Ele trata:

- pagamento de membership de academia;
- troca de plano de membership;
- assinatura da academia;
- assinatura do personal;
- assinatura do aluno;
- boost campaign;
- pagamento do aluno para personal.

Efeitos relevantes:

- ativa membership do aluno;
- incrementa aluno ativo da academia;
- sincroniza beneficio enterprise;
- ativa subscription da academia;
- ativa subscription do aluno;
- ativa subscription do personal;
- cria/reativa assignment do personal para aluno apos pagamento;
- converte referral no primeiro pagamento.

## 16. Mapa de API por dominio

### 16.1 Auth

Namespaces importantes:

- `auth/sign-up`
- `auth/sign-in`
- `auth/sign-out`
- `auth/google/start`
- `auth/callback`
- `auth/exchange-one-time-token`
- `auth/session`
- `auth/update-role`

### 16.2 Students

Namespaces importantes:

- `students/onboarding`
- `students/bootstrap`
- `students/profile`
- `students/progress`
- `students/weight`
- `students/weight-history`
- `students/personal-records`
- `students/day-passes`
- `students/friends`
- `students/subscription`
- `students/payments`
- `students/referrals`
- `students/gyms/*`
- `students/memberships/*`
- `students/personals/*`

### 16.3 Gyms

Namespaces importantes:

- `gyms/create`
- `gyms/onboarding`
- `gyms/bootstrap`
- `gyms/profile`
- `gyms/list`
- `gyms/locations`
- `gyms/plans`
- `gyms/members`
- `gyms/students`
- `gyms/equipment`
- `gyms/checkin`
- `gyms/checkout`
- `gyms/payments`
- `gyms/coupons`
- `gyms/expenses`
- `gyms/financial-summary`
- `gyms/stats`
- `gyms/boost-campaigns`
- `gyms/withdraws`

Existe ainda namespace `gym/*` para operacoes mais contextuais:

- `gym/students/[id]/assign-personal`
- `gym/students/[id]/workouts/chat-stream`
- `gym/students/[id]/nutrition/chat-stream`
- `gym/personals/*`
- `gym/boost-campaigns/*`

### 16.4 Personals

Namespaces importantes:

- `personals/onboarding`
- `personals/bootstrap`
- `personals/subscription`
- `personals/membership-plans`
- `personals/students`
- `personals/affiliations`
- `personals/gyms`
- `personals/payments`
- `personals/coupons`
- `personals/expenses`
- `personals/financial-summary`
- `personals/boost-campaigns`

### 16.5 Subscriptions e billing

- `subscriptions/current`
- `subscriptions/create`
- `subscriptions/start-trial`
- `subscriptions/cancel`
- `subscriptions/apply-referral`
- `gym-subscriptions/current`
- `gym-subscriptions/create`
- `gym-subscriptions/start-trial`
- `gym-subscriptions/cancel`
- `gym-subscriptions/apply-referral`
- `gym-subscriptions/simulate-pix`
- `gym-subscriptions/sync-prices`

### 16.6 Workout e nutrition

- `workouts/generate`
- `workouts/chat`
- `workouts/chat-stream`
- `workouts/weekly-plan`
- `workouts/library`
- `workouts/manage`
- `workouts/units`
- `workouts/history`
- `workouts/progress`
- `workouts/completion`
- `nutrition/daily`
- `nutrition/active`
- `nutrition/activate`
- `nutrition/library`
- `nutrition/chat`
- `nutrition/chat-stream`
- `foods/*`
- `exercises/*`

## 17. Modelo de dados e entidades principais

### 17.1 Identidade

- `User`
- `Account`
- `Session`
- `Verification*`

### 17.2 Dominio do aluno

- `Student`
  - dados basicos, genero, telefone, avatar, referralCode, chaves PIX.
- `StudentProfile`
  - altura, peso, goals, equipamento disponivel, preferencias de treino, macros, BMR/TDEE, limitacoes e condicoes medicas.
- `StudentProgress`
  - streak, XP, nivel, metas diarias.
- `WeightHistory`
- `WorkoutHistory`
- `WorkoutProgress`
- `PersonalRecord`
- `DailyNutrition`

### 17.3 Treino e nutricao

- `WeeklyPlan`
- `PlanSlot`
- `Unit`
- `Workout`
- `WorkoutExercise`
- `AlternativeExercise`
- `NutritionPlan`
- `Meal`

O desenho suporta:

- plano semanal;
- biblioteca/template;
- autoria por `STUDENT`, `GYM` ou `PERSONAL`;
- ativacao de plano de biblioteca sobre o plano atual.

### 17.4 Dominio da academia

- `Gym`
- `GymProfile`
- `GymStats`
- `MembershipPlan`
- `GymMembership`
- `DayPass`
- `CheckIn`
- `Equipment`
- `MaintenanceRecord`
- `Payment`
- `Expense`
- `GymCoupon`
- `GymWithdraw`
- `GymSubscription`

### 17.5 Dominio do personal

- `Personal`
- `PersonalSubscription`
- `GymPersonalAffiliation`
- `StudentPersonalAssignment`
- `PersonalMembershipPlan`
- `PersonalStudentPayment`
- `PersonalCoupon`
- `PersonalExpense`

### 17.6 Billing e growth

- `Subscription`
- `SubscriptionPayment`
- `SubscriptionFeature`
- `Referral`
- `StudentWithdraw`
- `BoostCampaign`
- `BoostCampaignEngagement`
- `ProGymAccess`

### 17.7 Observabilidade

- `TelemetryEvent`
- `TelemetryRollupMinute`
- `BusinessEvent`

## 18. Fluxos criticos ponta a ponta

### 18.1 Primeiro login

1. usuario entra por Google;
2. callback sincroniza sessao;
3. se `PENDING`, escolhe papel;
4. papel escolhido direciona onboarding;
5. onboarding cria/atualiza entidade de dominio;
6. usuario entra no shell principal.

### 18.2 Aluno assina o app

1. aluno abre `Payments > Subscription`;
2. escolhe plano/billing period;
3. backend cria `Subscription` em `pending_payment`;
4. gera PIX AbacatePay;
5. modal PIX mostra QR, opcao de referral e polling;
6. webhook confirma;
7. `Subscription` vira `active`;
8. cria `SubscriptionPayment`;
9. referral pode converter comissao.

### 18.3 Trial do aluno

1. aluno elegivel inicia trial;
2. sistema verifica se ja usou trial ou ja assinou;
3. assinatura vira `premium`, `trialing`, 14 dias;
4. `trialStart` fica gravado para impedir novo uso futuro.

### 18.4 Aluno entra em academia

1. aluno escolhe academia/plano;
2. backend cria `GymMembership` `pending`;
3. backend cria `Payment` PIX;
4. modal PIX abre;
5. webhook marca `Payment.paid`;
6. membership vira `active`;
7. academia incrementa alunos ativos;
8. se academia e enterprise, sincroniza beneficio premium do aluno.

### 18.5 Aluno troca de plano na academia

1. aluno escolhe novo plano;
2. backend cria PIX de change-plan;
3. webhook marca pagamento;
4. membership atualiza `planId`, valor e proximo billing.

### 18.6 Aluno assina plano de personal

1. aluno escolhe personal/plano;
2. backend valida personal e plano;
3. aplica cupom se houver;
4. cria `PersonalStudentPayment` `pending`;
5. gera PIX;
6. webhook marca `paid`;
7. cria ou reativa `StudentPersonalAssignment` com `assignedBy = PERSONAL`.

### 18.7 Academia assina plano proprio

1. academia escolhe `basic`, `premium` ou `enterprise`;
2. backend calcula preco:
   - mensal = base + alunos ativos + personais ativos
   - anual = apenas base
3. cria/atualiza `GymSubscription` em `pending`;
4. gera PIX;
5. webhook ativa subscription;
6. sistema reavalia multi-academia;
7. sistema reavalia beneficios enterprise para alunos.

### 18.8 Academia atribui personal a aluno

1. academia abre detalhe do aluno;
2. escolhe personal afiliado;
3. backend valida afiliacao ativa `personalId + gymId`;
4. cria ou reativa assignment `assignedBy = GYM`.

### 18.9 Personal se afilia a academia

1. personal liga academia por handle;
2. backend cria ou reativa `GymPersonalAffiliation`;
3. se academia `premium` ou `enterprise`, grava `discountPercent = 50`;
4. sistema recalcula `PersonalSubscription.effectivePrice`.

### 18.10 Check-in de aluno PRO em academia enterprise

1. academia dispara check-in de aluno;
2. se nao houver membership ativo, backend testa:
   - aluno com assinatura `PRO` ativa;
   - academia com plano `ENTERPRISE` ativo;
3. se ambos verdadeiros, check-in e permitido;
4. registra `ProGymAccess`.

### 18.11 Boost campaign

1. academia ou personal cria campanha com cor, texto, duracao, raio e opcional cupom/plano;
2. gera pagamento PIX;
3. webhook ativa campanha;
4. campanha aparece em discovery/home como patrocinada;
5. clicks e impressoes sao acumulados.

## 19. Regras de negocio e invariantes nao negociaveis

- trial do aluno so pode acontecer uma vez;
- trial da academia dura 14 dias e usa plano `basic` mensal;
- membership da academia so ativa apos webhook de pagamento;
- beneficio enterprise do aluno depende de membership ativa em academia enterprise ativa;
- ao receber beneficio enterprise, assinatura propria do aluno pode ser sobrescrita, mas o fim do periodo proprio deve ser guardado em `ownPeriodEndBackup`;
- ao perder o beneficio enterprise, o sistema deve restaurar o premium proprio se ainda houver periodo valido; senao volta para `free`;
- referral do aluno so vale no primeiro pagamento, em trial ou quando a assinatura esta em contexto de beneficio enterprise;
- comissao de referral e 50% do primeiro pagamento confirmado;
- desconto para quem usa referral e 5%;
- saque de aluno e academia exige minimo de R$ 3,50;
- o sistema considera taxa fixa de R$ 0,80 nos saques/saldos;
- academia so pode atribuir personal que esteja afiliado a ela;
- `StudentPersonalAssignment` e unico por combinacao `studentId + personalId + gymId`;
- cupons podem expirar e podem se auto-inativar ao atingir limite;
- valor final de plano com cupom nao deve cair abaixo de R$ 3,50 nos fluxos de gym/personal student plans;
- usuario com varias academias depende do plano da academia principal para manter as demais ativas;
- check-in aberto no mesmo dia nao pode ser duplicado;
- pagamento do aluno para personal so cria assignment apos confirmacao de pagamento;
- compra de diaria no shell atual nao esta conectada ao billing real ponta a ponta.

## 20. Lacunas e divergencias importantes do estado atual

- o repo contem docs que falam em arquitetura mais "online-only", mas o frontend atual ainda mostra sinais fortes de store unificado/offline-first/prioritized loading;
- o shell do personal tem duas implementacoes financeiras concorrentes; a ativa e a mais completa em `app/personal/_financial/page-content.tsx`;
- referrals para personal nao aparecem fechados ponta a ponta como em alguns docs de produto;
- a modelagem e leitura de `DayPass` existem, mas o fluxo de compra no web atual e local/simulado;
- `PRO`/`network_access` existe em access-control e check-in backend, mas a superficie de produto ainda nao o vende/explora com a mesma clareza que o restante do app;
- o campo `Subscription.plan` do aluno mistura nomes canonicos e nomes de exibicao como `Premium Mensal`, `Premium Anual`, `Pro ...`, o que exige cuidado em qualquer reimplementacao.

## 21. Ordem recomendada para reconstruir o produto

1. identidade, auth Google, sessao e escolha de role;
2. schema Prisma com entidades centrais;
3. shell web dos tres papeis com tabs, header e bottom nav;
4. onboarding de aluno, academia e personal;
5. store unificado/bootstrap por papel;
6. dominio de treino: weekly plan, workout modal, historico, PRs;
7. dominio de nutricao: daily nutrition, biblioteca e plano ativo;
8. finance core: subscriptions, gym membership payments, personal student payments, coupons e PIX modal;
9. discovery: mapas de academias e personais;
10. gestao da academia: alunos, equipamentos, check-in, stats;
11. personal workspace: afiliacoes, alunos e planos proprios;
12. boosts, referrals, saques e access-control avancado;
13. observabilidade, workers e cron;
14. limpeza de duplicidades e consolidacao de arquitetura.

## 22. Arquivos e fontes mais relevantes usados para montar este blueprint

Documentacao:

- `docs/PLATAFORMA_COMPLETA.md`
- `docs/01-architecture/ARQUITETURA_COMPLETA_SISTEMA.md`
- `docs/02-frontend/UI_UX_SYSTEM_DESIGN.md`
- `docs/03-backend/api/API_COMPLETA.md`
- `COMPONENTS_MEGA_REPORT.md`
- `docs/access-control-catalog.md`

Frontend:

- `apps/web/app/student/*`
- `apps/web/app/gym/*`
- `apps/web/app/personal/*`
- `apps/web/components/duo/*`
- `apps/web/components/organisms/*`
- `apps/web/components/templates/layouts/app-layout.tsx`

Backend:

- `apps/api/src/routes/*`
- `apps/api/src/lib/services/*`
- `apps/api/src/lib/utils/subscription.ts`
- `apps/api/src/lib/utils/auto-trial.ts`

Dados e acesso:

- `packages/db/prisma/schema.prisma`
- `packages/access-control/src/features.ts`
- `packages/access-control/src/plans-config.ts`
- `packages/access-control/src/policies.ts`

## 23. Resumo executivo final

GymRats nao e apenas um app de treino. E um sistema de tres faces acopladas:

- o aluno usa treino, dieta, educacao, descoberta e pagamentos;
- a academia opera alunos, equipamentos, cobranca e growth;
- o personal opera carteira propria e afiliacoes.

O coracao do produto e a convergencia entre:

- progresso gamificado;
- IA aplicada a treino e nutricao;
- marketplace local;
- billing recorrente;
- heranca de acesso entre dominios;
- operacao multi-tenant com regras reais de negocio.

Se este sistema fosse refeito do zero, os pontos que nao podem se perder sao:

- shell mobile-first gamificado;
- relacao entre student, gym e personal;
- economia baseada em subscriptions + memberships + referrals + boosts;
- sincronizacao de beneficios enterprise;
- fluxo PIX guiado por modal + webhook;
- modelo de dados rico o suficiente para treino, nutricao, pagamentos e afiliacoes coexistirem sem atalhos.
