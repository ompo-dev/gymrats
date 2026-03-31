# units

- Caminho: `app/api/workouts/units`
- Finalidade: raiz do App Router com páginas, layouts e endpoints por filesystem routing.
- Endpoint base deste diretorio: `/api/workouts/units`

## Subpastas
- `[id]/`: subdomínio de `app/api/workouts/units/[id]`.

## Arquivos
- `route.ts`: Endpoint HTTP (App Router).

## Detalhamento técnico por arquivo

### `route.ts`
- O que faz: implementa o endpoint `/api/workouts/units` com método(s) `GET, POST`.
- Como: lê request, aplica validações/autorização e delega para handlers/casos de uso (ex.: `GET`, `getUnitsHandler`, `POST`, `createUnitHandler`), serializando resposta HTTP.
- Por que: isola a borda HTTP do núcleo de negócio e facilita evolução de contrato por rota.
- Importa principalmente: `next/server`, `@/lib/api/handlers/workout-management.handler`, `@/lib/api/handlers/workouts.handler`
- Expõe: `GET`, `POST`
- Comunica com: HTTP interno/externo
- Onde é usado/importado: resolvido automaticamente pelo App Router no path da pasta (sem import manual).

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
