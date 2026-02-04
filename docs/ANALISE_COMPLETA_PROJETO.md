# 🏋️ Análise Completa do Projeto GymRats

## 📋 Sumário Executivo

O **GymRats** é uma plataforma completa de fitness gamificada, inspirada no Duolingo, que combina educação, treinamento personalizado e gestão de academias. O projeto utiliza tecnologias modernas e uma arquitetura offline-first robusta para proporcionar uma experiência de usuário excepcional.

---

## 🎯 Visão Geral do Produto

### Conceito Principal

O GymRats é o **"Duolingo da Musculação"** - uma aplicação que transforma o aprendizado e prática de musculação em uma experiência gamificada, educativa e motivadora.

### Proposta de Valor

1. **Gamificação Total**: Sistema de XP, níveis, conquistas, streaks e rankings
2. **Educação Científica**: Lições sobre anatomia, nutrição e ciência do treinamento
3. **Personalização com IA**: Treinos e dietas gerados por IA baseados no perfil do usuário
4. **Gestão Completa**: Sistema para academias gerenciarem alunos, equipamentos e finanças
5. **Experiência Offline-First**: Funciona perfeitamente mesmo sem internet

### Público-Alvo

- **Alunos (Students)**: Pessoas que querem treinar, aprender e evoluir no fitness
- **Academias (Gyms)**: Proprietários e gestores que precisam gerenciar seus negócios

---

## 🛠️ Stack Tecnológica

### Frontend

#### Core
- **Next.js 16.0** - Framework React com App Router e Server-Side Rendering
- **React 19.2** - Biblioteca UI com as features mais recentes
- **TypeScript 5.0** - Tipagem estática forte em todo o projeto
- **Tailwind CSS 4.1** - Framework CSS utility-first para estilização

#### UI Components
- **shadcn/ui** - Componentes UI acessíveis e customizáveis
- **Radix UI** - Primitivos UI acessíveis (base do shadcn)
- **Lucide React** - Biblioteca de ícones moderna
- **Recharts** - Gráficos e visualizações de dados
- **Motion (Framer Motion)** - Animações fluidas e interativas

#### Formulários e Validação
- **React Hook Form** - Gerenciamento de formulários performático
- **Zod** - Validação de schemas TypeScript-first
- **@hookform/resolvers** - Integração entre React Hook Form e Zod

#### State Management
- **Zustand** - Gerenciamento de estado global leve e performático
- **TanStack Query (React Query)** - Gerenciamento de estado assíncrono e cache
- **nuqs** - Query strings type-safe para Next.js

#### Utilitários
- **date-fns** - Manipulação de datas moderna
- **clsx** + **tailwind-merge** - Construção e merge de classes CSS
- **class-variance-authority (CVA)** - Variantes de componentes

#### Offline & PWA
- **IndexedDB (via idb)** - Banco de dados local para dados grandes
- **Service Worker** - Sincronização em background e cache
- **localStorage** - Armazenamento de tokens e flags

### Backend

#### Runtime & Framework
- **Bun** - Runtime JavaScript/TypeScript ultra-rápido (substituto do Node.js)
- **Elysia** - Framework web moderno e performático para Bun
- **@elysiajs/cors** - Plugin de CORS
- **@elysiajs/swagger** - Documentação automática de API
- **@elysiajs/bearer** - Autenticação Bearer token

#### Database & ORM
- **PostgreSQL** - Banco de dados relacional (via Supabase)
- **Prisma 6.19** - ORM moderno com type-safety completo
- **Supabase** - Backend-as-a-Service (PostgreSQL + Auth + Storage)

#### Autenticação
- **Better Auth 1.4.5** - Sistema de autenticação moderno com integração nativa ao Elysia
- **bcryptjs** - Hashing de senhas
- **Google OAuth** - Login social com Google

#### Comunicação
- **Axios** - Cliente HTTP
- **Nodemailer** - Envio de emails

