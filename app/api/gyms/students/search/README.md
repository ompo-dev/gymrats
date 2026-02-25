# search

- Caminho: `app/api/gyms/students/search`
- Finalidade: raiz do App Router com páginas, layouts e endpoints por filesystem routing.
- Endpoint base deste diretorio: `/api/gyms/students/search`

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `route.ts`: Endpoint HTTP (App Router).

## Detalhamento técnico por arquivo

### `route.ts`
- O que faz: implementa o endpoint `/api/gyms/students/search` com método(s) `GET`.
- Como: lê request, aplica validações/autorização e delega para handlers/casos de uso (ex.: `GET`, `getGymContext`, `URL`, `get`, `toLowerCase`), serializando resposta HTTP.
- Por que: isola a borda HTTP do núcleo de negócio e facilita evolução de contrato por rota.
- Importa principalmente: `next/server`, `@/lib/db`, `@/lib/utils/gym-context`
- Expõe: `GET`
- Comunica com: Banco de dados (Prisma), HTTP interno/externo
- Onde é usado/importado: resolvido automaticamente pelo App Router no path da pasta (sem import manual).

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
