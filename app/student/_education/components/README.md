# components

- Caminho: `app/student/education/components`
- Finalidade: raiz do App Router com páginas, layouts e endpoints por filesystem routing.

## Subpastas
- `muscle/`: subdomínio de `app/student/education/components/muscle`.
- `quiz/`: subdomínio de `app/student/education/components/quiz`.

## Arquivos
- `lesson-detail.tsx`: Arquivo da camada local.
- `lesson-filters.tsx`: Arquivo da camada local.
- `lesson-list.tsx`: Arquivo da camada local.
- `lesson-quiz.tsx`: Arquivo da camada local.
- `markdown-renderer.tsx`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `lesson-detail.tsx`
- O que faz: implementa o módulo `lesson-detail.tsx` da camada `components`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `lucide-react`, `@/components/animations/fade-in`, `@/components/animations/slide-in`, `@/components/ui/button`, `@/components/ui/duo-card`, `@/components/ui/section-card`, `@/hooks/use-scroll-to-top`, `@/lib/types`, `@/lib/utils`, `./markdown-renderer`
- Expõe: `LessonDetail`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `lesson-filters.tsx`
- O que faz: implementa o módulo `lesson-filters.tsx` da camada `components`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `lucide-react`, `@/components/animations/slide-in`, `@/components/ui/option-selector`, `@/components/ui/section-card`
- Expõe: `LessonFilters`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `lesson-list.tsx`
- O que faz: implementa o módulo `lesson-list.tsx` da camada `components`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `lucide-react`, `motion/react`, `@/components/animations/slide-in`, `@/components/ui/duo-card`, `@/lib/types`, `@/lib/utils`
- Expõe: `LessonList`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `lesson-quiz.tsx`
- O que faz: implementa o módulo `lesson-quiz.tsx` da camada `components`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `lucide-react`, `react`, `@/components/animations/fade-in`, `@/components/animations/slide-in`, `@/components/ui/button`, `@/components/ui/duo-card`, `@/components/ui/section-card`, `@/hooks/use-scroll-to-top`, `@/lib/types`, `@/lib/utils`
- Expõe: `LessonQuiz`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `markdown-renderer.tsx`
- O que faz: implementa o módulo `markdown-renderer.tsx` da camada `components`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `react`
- Expõe: `MarkdownRenderer`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/education/components/lesson-detail.tsx`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