#### Ferramentas de Desenvolvimento
- **Biome** - Linter e formatter ultra-rápido (substituto do ESLint + Prettier)
- **Husky** - Git hooks para qualidade de código
- **TypeScript** - Tipagem em todo o projeto

---

## 🏗️ Arquitetura do Sistema

### Arquitetura Geral

```
┌─────────────────────────────────────────────┐
│           FRONTEND (Next.js)                │
│  - React Components                         │
│  - Zustand Store (State Management)         │
│  - Service Worker (Offline Sync)            │
│  - IndexedDB (Local Storage)                │
└─────────────────────────────────────────────┘
                    ↕ HTTP/REST
┌─────────────────────────────────────────────┐
│           BACKEND (Elysia + Bun)            │
│  - API Routes (REST)                        │
│  - Better Auth (Autenticação)               │
│  - Handlers (Lógica de Negócio)             │
│  - Middleware (Auth, CORS, Logging)         │
└─────────────────────────────────────────────┘
                    ↕ Prisma ORM
┌─────────────────────────────────────────────┐
│      DATABASE (PostgreSQL/Supabase)         │
│  - Usuários, Alunos, Academias              │
│  - Treinos, Exercícios, Nutrição            │
│  - Progresso, Conquistas, Pagamentos        │
└─────────────────────────────────────────────┘
```

### Arquitetura Offline-First

O GymRats implementa uma arquitetura offline-first completa e robusta:

#### Camadas do Sistema Offline

```
1. UI (React Components)
   ↓
2. State Management (Zustand)
   ↓
3. Sync Manager (Detecção Online/Offline)
   ↓
4. Persistência Local (IndexedDB)
   ↓
5. Service Worker (Background Sync)
   ↓
6. API Backend (quando online)
```

#### Fluxo de Dados Offline

1. **Usuário interage** → Componente React
2. **Optimistic Update** → UI atualiza instantaneamente
3. **Sync Manager** → Detecta se está online/offline
4. **Se Online** → Envia para API imediatamente
5. **Se Offline** → Salva na fila do IndexedDB
6. **Service Worker** → Sincroniza quando voltar online
7. **Backend processa** → Retorna confirmação
8. **Store atualiza** → Dados finais do servidor

#### Recursos Offline-First

- ✅ **Command Pattern** com versionamento e dependências
- ✅ **Optimistic Updates** para UI instantânea
- ✅ **Retry Exponencial** com jitter para resiliência
- ✅ **Idempotência** garantida (evita duplicatas)
- ✅ **Background Sync** via Service Worker
- ✅ **Cache em múltiplas camadas** (memória, IndexedDB, localStorage)
- ✅ **Observabilidade local** para debug

---

## 📊 Modelo de Dados (Database Schema)

### Entidades Principais

#### 1. Autenticação e Usuários

**User** (Usuário)
- Informações básicas: email, nome, senha, imagem
- Role: STUDENT, GYM ou ADMIN
- Relacionamentos: Student, Gym[], Sessions, Accounts

**Account** (Contas OAuth)
- Integração com Google OAuth
- Compatibilidade com Better Auth

**Session** (Sessões)
- Tokens de autenticação
- Expiração e metadados (IP, User Agent)

#### 2. Alunos (Students)

**Student** (Aluno)
- Perfil: idade, gênero, telefone, avatar
- Informações de saúde: transgênero, terapia hormonal
- Relacionamentos: Progress, Profile, Workouts, Diets, etc.

**StudentProgress** (Progresso do Aluno)
- XP total, nível atual, XP para próximo nível
- Streak atual e maior streak
- Treinos completados
- Meta diária de XP

**StudentProfile** (Perfil Detalhado)
- Medidas: altura, peso
- Objetivos e preferências de treino
- Metas nutricionais (calorias, macros)
- Limitações físicas e médicas
- Valores metabólicos (BMR, TDEE)

**WeightHistory** (Histórico de Peso)
- Registro temporal do peso
- Notas opcionais

#### 3. Academias (Gyms)

