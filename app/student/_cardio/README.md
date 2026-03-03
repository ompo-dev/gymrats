# cardio

- Caminho: `app/student/cardio`
- Finalidade: raiz do App Router com páginas, layouts e endpoints por filesystem routing.

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `cardio-functional-page.tsx`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `cardio-functional-page.tsx`
- O que faz: implementa o módulo `cardio-functional-page.tsx` da camada `cardio`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `lucide-react`, `motion/react`, `react`, `@/components/animations/fade-in`, `@/components/animations/slide-in`, `@/components/molecules/cards/duo-card`, `@/components/molecules/cards/section-card`, `@/components/molecules/cards/stat-card-large`, `@/components/organisms/navigation/back-button`, `@/components/organisms/trackers/cardio-tracker`, `@/components/organisms/workout/functional-workout`, `@/lib/utils`
- Expõe: `CardioFunctionalPage`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/page-content.tsx`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
