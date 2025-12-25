# 🎯 PLANO DE AÇÃO - REFATORAÇÃO ATOMIC DESIGN

## 📋 OBJETIVO

Refatorar toda a arquitetura de componentes seguindo Atomic Design, organizando em:
- **Atoms**: Componentes básicos e indivisíveis
- **Molecules**: Combinações simples de atoms
- **Organisms**: Componentes complexos formados por molecules e atoms
- **Templates**: Estruturas de layout
- **Pages**: Páginas completas

## 🔍 FASE 1: ANÁLISE E LIMPEZA

### 1.1 Verificar Uso de Componentes
- [ ] Buscar todos os imports de componentes
- [ ] Identificar componentes não utilizados
- [ ] Listar componentes duplicados ou similares
- [ ] Documentar dependências entre componentes

### 1.2 Remover Componentes Não Utilizados
- [ ] Excluir componentes não referenciados
- [ ] Verificar componentes de UI não usados
- [ ] Limpar imports órfãos

## 🏗️ FASE 2: ESTRUTURA ATOMIC DESIGN

### 2.1 Criar Estrutura de Pastas
```
components/
├── atoms/
│   ├── buttons/
│   ├── inputs/
│   ├── icons/
│   ├── typography/
│   └── ...
├── molecules/
│   ├── forms/
│   ├── cards/
│   ├── modals/
│   └── ...
├── organisms/
│   ├── navigation/
│   ├── sections/
│   ├── trackers/
│   └── ...
├── templates/
│   ├── layouts/
│   └── ...
└── pages/
    └── (componentes de página completos)
```

### 2.2 Mapear Componentes Atuais
- [ ] Classificar cada componente atual
- [ ] Identificar nível hierárquico
- [ ] Documentar relacionamentos

## 🔄 FASE 3: CONSOLIDAÇÃO E REUTILIZAÇÃO

### 3.1 Identificar Padrões
- [ ] Modais similares → Modal base
- [ ] Cards similares → Card base
- [ ] Forms similares → Form base
- [ ] Trackers similares → Tracker base

### 3.2 Criar Componentes Base
- [ ] Modal modular e dinâmico
- [ ] Card base configurável
- [ ] Form base reutilizável
- [ ] Tracker base extensível

### 3.3 Refatorar Componentes Existentes
- [ ] Usar componentes base criados
- [ ] Remover duplicações
- [ ] Controlar por props quando necessário

## 📦 FASE 4: REORGANIZAÇÃO

### 4.1 Mover Componentes para Estrutura Atomic
- [ ] Atoms: botões, inputs, ícones, etc.
- [ ] Molecules: cards básicos, forms simples, etc.
- [ ] Organisms: navegação, seções complexas, etc.
- [ ] Templates: layouts principais
- [ ] Pages: componentes de página

### 4.2 Atualizar Imports
- [ ] Atualizar todos os imports
- [ ] Criar barrel exports (index.ts)
- [ ] Verificar quebra de dependências

## ✅ FASE 5: VALIDAÇÃO E TESTES

### 5.1 Verificar Funcionamento
- [ ] Testar todas as páginas
- [ ] Verificar componentes funcionando
- [ ] Corrigir erros de import

### 5.2 Documentação
- [ ] Documentar estrutura Atomic Design
- [ ] Criar guia de uso de componentes
- [ ] Atualizar README

## 📊 PROGRESSO

- [x] FASE 1: Análise e Limpeza
  - [x] Buscar todos os imports de componentes
  - [x] Identificar componentes não utilizados
  - [x] Remover componentes não utilizados (challenges, friends-list, leaderboard, social-feed)
  - [x] Documentar dependências entre componentes
- [x] FASE 2: Estrutura Atomic Design
  - [x] Criar estrutura de pastas (atoms, molecules, organisms, templates)
  - [x] Criar subpastas necessárias
  - [x] Criar componente base-modal.tsx
- [ ] FASE 3: Consolidação e Reutilização
  - [x] Criar base-modal.tsx
  - [ ] Criar base-card.tsx
  - [ ] Criar base-tracker.tsx
  - [ ] Refatorar modais para usar base-modal
- [ ] FASE 4: Reorganização
  - [ ] Mover atoms (buttons, inputs, modals, progress)
  - [ ] Mover molecules (cards, forms, selectors, badges)
  - [ ] Mover organisms (navigation, sections, trackers, modals, workout, home)
  - [ ] Mover templates (layouts)
  - [ ] Criar barrel exports (index.ts)
- [ ] FASE 5: Validação e Testes
  - [ ] Atualizar todos os imports
  - [ ] Testar todas as páginas
  - [ ] Corrigir erros
  - [ ] Documentar estrutura final

