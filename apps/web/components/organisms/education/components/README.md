# components

- Caminho: `components/organisms/education/components`
- Finalidade: biblioteca de componentes de UI e composição por camadas.

## Subpastas
- `muscle/`: subdomínio de `components/organisms/education/components/muscle`.
- `quiz/`: subdomínio de `components/organisms/education/components/quiz`.

## Arquivos
- `index.ts`: Arquivo da camada local.
- `lesson-detail.tsx`: Arquivo da camada local.
- `lesson-filters.tsx`: Arquivo da camada local.
- `lesson-list.tsx`: Arquivo da camada local.
- `lesson-quiz.tsx`: Arquivo da camada local.
- `markdown-renderer.tsx`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `index.ts`
- O que faz: implementa o componente `index`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: sem sinais relevantes detectados.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `./lesson-detail`, `./lesson-detail`, `./lesson-filters`, `./lesson-filters`, `./lesson-list`, `./lesson-list`, `./lesson-quiz`, `./lesson-quiz`, `./markdown-renderer`
- Expõe: `LessonDetail`, `LessonFilters`, `LessonList`, `LessonQuiz`, `MarkdownRenderer`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/organisms/education/index.ts`

### `lesson-detail.tsx`
- O que faz: implementa o componente `lesson-detail`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `LessonDetail`, `useScrollToTop`, `getCategoryColor`, `getCategoryIcon`, `cn`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `@/components/animations/fade-in`, `@/components/animations/slide-in`, `@/components/atoms/buttons/button`, `@/components/molecules/cards/duo-card`, `@/components/molecules/cards/section-card`, `@/hooks/use-scroll-to-top`, `@/lib/types`, `@/lib/utils`, `./markdown-renderer`
- Expõe: `LessonDetail`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/education/educational-lessons.tsx`, `components/organisms/education/components/index.ts`, `components/organisms/education/educational-lessons.tsx`

### `lesson-filters.tsx`
- O que faz: implementa o componente `lesson-filters`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `LessonFilters`, `onSearchChange`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `@/components/animations/slide-in`, `@/components/molecules/cards/section-card`, `@/components/molecules/selectors/option-selector`
- Expõe: `LessonFilters`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/education/educational-lessons.tsx`, `components/organisms/education/components/index.ts`, `components/organisms/education/educational-lessons.tsx`

### `lesson-list.tsx`
- O que faz: implementa o componente `lesson-list`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `LessonList`, `map`, `onLessonSelect`, `entries`, `cn`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `motion/react`, `@/components/animations/slide-in`, `@/components/molecules/cards/duo-card`, `@/lib/types`, `@/lib/utils`
- Expõe: `LessonList`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/education/educational-lessons.tsx`, `components/organisms/education/components/index.ts`, `components/organisms/education/educational-lessons.tsx`

### `lesson-quiz.tsx`
- O que faz: implementa o componente `lesson-quiz`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `LessonQuiz`, `useState`, `useScrollToTop`, `forEach`, `setQuizScore`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `react`, `@/components/animations/fade-in`, `@/components/animations/slide-in`, `@/components/atoms/buttons/button`, `@/components/molecules/cards/duo-card`, `@/components/molecules/cards/section-card`, `@/hooks/use-scroll-to-top`, `@/lib/types`, `@/lib/utils`
- Expõe: `LessonQuiz`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/education/educational-lessons.tsx`, `components/organisms/education/components/index.ts`, `components/organisms/education/educational-lessons.tsx`

### `markdown-renderer.tsx`
- O que faz: implementa o componente `markdown-renderer`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `MarkdownRenderer`, `split`, `join`, `push`, `renderInlineMarkdown`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `react`
- Expõe: `MarkdownRenderer`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/organisms/education/components/index.ts`, `components/organisms/education/components/lesson-detail.tsx`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
