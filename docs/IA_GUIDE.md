## Guia de Orientação para IA – Gymrats

Este arquivo orienta qualquer agente de IA sobre **onde buscar informações** neste repositório e **como raciocinar** antes de alterar código.

O objetivo é evitar soluções frágeis, respeitar a arquitetura existente e reutilizar ao máximo o que já foi modelado.

---

## 1. Ordem de pensamento obrigatória

Sempre siga esta ordem mental antes de sugerir/alterar algo:

1. **Domínio e problema real**
   - O que o usuário/aluno está tentando resolver? (treino, nutrição, progresso, pagamentos, etc.)
   - Esta mudança afeta dados persistidos, apenas UI, ou ambos?
2. **Restrições técnicas e não funcionais**
   - O sistema é **offline-first** e com **sincronização eventual** (não pode quebrar isso).
   - Experiência mobile-first, carregamento prioritizado e incremental.
3. **Arquitetura e separação de responsabilidades**
   - Regra de negócio **não** vai em componentes de UI ou hooks de UI.
   - Domínio fica em stores, handlers de API, comandos offline e modelos do banco.
4. **Falhas, limites, concorrência e consistência**
   - Pensar sempre em: offline, retry, idempotência, corrupção de dados, conflitos de versão.
5. **Só então frameworks, libs e código**
   - Next.js, React, Zustand, Prisma, etc. são detalhes de implementação.

Se uma mudança viola essa ordem, a IA deve **reprojetar** a solução antes de codar.

---

## 2. Onde buscar contexto de alto nível (documentação)

Antes de mexer em qualquer parte do sistema, consulte a documentação correspondente:

- **Visão geral, arquitetura e offline-first**
  - `docs/ANALISE_COMPLETA_PROJETO.md`: visão de negócio, escopo e objetivos gerais.
  - `docs/ARQUITETURA_COMPLETA_SISTEMA.md`: arquitetura **offline-first**, command pattern, sync, stores, rotas API, priorização de carregamento, deduplicação de requisições.

- **Dados do aluno (domínio student)**
  - `docs/datastudent/DADOS_STUDENT_COMPLETO.md`: modelagem de `Student`, progressos, pesos, históricos, etc.

- **API e backend**
  - `docs/api/API_COMPLETA.md`: panorama das rotas de API por domínio.
  - `docs/api-refactor-plan.md`: decisões de refactor, padrões de handlers e rotas específicas.

- **Frontend, componentes e design system**
  - `docs/components/ATOMIC_DESIGN_COMPLETO.md`: filosofia de organização (átomos, moléculas, organismos).
  - `docs/UI_UX_SYSTEM_DESIGN.md`: tokens de design, padrões de interação, componentes base (`Button`, `UnitSectionCard`, `WorkoutNodeButton`, `StatCardLarge`), princípios de UX.

- **Stores, hooks e carregamento de dados**
  - `docs/hookestore/HOOKS_STORE_COMPLETO.md`: como o estado global é organizado (Zustand, stores unificados).
  - `docs/hookestore/CARREGAMENTO_PRIORITIZADO.md` (referenciado na arquitetura): detalhes de `useLoadPrioritized`, `loadAllPrioritized`, deduplicação de requests.

- **Modais, nuqs e navegação baseada em search params**
  - `docs/nuqsmodals/NUQS_MODAIS_COMPLETO.md`: como funcionam modais e tabs via `nuqs` (query string).

- **Segurança, storage e infraestrutura**
  - `docs/SEGURANCA_LOCALSTORAGE.md`: o que pode ou não ir para `localStorage`, como tratar tokens, segurança no client.
  - `docs/SEED_DATABASE.md`: como povoar o banco, dados iniciais e suposições de domínio.
  - `docs/DOCKER.md`: como subir o ambiente via Docker (útil para qualquer mudança que precise de ambiente rodando).

- **IA / LLMs / features premium**
  - `docs/CHAT_IA_FLUXO_COMPLETO.md`: **documentação ponta a ponta** do chat de IA – APIs, componentes, páginas, regras, prompts, parsers e fluxos.
  - `docs/agno/ESTUDO_LLMS_FULL.md`: estudo de modelos, custos e decisões de LLM.
  - `docs/agno/PLANO_IMPLEMENTACAO_CHAT_IA.md`: arquitetura do chat de nutrição e treinos, rotas, prompts, parsers, custo, premium-check.
  - `docs/elysiajs/llms-full.txt`: referências adicionais de LLM/infra (se for integrar com Elysia ou services externos).

