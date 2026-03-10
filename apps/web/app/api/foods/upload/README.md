# upload

- Caminho: `app/api/foods/upload`
- Finalidade: raiz do App Router com páginas, layouts e endpoints por filesystem routing.
- Endpoint base deste diretorio: `/api/foods/upload`

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `route.ts`: Endpoint HTTP (App Router).

## Detalhamento técnico por arquivo

### `route.ts`
- O que faz: implementa o endpoint `/api/foods/upload` com método(s) `POST`.
- Como: lê request, aplica validações/autorização e delega para handlers/casos de uso (ex.: `POST`, `requireAdmin`, `formData`, `get`, `text`), serializando resposta HTTP.
- Por que: isola a borda HTTP do núcleo de negócio e facilita evolução de contrato por rota.
- Importa principalmente: `node:fs`, `node:path`, `next/server`, `@/lib/api/middleware/auth.middleware`, `@/lib/api/utils/response.utils`, `@/lib/services/upload-foods-from-csv`
- Expõe: `POST`
- Comunica com: HTTP interno/externo
- Onde é usado/importado: resolvido automaticamente pelo App Router no path da pasta (sem import manual).

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
