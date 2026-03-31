# GymRats Mobile

App mobile Expo Router em SDK 54, com autenticação nativa e renderização 1:1 da superfície web dentro de `WebView`.

## Ambiente

- `EXPO_PUBLIC_WEB_URL`: URL da aplicação web
- `EXPO_PUBLIC_API_URL`: URL da API

Sem variáveis, o app usa os ambientes já documentados no repositório:

- web: `https://gym-rats-testes.vercel.app`
- api: `https://gymrats-production.up.railway.app`

## Scripts

- `npm run dev:mobile` ou `npm run --prefix apps/mobile start`
- `npm run dev:mobile:dev-client` se quiser forcar Dev Client
- `npm run --prefix apps/mobile ios`
- `npm run --prefix apps/mobile typecheck`
