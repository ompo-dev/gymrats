# admin

- Caminho: `components/admin`
- Finalidade: biblioteca de componentes de UI e composição por camadas.

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `admin-only.tsx`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `admin-only.tsx`
- O que faz: implementa o componente `admin-only`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `AdminOnly`, `useUserSession`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `react`, `@/hooks/use-user-session`
- Expõe: `AdminOnly`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/page-content.tsx`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
