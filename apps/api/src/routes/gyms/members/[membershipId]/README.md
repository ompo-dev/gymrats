# [membershipId]

- Caminho: `app/api/gyms/members/[membershipId]`
- Finalidade: raiz do App Router com páginas, layouts e endpoints por filesystem routing.
- Endpoint base deste diretorio: `/api/gyms/members/[membershipId]`

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `route.ts`: Endpoint HTTP (App Router).

## Detalhamento técnico por arquivo

### `route.ts`
- O que faz: implementa o endpoint `/api/gyms/members/[membershipId]` com método(s) `PATCH, DELETE`.
- Como: lê request, aplica validações/autorização e delega para handlers/casos de uso (ex.: `PATCH`, `cookies`, `get`, `json`, `getGymContext`), serializando resposta HTTP.
- Por que: isola a borda HTTP do núcleo de negócio e facilita evolução de contrato por rota.
- Importa principalmente: `next/server`, `next/headers`, `@/lib/db`, `@/lib/utils/session`, `@/lib/utils/gym-context`
- Expõe: `PATCH`, `DELETE`
- Comunica com: Banco de dados (Prisma), Autenticação/sessão, HTTP interno/externo
- Onde é usado/importado: resolvido automaticamente pelo App Router no path da pasta (sem import manual).

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
