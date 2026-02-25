# muscle

- Caminho: `components/organisms/education/components/muscle`
- Finalidade: biblioteca de componentes de UI e composição por camadas.

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `exercise-detail.tsx`: Arquivo da camada local.
- `exercise-list.tsx`: Arquivo da camada local.
- `muscle-detail.tsx`: Arquivo da camada local.
- `muscle-list.tsx`: Arquivo da camada local.
- `search-bar.tsx`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `exercise-detail.tsx`
- O que faz: implementa o componente `exercise-detail`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `ExerciseDetail`, `cn`, `getDifficultyClasses`, `map`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `@/components/animations/fade-in`, `@/components/animations/slide-in`, `@/components/molecules/cards/duo-card`, `@/components/molecules/cards/section-card`, `@/lib/types`, `@/lib/utils`
- Expõe: `ExerciseDetail`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/education/muscle-explorer.tsx`, `components/organisms/education/muscle-explorer.tsx`

### `exercise-list.tsx`
- O que faz: implementa o componente `exercise-list`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `ExerciseList`, `map`, `onExerciseSelect`, `cn`, `getDifficultyClasses`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `motion/react`, `@/components/animations/slide-in`, `@/components/molecules/cards/duo-card`, `@/lib/types`, `@/lib/utils`
- Expõe: `ExerciseList`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/education/muscle-explorer.tsx`, `components/organisms/education/muscle-explorer.tsx`

### `muscle-detail.tsx`
- O que faz: implementa o componente `muscle-detail`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `MuscleDetail`, `map`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `@/components/animations/fade-in`, `@/components/animations/slide-in`, `@/components/molecules/cards/duo-card`, `@/components/molecules/cards/section-card`, `@/lib/types`
- Expõe: `MuscleDetail`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/education/muscle-explorer.tsx`, `components/organisms/education/muscle-explorer.tsx`

### `muscle-list.tsx`
- O que faz: implementa o componente `muscle-list`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `MuscleList`, `map`, `onMuscleSelect`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `motion/react`, `@/components/animations/slide-in`, `@/components/molecules/cards/duo-card`, `@/lib/types`
- Expõe: `MuscleList`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/education/muscle-explorer.tsx`, `components/organisms/education/muscle-explorer.tsx`

### `search-bar.tsx`
- O que faz: implementa o componente `search-bar`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `SearchBar`, `onChange`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `@/components/animations/slide-in`
- Expõe: `SearchBar`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/education/muscle-explorer.tsx`, `components/organisms/education/muscle-explorer.tsx`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
