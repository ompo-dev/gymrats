# reset-password

- Caminho: `app/api/auth/reset-password`
- Finalidade: raiz do App Router com páginas, layouts e endpoints por filesystem routing.
- Endpoint base deste diretorio: `/api/auth/reset-password`

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `route.ts`: Endpoint HTTP (App Router).

## Detalhamento técnico por arquivo

### `route.ts`
- O que faz: implementa o endpoint `/api/auth/reset-password` com método(s) `POST`.
- Como: lê request, aplica validações/autorização e delega para handlers/casos de uso (ex.: `POST`, `validateBody`, `resetPasswordUseCase`, `findUnique`, `delete`), serializando resposta HTTP.
- Por que: isola a borda HTTP do núcleo de negócio e facilita evolução de contrato por rota.
- Importa principalmente: `bcryptjs`, `next/server`, `@/lib/api/middleware/validation.middleware`, `@/lib/api/schemas`, `@/lib/db`, `@/lib/use-cases/auth`
- Expõe: `POST`
- Comunica com: Banco de dados (Prisma), Autenticação/sessão, HTTP interno/externo
- Onde é usado/importado: resolvido automaticamente pelo App Router no path da pasta (sem import manual).

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