- **Processos de time**
  - `docs/COMMIT_CONVENTION.md`: como escrever mensagens de commit.
  - `docs/plan.md`: planos e roadmap macro do projeto.

Ao receber uma tarefa, a IA deve mapear rapidamente **qual seção acima é relevante** e ler esse `.md` antes de propor mudanças significativas.

---

## 3. Onde buscar no código (mapa mental por domínio)

Abaixo um mapa de **onde procurar primeiro** no código para cada tipo de tarefa. Sempre preferir ler os arquivos de domínio/caso de uso antes de mexer em UI.

- **Rotas e fluxo de páginas (Next.js App Router)**
  - Diretório: `app/`
  - Exemplos:
    - `app/student/page.tsx` / `app/student/page-content.tsx`: home/dashboard do aluno.
    - Outras subrotas de `student` (ex.: `learn`, `diet`, etc.) seguem o mesmo padrão.
  - Uso: quando a tarefa falar de **nova tela, nova página, novo fluxo**.

- **Componentes de UI**
  - Diretório: `components/`
  - Organização (Atomic Design + UI específicos):
    - `components/atoms/...`: `button`, ícones, inputs básicos. **Nunca** colocar regra de negócio aqui.
    - `components/molecules/...`: combinações simples de átomos (cards, itens de lista).
    - `components/organisms/...`: blocos maiores como modais, formulários complexos, listas.
    - `components/ui/...`: componentes compartilhados de UI com forte identidade visual (`unit-section-card`, `workout-node-button`, etc.).
  - Regra: se a mudança é apenas visual, manter a lógica fora desses componentes sempre que possível.

- **Estado global e lógica de sincronização**
  - Diretórios (a partir da arquitetura):
    - `stores/student-unified-store.ts`: fonte da verdade dos dados do aluno (Zustand).
    - `hooks/use-student.ts`, `hooks/use-student-initializer.ts`, `hooks/use-load-prioritized.ts`: como o frontend consome o store e controla carregamento.
    - `lib/offline/...`: `sync-manager`, fila offline, command pattern, logger, adapters de IndexedDB.
  - Uso: qualquer tarefa que envolva **alterar dados do aluno**, offline, retry, sincronização, idempotência.

- **Backend / APIs**
  - Diretórios:
    - `app/api/**`: rotas HTTP (Next.js).
    - `lib/api/handlers/**`: handlers com lógica de domínio para cada rota.
    - `lib/api/middleware/**`: autenticação, autorização, premium-check, etc.
    - `lib/utils/**`: utilitários de sessão, roles, responses, erros.
  - Uso: quando se fala em **nova regra de negócio**, **novo endpoint**, **refactor de API**.

- **IA / LLM**
  - Documentação completa: `docs/CHAT_IA_FLUXO_COMPLETO.md`.
  - Diretórios implementados:
    - `lib/ai/client.ts`: cliente DeepSeek com cache e retry.
    - `lib/ai/cache.ts`: estratégia de cache para prompts similares.
    - `lib/ai/prompts/*.ts`: prompts para nutrição, treinos.
    - `lib/ai/parsers/*.ts`: parse e mapeamento de respostas de IA para estruturas do domínio.
    - `app/api/nutrition/chat/route.ts`: rota de chat de nutrição.
    - `app/api/workouts/chat/route.ts`, `app/api/workouts/chat-stream/route.ts`: rotas de chat de treinos.
    - `app/api/workouts/process/route.ts`: processamento de comandos de treino.
    - `components/organisms/modals/food-search-chat.tsx`, `workout-chat.tsx`: modais de chat.
  - Sempre validar o que já foi implementado antes de recriar algo do plano.

---

## 4. Como a IA deve agir por tipo de tarefa

- **Alterar/estender regra de negócio**
  - Ler:
    - `docs/ARQUITETURA_COMPLETA_SISTEMA.md`
    - O `.md` específico do domínio (ex.: `DADOS_STUDENT_COMPLETO.md`, `API_COMPLETA.md`).
  - Procurar:
    - Handlers em `lib/api/handlers/**`.
    - Stores e hooks em `stores/**` e `hooks/**`.
  - Só depois tocar em componentes de UI.

