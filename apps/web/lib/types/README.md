# types

- Caminho: `lib/types`
- Finalidade: núcleo compartilhado de domínio/aplicação (clientes API, serviços, utilitários, offline e casos de uso).

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `reminder-notifications.ts`: Arquivo da camada local.
- `student-unified.ts`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `reminder-notifications.ts`
- O que faz: implementa o módulo `reminder-notifications.ts` da camada `types`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: sem imports relevantes detectados.
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `stores/reminders-store.ts`

### `student-unified.ts`
- O que faz: implementa o módulo `student-unified.ts` da camada `types`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `@/lib/types`
- Expõe: `initialStudentData`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/profile/profile-content.tsx`, `hooks/use-load-prioritized.ts`, `hooks/use-student.ts`, `lib/offline/pending-actions.ts`, `lib/utils/student-selectors.ts`, `lib/utils/student-transformers.ts`, `stores/student-unified-store.ts`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
