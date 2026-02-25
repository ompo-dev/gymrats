# education

- Caminho: `components/organisms/education`
- Finalidade: biblioteca de componentes de UI e composição por camadas.

## Subpastas
- `components/`: subdomínio de `components/organisms/education/components`.

## Arquivos
- `education-page.tsx`: Arquivo da camada local.
- `educational-lessons.tsx`: Arquivo da camada local.
- `index.ts`: Arquivo da camada local.
- `lesson-complete.tsx`: Arquivo da camada local.
- `lesson-header.tsx`: Arquivo da camada local.
- `muscle-explorer.tsx`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `education-page.tsx`
- O que faz: implementa o componente `education-page`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `EducationPage`, `onSelectView`, `cn`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `motion/react`, `@/components/animations/fade-in`, `@/components/animations/slide-in`, `@/components/molecules/cards/duo-card`, `@/lib/utils`
- Expõe: `EducationPage`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/page-content.tsx`, `components/organisms/education/index.ts`

### `educational-lessons.tsx`
- O que faz: implementa o componente `educational-lessons`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `EducationalLessons`, `useState`, `useEffect`, `find`, `setSelectedLesson`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `react`, `@/components/animations/fade-in`, `@/hooks/use-education-data`, `@/hooks/use-scroll-to-top`, `@/lib/educational-data`, `@/lib/types`, `./components/lesson-detail`, `./components/lesson-filters`, `./components/lesson-list`, `./components/lesson-quiz`
- Expõe: `EducationalLessons`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/page-content.tsx`, `components/organisms/education/index.ts`

### `index.ts`
- O que faz: implementa o componente `index`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: sem sinais relevantes detectados.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `./components`, `./education-page`, `./education-page`, `./educational-lessons`, `./educational-lessons`, `./muscle-explorer`, `./muscle-explorer`
- Expõe: `EducationPage`, `EducationalLessons`, `MuscleExplorer`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/organisms/index.ts`

### `lesson-complete.tsx`
- O que faz: implementa o componente `lesson-complete`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `LessonComplete`, `round`, `from`, `map`, `cn`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `@/components/atoms/buttons/button`, `@/lib/utils`
- Expõe: `LessonComplete`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `lesson-header.tsx`
- O que faz: implementa o componente `lesson-header`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `LessonHeader`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`
- Expõe: `LessonHeader`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `muscle-explorer.tsx`
- O que faz: implementa o componente `muscle-explorer`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `toLowerCase`, `MuscleExplorer`, `useState`, `useEffect`, `find`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `react`, `@/components/animations/fade-in`, `@/components/animations/slide-in`, `@/components/molecules/cards/section-card`, `@/components/molecules/selectors/option-selector`, `@/lib/educational-data`, `@/lib/types`, `./components/muscle/exercise-detail`, `./components/muscle/exercise-list`, `./components/muscle/muscle-detail`, `./components/muscle/muscle-list`
- Expõe: `MuscleExplorer`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/page-content.tsx`, `components/organisms/education/index.ts`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
