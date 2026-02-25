# diet

- Caminho: `app/student/diet`
- Finalidade: raiz do App Router com páginas, layouts e endpoints por filesystem routing.

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `diet-page.tsx`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `diet-page.tsx`
- O que faz: implementa o módulo `diet-page.tsx` da camada `diet`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `lucide-react`, `react`, `@/components/molecules/cards/stat-card-large`, `@/components/organisms/modals/add-meal-modal`, `@/components/organisms/modals/food-search`, `@/components/organisms/trackers/nutrition-tracker`, `@/hooks/use-load-prioritized`, `@/hooks/use-modal-state`, `@/hooks/use-nutrition-handlers`, `@/hooks/use-student`
- Expõe: `DietPage`
- Comunica com: Offline/sincronização
- Onde é usado/importado: `app/student/page-content.tsx`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