**Gym** (Academia)
- Informações: nome, logo, endereço, CNPJ
- Localização: latitude, longitude
- Rating e avaliações
- Amenidades, horários, fotos
- Plano: basic, premium, enterprise

**GymProfile** (Perfil da Academia)
- Estatísticas: total de alunos, equipamentos
- Gamificação: nível, XP, streaks
- Metas e rankings

**GymStats** (Estatísticas em Tempo Real)
- Check-ins do dia
- Alunos ativos
- Equipamentos em uso
- Métricas semanais e mensais

#### 4. Treinos (Workouts)

**Unit** (Unidade de Treino)
- Agrupamento de workouts (similar ao Duolingo)
- Pode ser global ou personalizado por aluno

**Workout** (Treino)
- Tipo: strength, cardio, flexibility, rest
- Grupo muscular, dificuldade
- XP reward, tempo estimado
- Exercícios associados

**WorkoutExercise** (Exercício do Treino)
- Nome, séries, repetições, descanso
- Dados educacionais: músculos, equipamento, instruções
- Alternativas de exercícios

**WorkoutProgress** (Progresso Parcial)
- Treino em andamento
- Exercícios completados, pulados
- Preferências de cardio

**WorkoutHistory** (Histórico de Treinos)
- Treinos completados
- Duração, volume total
- Feedback e fadiga

**PersonalRecord** (Recordes Pessoais)
- Tipo: max-weight, max-reps, max-volume
- Valor atual e anterior

#### 5. Nutrição

**DietPlan** (Plano de Dieta)
- Calorias e macros totais
- Refeições associadas
- XP reward

**Meal** (Refeição)
- Tipo: breakfast, lunch, dinner, snack
- Calorias e macros
- Ingredientes

**DailyNutrition** (Nutrição Diária)
- Rastreamento diário
- Ingestão de água
- Refeições do dia

**FoodItem** (Item de Comida)
- Banco de dados de alimentos
- Informações nutricionais
- Categorias

**NutritionChatUsage** (Uso do Chat Nutricional)
- Controle de uso do chat com IA
- Limite de mensagens por dia

#### 6. Gamificação

**Achievement** (Conquista)
- Título, descrição, ícone
- Categoria, nível, cor
- Meta e XP reward

**AchievementUnlock** (Conquista Desbloqueada)
- Progresso e data de desbloqueio

#### 7. Academias - Gestão

**GymMembership** (Assinatura de Academia)
- Plano, datas, valor
- Status: active, suspended, canceled
- Auto-renovação

**MembershipPlan** (Plano de Assinatura)
- Tipos: monthly, quarterly, annual, trial
- Preço, duração, benefícios

**DayPass** (Passe Diário)
- Compra de diárias em academias
- QR Code para check-in
- Status: active, used, expired

**CheckIn** (Check-in)
- Registro de entrada/saída
- Duração da visita

**Equipment** (Equipamento)
- Inventário de equipamentos
- Status: available, in-use, maintenance, broken
- Histórico de manutenção
- QR Code para rastreamento

#### 8. Financeiro

**Subscription** (Assinatura do Aluno)
- Plano do GymRats (free, premium, pro)
- Status e renovação

**GymSubscription** (Assinatura da Academia)
- Plano da academia no GymRats
- Limites de alunos e features

**Payment** (Pagamento)
- Histórico de pagamentos
- Método, status, valor

**PaymentMethod** (Método de Pagamento)
- Cartões salvos
- Tipo: credit_card, debit_card, pix

**Expense** (Despesa)
- Despesas da academia
- Categorias e valores

#### 9. Social

**Friendship** (Amizade)
- Conexões entre alunos
- Status: pending, accepted, blocked

---

## 🎨 UI/UX Design

### Design System

#### Paleta de Cores (Inspirada no Duolingo)

- **Verde Principal**: `#58CC02` - Ações positivas, progresso
- **Azul**: `#1CB0F6` - Informações, links
- **Laranja**: `#FF9600` - Alertas, atenção
- **Vermelho**: `#FF4B4B` - Erros, ações destrutivas
- **Amarelo**: `#FFC800` - Destaques, conquistas
- **Roxo**: `#CE82FF` - Premium, especial

