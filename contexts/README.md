# contexts

- Caminho: `contexts`
- Finalidade: contexts React para estado transversal sem prop drilling.

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `active-gym-context.tsx`: Arquivo da camada local.
- `swipe-direction.tsx`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `active-gym-context.tsx`
- O que faz: define contexto React `active-gym-context` para estado compartilhado.
- Como: fornece provider e API de consumo para subárvores de componentes; operações detectadas: `ActiveGymProvider`, `useState`, `useCallback`, `setIsLoading`, `import`.
- Por que: evita prop drilling em estado transversal e mantém fronteira clara de responsabilidade.
- Importa principalmente: `react`, `react`
- Expõe: `ActiveGymProvider`, `useActiveGym`
- Comunica com: HTTP interno/externo
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `swipe-direction.tsx`
- O que faz: define contexto React `swipe-direction` para estado compartilhado.
- Como: fornece provider e API de consumo para subárvores de componentes; operações detectadas: `SwipeDirectionProvider`, `useSwipeDirection`, `useContext`, `Error`.
- Por que: evita prop drilling em estado transversal e mantém fronteira clara de responsabilidade.
- Importa principalmente: `react`
- Expõe: `SwipeDirectionProvider`, `useSwipeDirection`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/layout.tsx`, `app/student/layout.tsx`, `components/templates/layouts/app-layout.tsx`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
