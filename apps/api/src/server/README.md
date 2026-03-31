# server

- Caminho: `apps/api/src/server`
- Finalidade: runtime do backend separado.

## O que ficou vivo
- `app.ts`: bootstrap principal do servidor Elysia.
- `route-modules.ts`: registrador dos `apps/api/src/routes/**/route.ts` no runtime da API.
- `plugins/`: plugins realmente usados em producao (`cors`, `db`, `rate-limit`, `request-logger`).
- `handlers/students.ts`: helper de compatibilidade ainda reaproveitado por `students.handler.ts` para carga agregada.
- `utils/`: utilitarios ainda necessarios ao runtime remanescente (`logger`, `response`, `validation`).

## O que foi podado
- `server/routes/*`: removido.
- `server/workers/*`: removido.
- `auth-macro.ts` e `auth-roles.ts`: removidos.
- handlers antigos nao usados: removidos.

## Observacao
- O backend oficial agora responde por `apps/api/src/routes/**`, sem mount HTTP paralelo para auth, e nao depende mais de `apps/web`, `next/server` ou `next/headers`.