#### Tipografia

- **DM Sans** - Corpo de texto
- **Space Grotesk** - Títulos e destaques

#### Componentes UI

Todos os componentes são baseados no **shadcn/ui** com customizações:

- Buttons, Cards, Dialogs, Dropdowns
- Forms (Input, Select, Checkbox, Radio)
- Navigation (Tabs, Menu, Breadcrumb)
- Feedback (Toast, Alert, Progress)
- Data Display (Table, Badge, Avatar)
- Overlays (Modal, Popover, Tooltip)

### Responsividade

- 📱 **Mobile First**: Design otimizado para mobile
- 📱 **Tablet**: 768px+
- 💻 **Desktop**: 1024px+
- 🖥️ **Large Desktop**: 1440px+

### Navegação

#### Para Alunos

- **Bottom Navigation** (Mobile): Home, Learn, Workout, Profile
- **Header** (Desktop): Logo, Navigation, User Menu
- **Tabs**: Organização de conteúdo em seções

#### Para Academias

- **Sidebar** (Desktop): Dashboard, Alunos, Equipamentos, Financeiro, etc.
- **Mobile Menu**: Drawer lateral

---

## 🔌 APIs e Endpoints

### Estrutura Modular

O backend foi migrado de Next.js API Routes para **Elysia + Bun** com rotas modulares:

```
/api
├── /auth              → Autenticação (Better Auth)
├── /users             → Gerenciamento de usuários
├── /students          → Dados de alunos
├── /gyms              → Dados de academias
├── /workouts          → Treinos e exercícios
├── /nutrition         → Nutrição e dietas
├── /foods             → Banco de dados de alimentos
├── /exercises         → Exercícios educacionais
├── /subscriptions     → Assinaturas de alunos
├── /gym-subscriptions → Assinaturas de academias
├── /payments          → Pagamentos
├── /payment-methods   → Métodos de pagamento
└── /memberships       → Assinaturas de academias
```

### Principais Endpoints

#### Autenticação (`/api/auth`)

- `POST /sign-up` - Criar conta
- `POST /sign-in` - Login
- `POST /sign-out` - Logout
- `GET /session` - Verificar sessão
- `POST /update-role` - Atualizar role do usuário

#### Alunos (`/api/students`)

- `GET /student` - Dados do aluno
- `GET /progress` - Progresso (XP, streaks)
- `GET /profile` - Perfil detalhado
- `PUT /profile` - Atualizar perfil
- `GET /weight` - Histórico de peso
- `POST /weight` - Adicionar peso
- `GET /personal-records` - Recordes pessoais
- `GET /day-passes` - Passes diários
- `GET /friends` - Amigos

#### Academias (`/api/gyms`)

- `GET /locations` - Academias próximas
- `GET /:id` - Detalhes da academia
- `GET /:id/students` - Alunos da academia
- `GET /:id/equipment` - Equipamentos
- `GET /:id/stats` - Estatísticas

#### Treinos (`/api/workouts`)

- `GET /units` - Unidades de treino
- `GET /history` - Histórico de treinos
- `POST /complete` - Completar treino
- `GET /progress/:workoutId` - Progresso parcial
- `PUT /progress/:workoutId` - Atualizar progresso

#### Nutrição (`/api/nutrition`)

- `GET /daily` - Nutrição do dia
- `POST /daily` - Registrar refeição
- `PUT /water` - Atualizar água

#### Alimentos (`/api/foods`)

- `GET /search` - Buscar alimentos
- `GET /:id` - Detalhes do alimento

### Autenticação e Autorização

#### Better Auth Integration

O projeto usa **Better Auth** com integração nativa ao Elysia:

```typescript
// Montar handler do Better Auth
app.mount(auth.handler)

// Middleware via macros (type-safe)
app.get('/profile', ({ user, studentId }) => {
  // user e studentId já disponíveis
}, {
  requireStudent: true // Macro de autenticação
})
```

