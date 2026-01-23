# 🏋️ GymRats - O Duolingo da Musculação

<div align="center">

![GymRats Logo](public/icon.svg)

**Transforme seu treino em uma jornada gamificada. Aprenda, evolua e conquiste seus objetivos fitness.**

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)

</div>

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Características Principais](#-características-principais)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Instalação](#-instalação)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Funcionalidades](#-funcionalidades)
- [Tipos de Usuário](#-tipos-de-usuário)
- [Arquitetura](#-arquitetura)
- [Contribuindo](#-contribuindo)

---

## 🎯 Sobre o Projeto

O **GymRats** é uma plataforma inovadora que combina gamificação, educação e gestão de academias em uma única aplicação. Inspirado no conceito do Duolingo, o aplicativo transforma o aprendizado e prática de musculação em uma experiência envolvente e motivadora.

### Objetivos

- **Gamificar o treino**: Sistema de XP, níveis, conquistas e sequências diárias
- **Educar**: Lições interativas sobre anatomia, nutrição e ciência do treinamento
- **Personalizar**: Treinos e dietas gerados por IA baseados no perfil do usuário
- **Gerenciar**: Sistema completo de gestão para academias e seus alunos

---

## ✨ Características Principais

### 🎮 Sistema de Gamificação

- **Sistema de XP**: Ganhe pontos de experiência completando treinos, dietas e lições
- **Níveis e Progressão**: Suba de nível conforme acumula XP
- **Sequências (Streaks)**: Mantenha sua sequência diária de treinos
- **Conquistas**: Desbloqueie badges e conquistas especiais
- **Rankings**: Compita com amigos em rankings semanais e mensais
- **Desafios**: Participe de desafios comunitários e ganhe recompensas

### 💪 Treinamento

- **Programas Personalizados**: Treinos adaptados ao seu nível e objetivos
- **Múltiplas Modalidades**: 
  - Musculação tradicional
  - Cardio (corrida, natação, ciclismo, etc.)
  - Exercícios funcionais
- **Análise de Postura**: Sistema de análise de forma e correção de exercícios
- **Histórico Completo**: Acompanhe todos os seus treinos e progresso
- **Recordes Pessoais**: Registre e acompanhe seus PRs

### 🍎 Nutrição

- **Rastreamento de Macros**: Acompanhe calorias, proteínas, carboidratos e gorduras
- **Planos de Dieta**: Dietas personalizadas baseadas em seus objetivos
- **Busca de Alimentos**: Banco de dados extenso de alimentos e valores nutricionais
- **Gerador de Dieta com IA**: Crie planos alimentares personalizados

### 📚 Educação

- **Anatomia Interativa**: Explore músculos, funções e exercícios relacionados
- **Lições Científicas**: Aprenda sobre hipertrofia, nutrição e recuperação
- **Quizzes**: Teste seu conhecimento com quizzes interativos
- **Explorador de Músculos**: Visualize grupos musculares e exercícios

### 🏢 Gestão para Academias

- **Dashboard Completo**: Visão geral em tempo real da academia
- **Gestão de Alunos**: Controle completo de membros, check-ins e frequência
- **Gestão de Equipamentos**: Rastreamento de equipamentos, uso e manutenção
- **Financeiro**: Controle de pagamentos, planos e receitas
- **Estatísticas**: Análises detalhadas de performance e retenção
- **Gamificação para Academias**: Sistema de XP e rankings para academias

### 🗺️ Integração com Academias

- **Mapa de Academias**: Encontre academias parceiras próximas
- **Compra de Diárias**: Sistema de day pass para academias
- **QR Code**: Check-in rápido com QR code
- **Planos de Assinatura**: Gerenciamento de planos mensais, trimestrais e anuais

---

## 🛠️ Tecnologias Utilizadas

### Core

- **[Next.js 16.0](https://nextjs.org/)** - Framework React com Server-Side Rendering
- **[React 19.2](https://reactjs.org/)** - Biblioteca UI
- **[TypeScript 5.0](https://www.typescriptlang.org/)** - Tipagem estática
- **[Tailwind CSS 4.1](https://tailwindcss.com/)** - Framework CSS utility-first

### UI Components

- **[shadcn/ui](https://ui.shadcn.com/)** - Componentes UI acessíveis e customizáveis
- **[Radix UI](https://www.radix-ui.com/)** - Primitivos UI acessíveis
- **[Lucide React](https://lucide.dev/)** - Biblioteca de ícones
- **[Recharts](https://recharts.org/)** - Gráficos e visualizações

### Formulários e Validação

- **[React Hook Form](https://react-hook-form.com/)** - Gerenciamento de formulários
- **[Zod](https://zod.dev/)** - Validação de schemas TypeScript-first
- **[@hookform/resolvers](https://github.com/react-hook-form/resolvers)** - Resolvers para validação

### Utilitários

- **[date-fns](https://date-fns.org/)** - Manipulação de datas
- **[clsx](https://github.com/lukeed/clsx)** - Construção de classes CSS
- **[tailwind-merge](https://github.com/dcastil/tailwind-merge)** - Merge de classes Tailwind
- **[class-variance-authority](https://cva.style/)** - Variantes de componentes

### Outros

- **[next-themes](https://github.com/pacocoursey/next-themes)** - Suporte a temas (claro/escuro)
- **[Sonner](https://sonner.emilkowal.ski/)** - Sistema de notificações toast
- **[Vercel Analytics](https://vercel.com/analytics)** - Analytics

---

## 📁 Estrutura do Projeto

```
fitness-app-clone/
├── app/                      # App Router do Next.js
│   ├── auth/                 # Autenticação
│   │   ├── login/           # Página de login
│   │   └── register/        # Página de registro
│   ├── gym/                  # Área da academia
│   │   ├── dashboard/       # Dashboard principal
│   │   ├── students/        # Gestão de alunos
│   │   ├── equipment/       # Gestão de equipamentos
│   │   ├── financial/       # Gestão financeira
│   │   ├── stats/           # Estatísticas
│   │   └── settings/        # Configurações
│   ├── student/              # Área do aluno
│   ├── workout/              # Páginas de treino
│   ├── lesson/               # Lições educacionais
│   ├── onboarding/           # Onboarding inicial
│   ├── welcome/              # Página de boas-vindas
│   ├── layout.tsx            # Layout raiz
│   └── page.tsx              # Página inicial
│
├── components/               # Componentes React
│   ├── ui/                   # Componentes UI base (shadcn/ui)
│   ├── achievement-card.tsx
│   ├── ai-workout-generator.tsx
│   ├── ai-diet-generator.tsx
│   ├── app-header.tsx
│   ├── app-bottom-nav.tsx
│   ├── cardio-tracker.tsx
│   ├── diet-page.tsx
│   ├── educational-lessons.tsx
│   ├── gym-map.tsx
│   ├── learning-path.tsx
│   ├── muscle-explorer.tsx
│   ├── nutrition-tracker.tsx
│   ├── profile-page.tsx
│   └── ...                   # Outros componentes
│
├── lib/                      # Utilitários e dados
│   ├── types.ts              # Definições de tipos TypeScript
│   ├── mock-data.ts          # Dados mockados
│   ├── gym-mock-data.ts      # Dados mockados de academias
│   ├── educational-data.ts   # Dados educacionais
│   ├── functional-exercises-data.ts
│   ├── calorie-calculator.ts
│   ├── posture-analysis.ts
│   ├── social-data.ts
│   └── utils.ts              # Funções utilitárias
│
├── hooks/                    # Custom hooks
│   ├── use-mobile.ts
│   └── use-toast.ts
│
├── public/                   # Arquivos estáticos
│   ├── icon.svg
│   ├── *.png                 # Ícones e imagens
│   └── *.jpg                 # Imagens de placeholder
│
├── styles/                   # Estilos globais
│   └── globals.css
│
├── components.json           # Configuração do shadcn/ui
├── next.config.mjs           # Configuração do Next.js
├── tsconfig.json             # Configuração do TypeScript
├── package.json              # Dependências e scripts
└── README.md                 # Este arquivo
```

---

## 🚀 Instalação

### Pré-requisitos

- **Node.js** 18+ ou superior
- **npm**, **yarn** ou **pnpm** (gerenciador de pacotes)

### Passos

1. **Clone o repositório**
   ```bash
   git clone <url-do-repositorio>
   cd fitness-app-clone
   ```

2. **Instale as dependências**
   ```bash
   npm install
   # ou
   yarn install
   # ou
   pnpm install
   ```

3. **Configure as variáveis de ambiente** (se necessário)
   ```bash
   # Crie um arquivo .env.local na raiz do projeto
   # Adicione suas variáveis de ambiente aqui
   ```

4. **Execute o servidor de desenvolvimento**
   ```bash
   npm run dev
   # ou
   yarn dev
   # ou
   pnpm dev
   ```

5. **Acesse a aplicação**
   ```
   http://localhost:3000
   ```

---

## 📜 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento

# Build
npm run build        # Cria build de produção

# Produção
npm run start        # Inicia servidor de produção

# Linting
npm run lint         # Executa ESLint
```

---

## 🎨 Funcionalidades Detalhadas

### Para Alunos

#### 🏠 Dashboard Principal
- Visão geral do progresso diário
- Sequência atual e XP ganho hoje
- Acesso rápido a treinos, cardio e dieta
- Personalização com IA

#### 💪 Treinamento
- **Learning Path**: Caminho de aprendizado gamificado
- **Unidades e Lições**: Estrutura similar ao Duolingo
- **Exercícios Detalhados**: Séries, repetições, descanso
- **Análise de Forma**: Feedback em tempo real
- **Histórico**: Todos os treinos realizados
- **Recordes Pessoais**: Acompanhamento de PRs

#### ❤️ Cardio e Funcional
- Rastreamento de atividades cardiovasculares
- Exercícios funcionais categorizados
- Cálculo de calorias queimadas
- Histórico de sessões

#### 🍎 Nutrição
- Rastreamento diário de macros
- Planos de dieta personalizados
- Busca de alimentos
- Gerador de dieta com IA
- Histórico nutricional

#### 📚 Educação
- **Explorador de Músculos**: Anatomia interativa
- **Lições Científicas**: Conteúdo educacional
- **Quizzes**: Testes de conhecimento
- Sistema de XP por lições completadas

#### 🗺️ Academias
- Mapa de academias parceiras
- Compra de diárias (day pass)
- QR code para check-in
- Histórico de visitas

#### 💳 Pagamentos
- Gestão de assinaturas
- Histórico de pagamentos
- Métodos de pagamento
- Renovação automática

#### 👤 Perfil
- Informações pessoais
- Objetivos e preferências
- Estatísticas detalhadas
- Fotos de progresso
- Conquistas desbloqueadas

### Para Academias

#### 📊 Dashboard
- Métricas em tempo real
- Check-ins do dia
- Alunos ativos
- Equipamentos em uso
- Novos membros

#### 👥 Gestão de Alunos
- Lista completa de alunos
- Perfil detalhado de cada aluno
- Histórico de treinos
- Frequência e retenção
- Atribuição de treinadores

#### 🏋️ Gestão de Equipamentos
- Inventário completo
- Status em tempo real (disponível, em uso, manutenção)
- Histórico de uso
- Agendamento de manutenção
- QR codes para rastreamento

#### 💰 Financeiro
- Receitas e despesas
- Pagamentos pendentes
- Planos de assinatura
- Relatórios financeiros
- Cupons e descontos

#### 📈 Estatísticas
- Análises detalhadas
- Taxa de retenção
- Crescimento de membros
- Utilização de equipamentos
- Horários de pico

#### ⚙️ Configurações
- Perfil da academia
- Planos e preços
- Configurações de gamificação
- Integrações

---

## 👥 Tipos de Usuário

### 🎓 Aluno (Student)
Usuários que utilizam a plataforma para treinar, aprender e acompanhar seu progresso.

**Recursos:**
- Treinos personalizados
- Rastreamento de progresso
- Sistema de gamificação
- Educação sobre fitness
- Integração com academias

### 🏢 Academia (Gym)
Proprietários e gestores de academias que utilizam a plataforma para gerenciar seus negócios.

**Recursos:**
- Gestão completa de alunos
- Controle de equipamentos
- Dashboard financeiro
- Estatísticas e relatórios
- Sistema de check-in

---

## 🏗️ Arquitetura

### Design Patterns

- **Component-Based Architecture**: Componentes React reutilizáveis
- **Server-Side Rendering**: Next.js App Router para SSR
- **Type Safety**: TypeScript em todo o projeto
- **Component Library**: shadcn/ui para consistência visual

### Princípios Aplicados

- **SOLID**: Princípios de design orientado a objetos
- **Clean Code**: Código limpo e manutenível
- **DRY**: Don't Repeat Yourself
- **Separation of Concerns**: Separação clara de responsabilidades

### Estrutura de Dados

O projeto utiliza TypeScript com tipagem forte. Todas as interfaces e tipos estão definidos em `lib/types.ts`, garantindo:

- Type safety em todo o código
- Autocomplete inteligente
- Detecção de erros em tempo de desenvolvimento
- Documentação implícita através de tipos

---

## 🎨 Design System

O projeto utiliza um design system baseado no Duolingo, com:

- **Cores Principais**:
  - Verde: `#58CC02` (principal)
  - Azul: `#1CB0F6`
  - Laranja: `#FF9600`
  - Vermelho: `#FF4B4B`
  - Amarelo: `#FFC800`
  - Roxo: `#CE82FF`

- **Componentes UI**: Baseados em shadcn/ui com customizações
- **Tipografia**: DM Sans e Space Grotesk (Google Fonts)
- **Responsividade**: Mobile-first design

---

## 🔐 Autenticação

Atualmente, o projeto utiliza autenticação simulada via `localStorage`. Em produção, recomenda-se implementar:

- Autenticação JWT
- OAuth (Google, Facebook, etc.)
- Refresh tokens
- Proteção de rotas

---

## 📱 Responsividade

O projeto é totalmente responsivo, otimizado para:

- 📱 Mobile (320px+)
- 📱 Tablet (768px+)
- 💻 Desktop (1024px+)
- 🖥️ Large Desktop (1440px+)

---

## 🧪 Estado Atual

### ✅ Implementado

- Interface completa de aluno
- Interface completa de academia
- Sistema de gamificação básico
- Componentes UI completos
- Estrutura de rotas
- Tipagem TypeScript completa
- Dados mockados para desenvolvimento

### 🚧 Em Desenvolvimento / Planejado

- Integração com backend real
- Autenticação completa
- Sistema de pagamentos real
- Análise de postura com IA
- Geração de treinos/dietas com IA
- Notificações push
- Modo offline

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Código

- Use TypeScript com tipagem forte
- Siga os princípios SOLID e Clean Code
- Mantenha componentes pequenos e focados
- Use componentes do shadcn/ui quando possível
- Documente funções complexas
- Escreva código testável

---

## 📄 Licença

Este projeto é privado e proprietário.

---

## 👨‍💻 Desenvolvido com

- ❤️ React & Next.js
- 🎨 Tailwind CSS & shadcn/ui
- 📘 TypeScript
- 🚀 Vercel (deploy recomendado)

---

## 📞 Contato

Para dúvidas ou sugestões, entre em contato através do repositório.

---

<div align="center">

**Feito com 💚 para transformar vidas através do fitness**

⭐ Se este projeto foi útil para você, considere dar uma estrela!

</div>

#   g y m r a t s  
 