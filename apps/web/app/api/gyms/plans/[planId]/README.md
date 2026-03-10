# [planId]

- Caminho: `app/api/gyms/plans/[planId]`
- Finalidade: raiz do App Router com páginas, layouts e endpoints por filesystem routing.
- Endpoint base deste diretorio: `/api/gyms/plans/[planId]`

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `route.ts`: Endpoint HTTP (App Router).

## Detalhamento técnico por arquivo

### `route.ts`
- O que faz: implementa o endpoint `/api/gyms/plans/[planId]` com método(s) `PATCH, DELETE`.
- Como: lê request, aplica validações/autorização e delega para handlers/casos de uso (ex.: `PATCH`, `getGymContext`, `json`, `findFirst`, `update`), serializando resposta HTTP.
- Por que: isola a borda HTTP do núcleo de negócio e facilita evolução de contrato por rota.
- Importa principalmente: `next/server`, `next/headers`, `@/lib/db`, `@/lib/utils/session`, `@/lib/utils/gym-context`
- Expõe: `PATCH`, `DELETE`
- Comunica com: Banco de dados (Prisma), HTTP interno/externo
- Onde é usado/importado: resolvido automaticamente pelo App Router no path da pasta (sem import manual).

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