#### Macros de Autenticação

- **requireAuth** - Requer usuário autenticado
- **requireStudent** - Requer role STUDENT ou ADMIN
- **requireGym** - Requer role GYM ou ADMIN
- **requireAdmin** - Requer role ADMIN

### Documentação Swagger

Acesse a documentação interativa em:
- **Swagger UI**: `http://localhost:3000/api-docs`
- **OpenAPI JSON**: `http://localhost:3000/api/swagger`

---

## 🎮 Funcionalidades Principais

### Para Alunos

#### 1. Dashboard
- Visão geral do progresso diário
- Streak atual e XP ganho hoje
- Acesso rápido a treinos, cardio e dieta
- Personalização com IA

#### 2. Learning Path (Caminho de Aprendizado)
- Estrutura gamificada similar ao Duolingo
- Unidades e lições progressivas
- Desbloqueio gradual de conteúdo
- Sistema de XP e recompensas

#### 3. Treinos
- **Programas Personalizados**: Adaptados ao nível e objetivos
- **Múltiplas Modalidades**: Musculação, cardio, funcional
- **Análise de Postura**: Feedback em tempo real (planejado)
- **Histórico Completo**: Todos os treinos registrados
- **Recordes Pessoais**: Acompanhamento de PRs
- **Progresso Parcial**: Salvar treino em andamento

#### 4. Nutrição
- **Rastreamento de Macros**: Calorias, proteínas, carboidratos, gorduras
- **Planos de Dieta**: Dietas personalizadas
- **Busca de Alimentos**: Banco de dados extenso
- **Gerador de Dieta com IA**: Planos alimentares personalizados
- **Chat Nutricional**: Assistente de IA para dúvidas (com limite diário)

#### 5. Educação
- **Anatomia Interativa**: Explorar músculos e funções
- **Lições Científicas**: Hipertrofia, nutrição, recuperação
- **Quizzes**: Testes de conhecimento
- **Explorador de Músculos**: Visualização de grupos musculares

#### 6. Academias
- **Mapa de Academias**: Encontrar academias parceiras
- **Compra de Diárias**: Sistema de day pass
- **QR Code**: Check-in rápido
- **Planos de Assinatura**: Gerenciamento de planos

#### 7. Social
- **Amigos**: Conectar com outros usuários
- **Rankings**: Competir em rankings semanais/mensais
- **Desafios**: Participar de desafios comunitários

#### 8. Perfil
- **Informações Pessoais**: Dados básicos e foto
- **Objetivos**: Definir e acompanhar objetivos
- **Estatísticas**: Progresso detalhado
- **Fotos de Progresso**: Registro visual
- **Conquistas**: Badges desbloqueadas

### Para Academias

#### 1. Dashboard
- Métricas em tempo real
- Check-ins do dia
- Alunos ativos
- Equipamentos em uso
- Novos membros

#### 2. Gestão de Alunos
- Lista completa de alunos
- Perfil detalhado de cada aluno
- Histórico de treinos
- Frequência e retenção
- Atribuição de treinadores

#### 3. Gestão de Equipamentos
- Inventário completo
- Status em tempo real (disponível, em uso, manutenção)
- Histórico de uso
- Agendamento de manutenção
- QR codes para rastreamento

#### 4. Financeiro
- Receitas e despesas
- Pagamentos pendentes
- Planos de assinatura
- Relatórios financeiros
- Cupons e descontos

#### 5. Estatísticas
- Análises detalhadas
- Taxa de retenção
- Crescimento de membros
- Utilização de equipamentos
- Horários de pico

#### 6. Configurações
- Perfil da academia
- Planos e preços
- Configurações de gamificação
- Integrações

---

## 🔐 Segurança

### Autenticação

- **Better Auth** com sessões seguras
- **Hashing de senhas** com bcryptjs
- **OAuth Google** para login social
- **Tokens JWT** para API
- **Cookies HTTP-only** para sessões

