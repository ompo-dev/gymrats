# education

- Caminho: `app/student/education`
- Finalidade: raiz do App Router com páginas, layouts e endpoints por filesystem routing.

## Subpastas
- `components/`: subdomínio de `app/student/education/components`.

## Arquivos
- `education-page.tsx`: Arquivo da camada local.
- `educational-lessons.tsx`: Arquivo da camada local.
- `muscle-explorer.tsx`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `education-page.tsx`
- O que faz: implementa o módulo `education-page.tsx` da camada `education`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `motion/react`, `@/components/animations/fade-in`, `@/components/animations/slide-in`, `@/components/molecules/cards/duo-card`, `@/lib/utils`
- Expõe: `EducationPage`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `educational-lessons.tsx`
- O que faz: implementa o módulo `educational-lessons.tsx` da camada `education`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `react`, `@/components/animations/fade-in`, `@/components/organisms/education/components/lesson-detail`, `@/components/organisms/education/components/lesson-filters`, `@/components/organisms/education/components/lesson-list`, `@/components/organisms/education/components/lesson-quiz`, `@/hooks/use-education-data`, `@/hooks/use-scroll-to-top`, `@/lib/educational-data`, `@/lib/types`
- Expõe: `EducationalLessons`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `muscle-explorer.tsx`
- O que faz: implementa o módulo `muscle-explorer.tsx` da camada `education`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `lucide-react`, `react`, `@/components/animations/fade-in`, `@/components/animations/slide-in`, `@/components/molecules/cards/section-card`, `@/components/molecules/selectors/option-selector`, `@/components/organisms/education/components/muscle/exercise-detail`, `@/components/organisms/education/components/muscle/exercise-list`, `@/components/organisms/education/components/muscle/muscle-detail`, `@/components/organisms/education/components/muscle/muscle-list`, `@/components/organisms/education/components/muscle/search-bar`, `@/lib/educational-data`
- Expõe: `MuscleExplorer`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
