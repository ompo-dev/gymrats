# offline

- Caminho: `lib/offline`
- Finalidade: núcleo compartilhado de domínio/aplicação (clientes API, serviços, utilitários, offline e casos de uso).

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `command-logger.ts`: Arquivo da camada local.
- `command-migrations.ts`: Arquivo da camada local.
- `command-pattern.ts`: Arquivo da camada local.
- `indexeddb-storage.ts`: Arquivo da camada local.
- `offline-queue.ts`: Arquivo da camada local.
- `pending-actions.ts`: Arquivo da camada local.
- `sync-manager.ts`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `command-logger.ts`
- O que faz: implementa o módulo `command-logger.ts` da camada `offline`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `idb`, `./command-pattern`
- Expõe: `logCommand`, `updateCommandStatus`, `getCommandsByStatus`, `getRecentCommands`, `clearOldLogs`
- Comunica com: Observabilidade/logs
- Onde é usado/importado: `lib/offline/sync-manager.ts`, `stores/student-unified-store.ts`

### `command-migrations.ts`
- O que faz: implementa o módulo `command-migrations.ts` da camada `offline`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `./command-pattern`
- Expõe: `migrateCommand`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `stores/student-unified-store.ts`

### `command-pattern.ts`
- O que faz: implementa o módulo `command-pattern.ts` da camada `offline`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: sem imports relevantes detectados.
- Expõe: `isTemporaryId`, `createCommand`, `commandToSyncManager`
- Comunica com: Offline/sincronização
- Onde é usado/importado: `lib/offline/command-logger.ts`, `lib/offline/command-migrations.ts`, `stores/student-unified-store.ts`

### `indexeddb-storage.ts`
- O que faz: implementa o módulo `indexeddb-storage.ts` da camada `offline`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `idb`
- Expõe: `createIndexedDBStorage`, `migrateFromLocalStorage`
- Comunica com: Offline/sincronização
- Onde é usado/importado: `stores/student-unified-store.ts`

### `offline-queue.ts`
- O que faz: implementa o módulo `offline-queue.ts` da camada `offline`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `idb`
- Expõe: `getDB`, `addToQueue`, `removeFromQueue`, `getQueueItems`, `getQueueSize`, `incrementRetries`, `moveToFailed`, `clearFailed`
- Comunica com: Offline/sincronização
- Onde é usado/importado: `lib/offline/sync-manager.ts`

### `pending-actions.ts`
- O que faz: implementa o módulo `pending-actions.ts` da camada `offline`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `@/lib/types/student-unified`
- Expõe: `addPendingAction`, `removePendingAction`, `removePendingActionByQueueId`, `incrementPendingActionRetries`, `hasPendingActions`, `countPendingActionsByType`
- Comunica com: Offline/sincronização
- Onde é usado/importado: `stores/student-unified-store.ts`

### `sync-manager.ts`
- O que faz: implementa o módulo `sync-manager.ts` da camada `offline`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `@/lib/api/client`, `./command-logger`, `./offline-queue`
- Expõe: `generateIdempotencyKey`, `syncManager`, `syncQueue`
- Comunica com: Autenticação/sessão, HTTP interno/externo, Offline/sincronização
- Onde é usado/importado: `hooks/use-offline-action.ts`, `lib/api/client-offline.ts`, `stores/student-unified-store.ts`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