### Autorização

- **Role-Based Access Control (RBAC)**
  - STUDENT: Acesso a features de aluno
  - GYM: Acesso a gestão de academia
  - ADMIN: Acesso total

### Proteção de Dados

- **Validação de entrada** com Zod em todas as APIs
- **Sanitização** de dados do usuário
- **CORS** configurado corretamente
- **Rate limiting** (planejado)
- **Idempotência** para evitar duplicatas

### Privacidade

- **LGPD Compliance** (planejado)
- **Dados sensíveis** criptografados
- **Logs de auditoria** (planejado)

---

## 🚀 Performance e Otimizações

### Frontend

- **Code Splitting** automático do Next.js
- **Lazy Loading** de componentes
- **Image Optimization** com Next.js Image
- **Memoization** com React.memo e useMemo
- **Virtual Scrolling** para listas grandes (planejado)

### Backend

- **Bun Runtime** - 3x mais rápido que Node.js
- **Elysia Framework** - Performance otimizada
- **Connection Pooling** do Prisma
- **Query Optimization** com índices no banco
- **Caching** em múltiplas camadas

### Offline-First

- **IndexedDB** para dados grandes
- **Service Worker** para cache inteligente
- **Background Sync** para sincronização
- **Optimistic Updates** para UI instantânea

### Métricas Esperadas

- **Time to Interactive**: < 2s
- **First Contentful Paint**: < 1s
- **API Response Time**: < 100ms (média)
- **Offline Capability**: 100% funcional

---

## 📦 Estrutura de Pastas

```
gymrats/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes (legacy, sendo migrado)
│   ├── auth/                     # Páginas de autenticação
│   ├── student/                  # Área do aluno
│   ├── gym/                      # Área da academia
│   ├── welcome/                  # Onboarding
│   ├── layout.tsx                # Layout raiz
│   └── page.tsx                  # Página inicial
│
├── server/                       # Backend Elysia
│   ├── index.ts                  # Entry point
│   ├── app.ts                    # Configuração do app
│   ├── custom-server.ts          # Servidor customizado
│   ├── plugins/                  # Plugins Elysia
│   │   ├── auth.ts               # Better Auth
│   │   ├── auth-macro.ts         # Macros de auth
│   │   ├── auth-roles.ts         # Macros de roles
│   │   ├── cors.ts               # CORS
│   │   ├── db.ts                 # Prisma
│   │   └── request-logger.ts    # Logging
│   ├── routes/                   # Rotas por domínio
│   │   ├── auth.ts
│   │   ├── students.ts
│   │   ├── gyms.ts
│   │   ├── workouts.ts
│   │   └── ...
│   ├── handlers/                 # Handlers de negócio
│   └── utils/                    # Utilitários
│
├── components/                   # Componentes React
│   ├── ui/                       # Componentes base (shadcn)
│   ├── achievement-card.tsx
│   ├── ai-workout-generator.tsx
│   ├── app-header.tsx
│   ├── app-bottom-nav.tsx
│   └── ...
│
├── lib/                          # Bibliotecas e utilitários
│   ├── types.ts                  # Tipos TypeScript
│   ├── db.ts                     # Prisma Client
│   ├── auth-config.ts            # Configuração Better Auth
│   ├── offline/                  # Sistema offline-first
│   │   ├── sync-manager.ts       # Gerenciador de sync
│   │   ├── command-pattern.ts    # Command pattern
│   │   ├── indexeddb-storage.ts  # Storage IndexedDB
│   │   └── ...
│   └── utils.ts                  # Funções utilitárias
│
├── stores/                       # Zustand stores
│   ├── student-unified.store.ts  # Store unificado do aluno
│   ├── gym.store.ts              # Store da academia
│   └── ...
│
├── hooks/                        # Custom hooks
│   ├── use-mobile.ts
│   ├── use-toast.ts
│   ├── use-student-initializer.ts
│   └── ...
│
├── contexts/                     # React contexts
│
├── prisma/                       # Prisma ORM
│   ├── schema.prisma             # Schema do banco
│   └── migrations/               # Migrações
│
├── public/                       # Arquivos estáticos
│   ├── sw.js                     # Service Worker
│   ├── icon.svg                  # Logo
│   └── ...
│
├── docs/                         # Documentação
│   ├── ARQUITETURA_COMPLETA_SISTEMA.md
│   ├── plan.md
│   ├── SEED_DATABASE.md
│   └── ...
│
├── scripts/                      # Scripts utilitários
│
├── .env                          # Variáveis de ambiente
├── package.json                  # Dependências
├── tsconfig.json                 # Config TypeScript
├── next.config.mjs               # Config Next.js
├── tailwind.config.ts            # Config Tailwind
├── biome.json                    # Config Biome
└── README.md                     # Documentação principal
```

