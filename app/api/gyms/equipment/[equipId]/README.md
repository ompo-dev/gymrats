# [equipId]

- Caminho: `app/api/gyms/equipment/[equipId]`
- Finalidade: raiz do App Router com páginas, layouts e endpoints por filesystem routing.
- Endpoint base deste diretorio: `/api/gyms/equipment/[equipId]`

## Subpastas
- `maintenance/`: subdomínio de `app/api/gyms/equipment/[equipId]/maintenance`.

## Arquivos
- `route.ts`: Endpoint HTTP (App Router).

## Detalhamento técnico por arquivo

### `route.ts`
- O que faz: implementa o endpoint `/api/gyms/equipment/[equipId]` com método(s) `PATCH, DELETE`.
- Como: lê request, aplica validações/autorização e delega para handlers/casos de uso (ex.: `PATCH`, `getGymContext`, `json`, `includes`, `findUnique`), serializando resposta HTTP.
- Por que: isola a borda HTTP do núcleo de negócio e facilita evolução de contrato por rota.
- Importa principalmente: `next/server`, `@/lib/db`, `@/lib/utils/session`, `@/lib/utils/gym-context`, `next/headers`
- Expõe: `PATCH`, `DELETE`
- Comunica com: Banco de dados (Prisma), HTTP interno/externo
- Onde é usado/importado: resolvido automaticamente pelo App Router no path da pasta (sem import manual).

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
