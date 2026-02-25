# muscle

- Caminho: `app/student/education/components/muscle`
- Finalidade: raiz do App Router com páginas, layouts e endpoints por filesystem routing.

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
- O que faz: implementa o módulo `exercise-detail.tsx` da camada `muscle`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `lucide-react`, `@/components/animations/fade-in`, `@/components/animations/slide-in`, `@/components/ui/duo-card`, `@/components/ui/section-card`, `@/lib/types`, `@/lib/utils`
- Expõe: `ExerciseDetail`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `exercise-list.tsx`
- O que faz: implementa o módulo `exercise-list.tsx` da camada `muscle`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `lucide-react`, `motion/react`, `@/components/animations/slide-in`, `@/components/ui/duo-card`, `@/lib/types`, `@/lib/utils`
- Expõe: `ExerciseList`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `muscle-detail.tsx`
- O que faz: implementa o módulo `muscle-detail.tsx` da camada `muscle`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `lucide-react`, `@/components/animations/fade-in`, `@/components/animations/slide-in`, `@/components/ui/duo-card`, `@/components/ui/section-card`, `@/lib/types`
- Expõe: `MuscleDetail`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `muscle-list.tsx`
- O que faz: implementa o módulo `muscle-list.tsx` da camada `muscle`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `lucide-react`, `motion/react`, `@/components/animations/slide-in`, `@/components/ui/duo-card`, `@/lib/types`
- Expõe: `MuscleList`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `search-bar.tsx`
- O que faz: implementa o módulo `search-bar.tsx` da camada `muscle`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `lucide-react`, `@/components/animations/slide-in`
- Expõe: `SearchBar`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