---

## 🔄 Fluxos de Trabalho

### Fluxo de Cadastro e Onboarding

1. Usuário acessa `/welcome`
2. Escolhe tipo: Aluno ou Academia
3. Cria conta (email/senha ou Google OAuth)
4. Completa onboarding:
   - **Aluno**: Objetivos, medidas, preferências
   - **Academia**: Dados da academia, plano
5. Redirecionado para dashboard apropriado

### Fluxo de Treino (Aluno)

1. Aluno acessa Learning Path
2. Seleciona unidade desbloqueada
3. Escolhe workout
4. Inicia treino:
   - Escolhe preferência de cardio (antes/depois/nenhum)
   - Executa exercícios um por um
   - Registra séries, reps, peso
   - Pode pular ou escolher alternativas
5. Completa treino:
   - Ganha XP
   - Atualiza streak
   - Salva no histórico
   - Desbloqueia próximo workout
6. Dados sincronizados (online/offline)

### Fluxo de Nutrição (Aluno)

1. Aluno acessa Nutrition
2. Visualiza metas diárias
3. Adiciona refeições:
   - Busca alimentos no banco de dados
   - Ou usa gerador de dieta com IA
4. Registra água consumida
5. Acompanha progresso de macros
6. Dados sincronizados

### Fluxo de Check-in (Academia)

1. Aluno chega na academia
2. Escaneia QR code ou usa app
3. Sistema registra check-in
4. Academia vê aluno ativo no dashboard
5. Ao sair, registra check-out
6. Duração calculada automaticamente

### Fluxo de Gestão de Equipamentos (Academia)

1. Academia adiciona equipamento
2. Gera QR code único
3. Aluno escaneia para usar
4. Status muda para "em uso"
5. Ao terminar, libera equipamento
6. Sistema rastreia uso e manutenção

---

## 🧪 Testes e Qualidade

### Ferramentas

- **Biome** - Linting e formatting
- **TypeScript** - Type checking
- **Husky** - Git hooks para qualidade

### Estratégia de Testes (Planejado)

- **Unit Tests**: Vitest
- **Integration Tests**: Playwright
- **E2E Tests**: Playwright
- **API Tests**: Supertest

---

## 🚀 Deploy e Infraestrutura

### Ambientes

- **Desenvolvimento**: `localhost:3000`
- **Staging**: (planejado)
- **Produção**: (planejado)

### Stack de Deploy Recomendada

- **Frontend**: Vercel (Next.js otimizado)
- **Backend**: Fly.io ou Railway (Bun + Elysia)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **CDN**: Vercel Edge Network

### Variáveis de Ambiente

```env
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=...

# OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Email
EMAIL_USER=...
EMAIL_PASSWORD=...

# IA
DEEPSEEK_API_KEY=...
```

---

## 📈 Roadmap e Próximos Passos

### Em Desenvolvimento

- ✅ Arquitetura offline-first completa
- ✅ Sistema de autenticação com Better Auth
- ✅ Migração para Bun + Elysia
- ✅ UI completa para alunos e academias
- 🚧 Integração com IA (DeepSeek)
- 🚧 Análise de postura com IA
- 🚧 Sistema de pagamentos (Stripe)

