# Redeploy

## Docker local

Para rebuildar imagens e recriar containers:

```bash
npm run stack:update
```

Para rebuildar e subir apenas um servico:

```bash
npm run stack:build -- web
npm run stack:up -- web --build
```

Ou:

```bash
npm run stack:build -- api
npm run stack:up -- api --build
```

## Railway

O projeto nao possui CLI do Railway configurada no repo. O fluxo atual e:

1. atualizar as envs do servico no painel
2. disparar `Redeploy` no servico
3. validar `healthz`

Para esta mudanca, redeploy minimo:

- API
- Worker e Cron apenas se voce alterar envs compartilhadas que eles usam

## Vercel

O projeto tambem nao possui CLI operacional da Vercel configurada aqui para producao. O fluxo atual e:

1. atualizar envs no painel da Vercel
2. disparar novo deploy
3. validar o dominio publico e as chamadas `/api/*`

## Validacoes depois do deploy

- `BETTER_AUTH_URL` aponta para a Vercel
- `API_PROXY_TARGET` aponta para o Railway
- browser chama `https://<app>/api/...`
- SSR continua funcional com `API_INTERNAL_URL`
- login Google, callback e logout funcionando
