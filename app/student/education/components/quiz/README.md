# quiz

- Caminho: `app/student/education/components/quiz`
- Finalidade: raiz do App Router com páginas, layouts e endpoints por filesystem routing.

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `multiple-choice.tsx`: Arquivo da camada local.
- `true-false.tsx`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `multiple-choice.tsx`
- O que faz: implementa o módulo `multiple-choice.tsx` da camada `quiz`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `next/image`, `react`, `@/components/ui/button`, `@/lib/types`, `@/lib/utils`
- Expõe: `MultipleChoice`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `true-false.tsx`
- O que faz: implementa o módulo `true-false.tsx` da camada `quiz`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `lucide-react`, `react`, `@/components/ui/button`, `@/lib/types`, `@/lib/utils`
- Expõe: `TrueFalse`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