### Planejado

- 📋 Notificações push
- 📋 Modo offline completo (PWA)
- 📋 App mobile nativo (React Native)
- 📋 Integração com wearables
- 📋 Marketplace de treinos
- 📋 Live classes
- 📋 Comunidade e fóruns
- 📋 Certificações e badges NFT

---

## 💡 Diferenciais Técnicos

### 1. Arquitetura Offline-First de Nível Empresarial

- Command Pattern com versionamento
- Retry exponencial com jitter
- Idempotência garantida
- Background Sync via Service Worker
- Observabilidade local para debug

### 2. Performance Excepcional

- Bun (3x mais rápido que Node.js)
- Elysia (framework otimizado)
- IndexedDB para dados grandes
- Carregamento prioritizado dinâmico
- Deduplicação de requisições

### 3. Type Safety Completo

- TypeScript em 100% do código
- Prisma para type-safe database
- Zod para validação runtime
- Better Auth type-safe

### 4. Developer Experience

- Biome (linting ultra-rápido)
- Hot reload instantâneo
- Swagger automático
- Git hooks para qualidade

### 5. Escalabilidade

- Arquitetura modular
- Rotas específicas (não monolíticas)
- Cache em múltiplas camadas
- Connection pooling
- Preparado para microservices

---

## 🎓 Conceitos Avançados Implementados

### 1. Command Pattern

Transforma ações em objetos explícitos que podem ser:
- Logados
- Versionados
- Reexecutados
- Ordenados por dependências

### 2. Optimistic Updates

Atualiza UI imediatamente, antes da confirmação do servidor, para UX instantânea.

### 3. Event Sourcing (Parcial)

Logs de comandos permitem replay e auditoria de ações.

### 4. CQRS (Command Query Responsibility Segregation)

Separação entre comandos (write) e queries (read).

### 5. Repository Pattern

Abstração de acesso a dados via Prisma.

### 6. Middleware Pattern

Plugins Elysia para cross-cutting concerns (auth, logging, CORS).

### 7. Macro Pattern (Elysia)

Middleware type-safe e reutilizável.

---

## 📚 Recursos e Referências

### Documentação Oficial

- [Next.js](https://nextjs.org/docs)
- [React](https://react.dev)
- [Elysia](https://elysiajs.com)
- [Bun](https://bun.sh)
- [Prisma](https://www.prisma.io/docs)
- [Better Auth](https://www.better-auth.com)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)

### Inspirações

- **Duolingo** - Gamificação e learning path
- **MyFitnessPal** - Rastreamento nutricional
- **Strong** - App de treino
- **Strava** - Social fitness

---

## 🤝 Contribuindo

### Padrões de Código

- TypeScript com tipagem forte
- Princípios SOLID e Clean Code
- Componentes pequenos e focados
- Usar shadcn/ui quando possível
- Documentar funções complexas
- Escrever código testável

### Convenção de Commits

Seguir [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: adiciona nova funcionalidade
fix: corrige bug
docs: atualiza documentação
style: formatação de código
refactor: refatoração sem mudança de comportamento
test: adiciona ou corrige testes
chore: tarefas de manutenção
```

---

## 📝 Conclusão

O **GymRats** é um projeto ambicioso e tecnicamente robusto que combina:

✅ **Produto inovador** - Gamificação + Educação + Gestão
✅ **Arquitetura moderna** - Offline-first, type-safe, performático
✅ **Stack de ponta** - Bun, Elysia, Next.js, Prisma, Better Auth
✅ **UX excepcional** - Rápido, responsivo, funciona offline
✅ **Escalabilidade** - Preparado para crescimento

O projeto demonstra conhecimento avançado em:
- Arquitetura de sistemas distribuídos
- Padrões de design (Command, Repository, CQRS)
- Performance e otimização
- Type safety e DX
- Offline-first e PWA
- Gamificação e UX

---

**Desenvolvido com 💚 para transformar vidas através do fitness**
