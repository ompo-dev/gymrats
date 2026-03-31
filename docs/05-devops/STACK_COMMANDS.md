# Stack Commands

## Visao geral

Os comandos abaixo operam o stack local do split:

- `web` em `http://localhost:3000`
- `api` em `http://localhost:4000`
- `worker` para jobs assincronos
- `redis` local para filas e cache
- `db` local opcional, desabilitado por padrao

O arquivo de ambiente padrao do stack e `.env.docker`.

## Fluxo recomendado

### 1. Inicializar o arquivo de ambiente

```bash
npm run stack:init
```

Cria `.env.docker` a partir de `.env.docker.example` se o arquivo ainda nao existir.

### 2. Buildar as imagens

```bash
npm run stack:build
```

Builda as imagens de `web`, `api`, `worker` e `cron`.

### 3. Revisar as migrations antes de aplicar

```bash
npm run migration:status
npm run migration:dry-run
```

Esses comandos leem `apps/web/scripts/migration` e mostram os scripts `apply-*.js` disponiveis.

### 4. Rodar migrations

```bash
npm run stack:migrate
```

Executa o runner canonico `apps/web/scripts/migration/run-stack-migrations.mjs --all`.

Esse runner:

- procura scripts `apply-*.js`
- executa em ordem alfabetica
- usa o mesmo `.env.docker` do stack

### 5. Subir o stack

```bash
npm run stack:up
```

Por padrao:

- rebuilda as imagens
- sobe os containers em background

Importante:

- `stack:up` nao roda migrations automaticamente
- `stack:update` tambem nao roda migrations automaticamente
- isso evita tocar no Supabase real sem um comando explicito

### 6. Verificar status

```bash
npm run stack:status
```

Lista os containers ativos do compose.

### 7. Acompanhar logs

```bash
npm run stack:logs
```

Segue os logs em tempo real.

### 8. Monitorar uso

```bash
npm run stack:monitor
```

Mostra `docker compose ps` e depois abre `docker stats`.

### 9. Derrubar o stack

```bash
npm run stack:down
```

Para e remove os containers do compose.

## Variantes uteis

Subir o stack de desenvolvimento:

```bash
npm run stack:dev:up
```

Parar o stack de desenvolvimento:

```bash
npm run stack:dev:down
```

Atualizar imagens e recriar:

```bash
npm run stack:update
```

Executar o cron manualmente:

```bash
npm run stack:cron
```

## Flags uteis

Usar Postgres local opcional:

```bash
npm run stack:up -- --local-db
```

Usar outro arquivo de ambiente:

```bash
npm run stack:doctor -- --env-file=.env.docker
```
