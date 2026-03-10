# quiz

- Caminho: `components/organisms/education/components/quiz`
- Finalidade: biblioteca de componentes de UI e composição por camadas.

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `multiple-choice.tsx`: Arquivo da camada local.
- `true-false.tsx`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `multiple-choice.tsx`
- O que faz: implementa o componente `multiple-choice`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `MultipleChoice`, `useState`, `setIsCorrect`, `setSubmitted`, `onAnswer`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `react`, `@/components/atoms/buttons/button`, `@/lib/types`, `@/lib/utils`
- Expõe: `MultipleChoice`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `true-false.tsx`
- O que faz: implementa o componente `true-false`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `TrueFalse`, `useState`, `setIsCorrect`, `setSubmitted`, `onAnswer`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `react`, `@/components/atoms/buttons/button`, `@/lib/types`, `@/lib/utils`
- Expõe: `TrueFalse`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
