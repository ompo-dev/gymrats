# progress

- Caminho: `app/api/workouts/[id]/progress`
- Finalidade: raiz do App Router com páginas, layouts e endpoints por filesystem routing.
- Endpoint base deste diretorio: `/api/workouts/[id]/progress`

## Subpastas
- `exercises/`: subdomínio de `app/api/workouts/[id]/progress/exercises`.

## Arquivos
- `route.ts`: Endpoint HTTP (App Router).

## Detalhamento técnico por arquivo

### `route.ts`
- O que faz: implementa o endpoint `/api/workouts/[id]/progress` com método(s) `POST, GET, DELETE`.
- Como: lê request, aplica validações/autorização e delega para handlers/casos de uso (ex.: `POST`, `resolve`, `saveWorkoutProgressHandler`, `GET`, `getWorkoutProgressHandler`), serializando resposta HTTP.
- Por que: isola a borda HTTP do núcleo de negócio e facilita evolução de contrato por rota.
- Importa principalmente: `next/server`, `@/lib/api/handlers/workouts.handler`
- Expõe: `POST`, `GET`, `DELETE`
- Comunica com: HTTP interno/externo
- Onde é usado/importado: resolvido automaticamente pelo App Router no path da pasta (sem import manual).

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