- **Criar ou alterar tela / componente**
  - Ler:
    - `docs/UI_UX_SYSTEM_DESIGN.md`
    - `docs/components/ATOMIC_DESIGN_COMPLETO.md`
  - Procurar:
    - Componentes existentes em `components/**` que já resolvam parcialmente o problema.
  - Reutilizar padrões de:
    - Tokens de cor, tipografia, sombras, estados (`hover`, `active`, `disabled`, `loading`).

- **Trabalhar com offline-first / sync / performance de carregamento**
  - Ler:
    - `docs/ARQUITETURA_COMPLETA_SISTEMA.md`
    - `docs/hookestore/HOOKS_STORE_COMPLETO.md`
    - `docs/hookestore/CARREGAMENTO_PRIORITIZADO.md`
  - Garantir:
    - Não quebrar command pattern, idempotência, fila offline, retry, deduplicação de requests.

- **Funcionalidades de IA (chat de nutrição / treinos / novos fluxos LLM)**
  - Ler:
    - `docs/CHAT_IA_FLUXO_COMPLETO.md` (fluxo ponta a ponta)
    - `docs/agno/ESTUDO_LLMS_FULL.md`
    - `docs/agno/PLANO_IMPLEMENTACAO_CHAT_IA.md`
  - Verificar:
    - Cliente LLM em `lib/ai/client.ts`.
    - Parsers em `lib/ai/parsers/**`.
    - Prompts em `lib/ai/prompts/**`.
    - Rotas em `app/api/nutrition/chat`, `app/api/workouts/chat`, `app/api/workouts/chat-stream`, `app/api/workouts/process`.
  - Focar em:
    - Idempotência, custo por chamada, cache, fallback em caso de erro da IA.

- **Segurança, autenticação, premium e storage client-side**
  - Ler:
    - `docs/SEGURANCA_LOCALSTORAGE.md`
    - Se for premium: seções de premium-check no plano de IA ou docs de subscriptions.
  - Verificar:
    - Middleware de auth em `lib/api/middleware/**`.
    - Utilitários de sessão/role em `lib/utils/**`.
  - Nunca:
    - Expor dados sensíveis em logs.
    - Guardar segredos em `localStorage`.

---

## 5. Regras gerais para a IA ao editar código

- **1. Nunca duplicar conceitos**
  - Antes de criar um novo store, hook, componente ou rota, procurar se já existe algo parecido.
  - Se encontrar algo similar, **evoluir** em vez de recriar.

- **2. Respeitar separação de camadas**
  - Regra de negócio:
    - Fica em handlers, stores, comandos, parsers.
  - UI:
    - Focada em exibir estado e disparar ações; sem regra de negócio complexa.

- **3. Pensar em offline, retry e idempotência**
  - Qualquer operação de escrita:
    - Deve ser segura para retries.
    - Não deve quebrar caso seja executada duas vezes.
    - Deve funcionar em cenários offline-first (fila, commands).

- **4. Não quebrar o design system**
  - Sempre reutilizar:
    - `Button`, `UnitSectionCard`, `WorkoutNodeButton`, `StatCardLarge` e outros componentes base onde fizer sentido.
  - Novos componentes devem:
    - Usar os mesmos tokens (cores, raios, sombras, tipografia).

- **5. Documentar decisões relevantes**
  - Ao introduzir:
    - Novo padrão de UX → atualizar `UI_UX_SYSTEM_DESIGN.md`.
    - Novo fluxo offline/sync → atualizar `ARQUITETURA_COMPLETA_SISTEMA.md` ou docs de `hookestore`.
    - Nova funcionalidade de IA → atualizar `docs/agno/*`.

---

## 6. Como interpretar este guia

- Este arquivo **não substitui** os outros `.md`, ele é um **índice inteligente para IA**.
- Diante de qualquer tarefa, a IA deve:
  1. Classificar o tipo de problema (domínio, UI, offline, IA, etc.).
  2. Ir às seções deste guia para descobrir **quais docs e diretórios** são relevantes.
  3. Ler os documentos apontados.
  4. Só então propor alterações de código, sempre respeitando a arquitetura já estabelecida.

Se houver dúvida entre “inventar algo novo” e “seguir o que já foi decidido em documentação”, a IA deve **sempre priorizar o que já está documentado** e apenas propor alterações estruturais quando houver motivo forte e explícito.

