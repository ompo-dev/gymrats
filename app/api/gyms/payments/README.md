# payments

- Caminho: `app/api/gyms/payments`
- Finalidade: raiz do App Router com páginas, layouts e endpoints por filesystem routing.
- Endpoint base deste diretorio: `/api/gyms/payments`

## Subpastas
- `[paymentId]/`: subdomínio de `app/api/gyms/payments/[paymentId]`.

## Arquivos
- `route.ts`: Endpoint HTTP (App Router).

## Detalhamento técnico por arquivo

### `route.ts`
- O que faz: implementa o endpoint `/api/gyms/payments` com método(s) `métodos não detectados`.
- Como: lê request, aplica validações/autorização e delega para handlers/casos de uso (ex.: `createSafeHandler`, `getPayments`, `json`, `createPayment`), serializando resposta HTTP.
- Por que: isola a borda HTTP do núcleo de negócio e facilita evolução de contrato por rota.
- Importa principalmente: `next/server`, `@/lib/api/utils/api-wrapper`, `@/lib/services/gym-domain.service`, `@/lib/api/schemas/gyms.schemas`
- Expõe: `GET`, `POST`
- Comunica com: HTTP interno/externo
- Onde é usado/importado: resolvido automaticamente pelo App Router no path da pasta (sem import manual).

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
